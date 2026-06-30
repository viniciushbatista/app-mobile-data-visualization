"""
Servico de previsao de rebanho usando Facebook Prophet.

O Prophet preve apenas a quantidade de cabecas de animais.
O potencial energetico e calculado via PrevisaoService.potencial_de_previsao().

Decisoes de design:
- yearly_seasonality=False  (dados anuais, 1 ponto/ano — sem sub-sazonalidade)
- weekly/daily=False         (idem)
- changepoint_prior_scale=0.05 (conservador, evita overfitting em series curtas)
- Cache em memoria com chave "tipo:id:substrato" para evitar retreinamento por request
- Horizonte default ate 2030 (6 anos), maximo viavel ate 2035
- Transformacao log: treina em log(y+1) para garantir previsoes sempre positivas
- Filtro temporal: usa apenas dados a partir de ANO_INICIO_DEFAULT (2000) por padrao
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from math import exp, log1p, sqrt

import numpy as np
import pandas as pd
from prophet import Prophet
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import RebanhoMunicipio, VwRebanhoMesorregiao
from app.repositories import RebanhoRepository
from app.services.energia_service import EnergiaService
from app.services.previsao_service import PrevisaoService

logger = logging.getLogger(__name__)

# Suprime logs verbosos do Prophet/Stan
logging.getLogger("prophet").setLevel(logging.WARNING)
logging.getLogger("cmdstanpy").setLevel(logging.WARNING)

# ---------- Cache global (invalidado via limpar_cache) ----------
_model_cache: dict[str, "Prophet"] = {}


def limpar_cache() -> None:
    """Chamado apos /admin/seed para invalidar modelos treinados."""
    _model_cache.clear()
    logger.info("Cache de modelos Prophet limpo.")


# ---------- Dataclasses de resultado ----------

@dataclass(frozen=True)
class ResultadoPrevisao:
    ano: int
    quantidade_prevista: float
    limite_inferior: float
    limite_superior: float
    potencial_tj: float | None = None
    desvio_padrao: float | None = None      # σ implícito do intervalo 80% do Prophet
    tolerancia_1sigma: float | None = None  # ±1σ (~68%)
    tolerancia_2sigma: float | None = None  # ±2σ (~95%)


@dataclass(frozen=True)
class MetricasValidacao:
    mae: float
    mape: float
    rmse: float
    n_pontos_treino: int
    n_pontos_validacao: int


@dataclass(frozen=True)
class HistoricoItem:
    ano: int
    quantidade: float


@dataclass(frozen=True)
class PrevisaoCompleta:
    tipo: str  # "mesorregiao" ou "municipio"
    identificador: str
    substrato: str
    historico: list[HistoricoItem]
    previsoes: list[ResultadoPrevisao]
    metricas: MetricasValidacao | None = None


# ---------- Servico ----------

class ProphetService:
    """Treina e gera previsoes de cabecas de animais usando Prophet."""

    ANO_ULTIMO_DADO = 2024  # ultimo ano no dataset IBGE/PPM
    HORIZONTE_DEFAULT = 2030
    HORIZONTE_MAX = 2035
    ANO_INICIO_DEFAULT = 2000  # filtra dados antigos que distorcem previsoes

    def __init__(self, db: Session) -> None:
        self.db = db
        self.rebanho_repo = RebanhoRepository(db)
        self.previsao_svc = PrevisaoService(db)
        self.energia_svc = EnergiaService(db)

    # ---- Preparacao de dados ----

    @staticmethod
    def _filtrar_por_ano(df: pd.DataFrame, ano_inicio: int) -> pd.DataFrame:
        """Filtra DataFrame para manter apenas dados a partir de ano_inicio."""
        mask = df["ds"].dt.year >= ano_inicio
        df_filtrado = df[mask].copy()
        if df_filtrado.empty:
            return df  # se nao tem dados recentes, retorna tudo
        return df_filtrado

    @staticmethod
    def _aplicar_log(df: pd.DataFrame) -> pd.DataFrame:
        """Transforma y -> log(y + 1) para garantir previsoes positivas."""
        df = df.copy()
        df["y"] = np.log1p(df["y"].clip(lower=0))  # log(1 + y), clip evita log de negativo
        return df

    @staticmethod
    def _reverter_log(valor: float) -> float:
        """Reverte log: exp(valor) - 1."""
        return float(np.expm1(valor))  # exp(valor) - 1

    def _serie_mesorregiao(
        self, mesorregiao: str, substrato: str
    ) -> pd.DataFrame:
        """Busca serie historica agregada de uma mesorregiao/substrato."""
        rows = (
            self.db.query(
                VwRebanhoMesorregiao.ano,
                VwRebanhoMesorregiao.quantidade,
            )
            .filter(
                VwRebanhoMesorregiao.mesorregiao == mesorregiao,
                VwRebanhoMesorregiao.substrato == substrato,
            )
            .order_by(VwRebanhoMesorregiao.ano)
            .all()
        )
        if not rows:
            raise ValueError(
                f"Sem dados historicos para mesorregiao '{mesorregiao}' "
                f"e substrato '{substrato}'"
            )
        return pd.DataFrame(
            [{"ds": datetime(r.ano, 7, 1), "y": float(r.quantidade)} for r in rows]
        )

    def _serie_municipio(
        self, codigo_ibge: int, substrato: str
    ) -> pd.DataFrame:
        """Busca serie historica de um municipio/substrato."""
        rows = (
            self.db.query(
                RebanhoMunicipio.ano,
                func.sum(RebanhoMunicipio.quantidade).label("total"),
            )
            .filter(
                RebanhoMunicipio.codigo_ibge == codigo_ibge,
                RebanhoMunicipio.substrato == substrato,
                RebanhoMunicipio.dado_disponivel.is_(True),
                RebanhoMunicipio.quantidade.isnot(None),
            )
            .group_by(RebanhoMunicipio.ano)
            .order_by(RebanhoMunicipio.ano)
            .all()
        )
        if not rows:
            raise ValueError(
                f"Sem dados historicos para municipio '{codigo_ibge}' "
                f"e substrato '{substrato}'"
            )
        return pd.DataFrame(
            [{"ds": datetime(r.ano, 7, 1), "y": float(r.total)} for r in rows]
        )

    # ---- Treinamento ----

    @staticmethod
    def _treinar(
        df: pd.DataFrame,
        changepoint_prior_scale: float = 0.05,
        usar_log: bool = True,
    ) -> Prophet:
        """Treina um modelo Prophet para dados anuais.

        Se usar_log=True, treina em escala logaritmica log(y+1)
        para garantir previsoes sempre positivas.
        """
        df_treino = df.copy()
        if usar_log:
            df_treino = ProphetService._aplicar_log(df_treino)

        model = Prophet(
            yearly_seasonality=False,
            weekly_seasonality=False,
            daily_seasonality=False,
            changepoint_prior_scale=changepoint_prior_scale,
            interval_width=0.80,  # intervalo de confianca de 80%
        )
        model.fit(df_treino)
        return model

    def _obter_modelo(
        self, cache_key: str, df: pd.DataFrame
    ) -> Prophet:
        """Retorna modelo do cache ou treina um novo."""
        if cache_key in _model_cache:
            logger.debug("Cache hit para %s", cache_key)
            return _model_cache[cache_key]

        logger.info("Treinando modelo Prophet para %s (%d pontos)", cache_key, len(df))
        model = self._treinar(df)
        _model_cache[cache_key] = model
        return model

    # ---- Previsao ----

    def _gerar_previsoes(
        self,
        model: Prophet,
        df_treino: pd.DataFrame,
        horizonte_ano: int,
        usar_log: bool = True,
    ) -> list[ResultadoPrevisao]:
        """Gera previsoes do ultimo ano historico ate horizonte_ano.

        Se usar_log=True, o modelo foi treinado em escala log.
        As previsoes sao revertidas com exp(yhat) - 1.
        """
        ultimo_ano_treino = df_treino["ds"].max().year
        n_periodos = horizonte_ano - ultimo_ano_treino
        if n_periodos <= 0:
            return []

        # Prophet precisa de datas futuras
        future_dates = pd.DataFrame(
            {"ds": [datetime(ultimo_ano_treino + i, 7, 1) for i in range(1, n_periodos + 1)]}
        )
        forecast = model.predict(future_dates)

        resultados = []
        for _, row in forecast.iterrows():
            ano = row["ds"].year

            if usar_log:
                # Reverter transformacao log: exp(yhat) - 1
                yhat = max(0.0, self._reverter_log(float(row["yhat"])))
                yhat_lower = max(0.0, self._reverter_log(float(row["yhat_lower"])))
                yhat_upper = max(0.0, self._reverter_log(float(row["yhat_upper"])))
            else:
                yhat = max(0.0, float(row["yhat"]))
                yhat_lower = max(0.0, float(row["yhat_lower"]))
                yhat_upper = max(0.0, float(row["yhat_upper"]))

            # Desvio padrão implícito: para intervalo de 80%,
            # (upper - lower) = 2 * z_{0.9} * sigma, onde z_{0.9} ≈ 1.2816
            sigma = (yhat_upper - yhat_lower) / (2 * 1.2816)
            sigma = round(sigma, 2)

            resultados.append(
                ResultadoPrevisao(
                    ano=ano,
                    quantidade_prevista=round(yhat, 0),
                    limite_inferior=round(yhat_lower, 0),
                    limite_superior=round(yhat_upper, 0),
                    desvio_padrao=sigma,
                    tolerancia_1sigma=round(sigma * 1.0, 2),   # ±1σ
                    tolerancia_2sigma=round(sigma * 2.0, 2),   # ±2σ
                )
            )
        return resultados

    def _adicionar_energia(
        self,
        previsoes: list[ResultadoPrevisao],
        substrato: str,
        *,
        municipio: str = "",
        mesorregiao: str = "",
        codigo_ibge: int = 0,
    ) -> list[ResultadoPrevisao]:
        """Calcula potencial TJ para cada previsao usando PrevisaoService."""
        resultados_com_energia = []
        for p in previsoes:
            try:
                resultado = self.previsao_svc.potencial_de_previsao(
                    substrato=substrato,
                    quantidade_prevista=p.quantidade_prevista,
                    municipio=municipio,
                    mesorregiao=mesorregiao,
                    codigo_ibge=codigo_ibge,
                    ano=p.ano,
                )
                resultados_com_energia.append(
                    ResultadoPrevisao(
                        ano=p.ano,
                        quantidade_prevista=p.quantidade_prevista,
                        limite_inferior=p.limite_inferior,
                        limite_superior=p.limite_superior,
                        potencial_tj=round(resultado.potencial_tj, 4),
                        desvio_padrao=p.desvio_padrao,
                        tolerancia_1sigma=p.tolerancia_1sigma,
                        tolerancia_2sigma=p.tolerancia_2sigma,
                    )
                )
            except ValueError:
                resultados_com_energia.append(p)
        return resultados_com_energia

    # ---- Validacao ----

    def _validar(
        self, df: pd.DataFrame, n_teste: int = 5
    ) -> MetricasValidacao | None:
        """Time-series cross-validation: treina em tudo exceto ultimos n anos."""
        if len(df) < n_teste + 5:
            return None  # dados insuficientes para validacao confiavel

        df_treino = df.iloc[:-n_teste].copy()
        df_teste = df.iloc[-n_teste:].copy()

        model = self._treinar(df_treino, usar_log=True)
        forecast = model.predict(self._aplicar_log(df_teste)[["ds"]])

        y_real = df_teste["y"].values
        # Reverter log das previsoes para comparar com valores reais
        y_pred = np.expm1(forecast["yhat"].values)

        erros = y_real - y_pred
        mae = float(abs(erros).mean())
        rmse = float(sqrt((erros**2).mean()))

        # MAPE evitando divisao por zero
        mask = y_real != 0
        if mask.any():
            mape = float((abs(erros[mask]) / y_real[mask]).mean() * 100)
        else:
            mape = 0.0

        return MetricasValidacao(
            mae=round(mae, 2),
            mape=round(mape, 2),
            rmse=round(rmse, 2),
            n_pontos_treino=len(df_treino),
            n_pontos_validacao=len(df_teste),
        )

    # ---- Metodos publicos ----

    def _historico_de_df(self, df: pd.DataFrame) -> list[HistoricoItem]:
        """Converte DataFrame Prophet (ds, y) em lista de HistoricoItem."""
        return [
            HistoricoItem(ano=row["ds"].year, quantidade=round(row["y"], 0))
            for _, row in df.iterrows()
        ]

    def prever_mesorregiao(
        self,
        mesorregiao: str,
        substrato: str,
        horizonte_ano: int | None = None,
        incluir_energia: bool = True,
        incluir_metricas: bool = True,
    ) -> PrevisaoCompleta:
        """Gera previsao para uma mesorregiao/substrato."""
        horizonte = min(
            horizonte_ano or self.HORIZONTE_DEFAULT,
            self.HORIZONTE_MAX,
        )

        df_completo = self._serie_mesorregiao(mesorregiao, substrato)
        df = self._filtrar_por_ano(df_completo, self.ANO_INICIO_DEFAULT)
        cache_key = f"meso:{mesorregiao}:{substrato}"
        model = self._obter_modelo(cache_key, df)

        previsoes = self._gerar_previsoes(model, df, horizonte, usar_log=True)

        if incluir_energia and previsoes:
            previsoes = self._adicionar_energia(
                previsoes, substrato, mesorregiao=mesorregiao
            )

        metricas = self._validar(df) if incluir_metricas else None

        return PrevisaoCompleta(
            tipo="mesorregiao",
            identificador=mesorregiao,
            substrato=substrato,
            historico=self._historico_de_df(df),
            previsoes=previsoes,
            metricas=metricas,
        )

    def prever_municipio(
        self,
        codigo_ibge: int,
        substrato: str,
        horizonte_ano: int | None = None,
        incluir_energia: bool = True,
        incluir_metricas: bool = True,
    ) -> PrevisaoCompleta:
        """Gera previsao para um municipio/substrato."""
        horizonte = min(
            horizonte_ano or self.HORIZONTE_DEFAULT,
            self.HORIZONTE_MAX,
        )

        # Buscar nome do municipio para metadata
        reg = (
            self.db.query(RebanhoMunicipio.municipio, RebanhoMunicipio.mesorregiao)
            .filter(RebanhoMunicipio.codigo_ibge == codigo_ibge)
            .first()
        )
        if reg is None:
            raise ValueError(f"Municipio nao encontrado: {codigo_ibge}")

        municipio_nome = reg.municipio
        mesorregiao_nome = reg.mesorregiao

        df_completo = self._serie_municipio(codigo_ibge, substrato)
        df = self._filtrar_por_ano(df_completo, self.ANO_INICIO_DEFAULT)
        cache_key = f"mun:{codigo_ibge}:{substrato}"
        model = self._obter_modelo(cache_key, df)

        previsoes = self._gerar_previsoes(model, df, horizonte, usar_log=True)

        if incluir_energia and previsoes:
            previsoes = self._adicionar_energia(
                previsoes,
                substrato,
                municipio=municipio_nome,
                mesorregiao=mesorregiao_nome,
                codigo_ibge=codigo_ibge,
            )

        metricas = self._validar(df) if incluir_metricas else None

        return PrevisaoCompleta(
            tipo="municipio",
            identificador=str(codigo_ibge),
            substrato=substrato,
            historico=self._historico_de_df(df),
            previsoes=previsoes,
            metricas=metricas,
        )
