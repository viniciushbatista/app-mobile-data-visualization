"""
Servico de potencial energetico a partir de dejetos animais.

Fluxo atual:  rebanho (IBGE) -> massa anual -> potencial TJ
Fluxo futuro:  Prophet -> cabecas previstas -> mesmas formulas abaixo
"""

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models import ParametrosSubstrato, RebanhoMunicipio
from app.repositories import ParametrosSubstratoRepository, RebanhoRepository
from app.services.energia_calculos import (
    calcular_massa_anual_kg,
    calcular_potencial_tj,
)


@dataclass(frozen=True)
class ResultadoEnergia:
    municipio: str
    mesorregiao: str
    codigo_ibge: int
    ano: int
    substrato: str
    cabecas: float
    massa_anual_kg: float
    pcs_kj_kg: float
    potencial_tj: float


@dataclass(frozen=True)
class ResultadoEnergiaMesorregiaoTotal:
    ano: int
    mesorregiao: str
    potencial_tj: float


class EnergiaService:
    def __init__(self, db: Session) -> None:
        self.rebanho_repo = RebanhoRepository(db)
        self.parametros_repo = ParametrosSubstratoRepository(db)

    def calcular_de_registro(
        self,
        registro: RebanhoMunicipio,
        parametros: ParametrosSubstrato,
        *,
        quantidade_override: float | None = None,
    ) -> ResultadoEnergia:
        """
        Calcula energia para um registro de rebanho.

        quantidade_override: usado pelo Prophet (cabecas previstas).
        """
        cabecas = float(
            quantidade_override
            if quantidade_override is not None
            else registro.quantidade
        )
        massa = calcular_massa_anual_kg(cabecas, parametros.dejeto_kg_dia)
        potencial = calcular_potencial_tj(massa, parametros.pcs_kj_kg)
        return ResultadoEnergia(
            municipio=registro.municipio,
            mesorregiao=registro.mesorregiao,
            codigo_ibge=registro.codigo_ibge,
            ano=registro.ano,
            substrato=registro.substrato,
            cabecas=cabecas,
            massa_anual_kg=massa,
            pcs_kj_kg=parametros.pcs_kj_kg,
            potencial_tj=potencial,
        )

    def calcular_de_cabecas(
        self,
        *,
        substrato: str,
        quantidade_animais: float,
        municipio: str = "",
        mesorregiao: str = "",
        codigo_ibge: int = 0,
        ano: int = 0,
    ) -> ResultadoEnergia:
        """Ponto de integracao com Prophet (apenas cabecas previstas)."""
        parametros = self.parametros_repo.obter_por_substrato(substrato)
        if parametros is None:
            raise ValueError(f"Parametros nao encontrados para substrato: {substrato}")

        massa = calcular_massa_anual_kg(quantidade_animais, parametros.dejeto_kg_dia)
        potencial = calcular_potencial_tj(massa, parametros.pcs_kj_kg)
        return ResultadoEnergia(
            municipio=municipio,
            mesorregiao=mesorregiao,
            codigo_ibge=codigo_ibge,
            ano=ano,
            substrato=substrato,
            cabecas=quantidade_animais,
            massa_anual_kg=massa,
            pcs_kj_kg=parametros.pcs_kj_kg,
            potencial_tj=potencial,
        )

    def _obter_parametros(self, substrato: str) -> ParametrosSubstrato:
        parametros = self.parametros_repo.obter_por_substrato(substrato)
        if parametros is None:
            raise ValueError(
                f"Parametros energeticos nao cadastrados para substrato: {substrato}"
            )
        return parametros

    def potencial_por_municipio(
        self,
        codigo_ibge: int,
        ano: int,
        substrato: str | None = None,
    ) -> list[ResultadoEnergia]:
        if not self.rebanho_repo.existe_municipio(codigo_ibge):
            raise ValueError(f"Municipio nao encontrado: {codigo_ibge}")

        registros = self.rebanho_repo.listar_por_municipio(
            codigo_ibge, ano, substrato
        )
        if not registros:
            raise ValueError(
                f"Sem dados de rebanho para municipio {codigo_ibge} no ano {ano}"
            )

        resultados: list[ResultadoEnergia] = []
        for registro in registros:
            parametros = self._obter_parametros(registro.substrato)
            resultados.append(self.calcular_de_registro(registro, parametros))
        return resultados

    def potencial_por_mesorregiao(
        self,
        mesorregiao: str,
        ano: int,
        substrato: str | None = None,
    ) -> tuple[float, list[ResultadoEnergia]]:
        if not self.rebanho_repo.existe_mesorregiao(mesorregiao):
            raise ValueError(f"Mesorregiao nao encontrada: {mesorregiao}")

        registros = self.rebanho_repo.listar_por_mesorregiao(
            mesorregiao, ano, substrato
        )
        if not registros:
            raise ValueError(
                f"Sem dados de rebanho para mesorregiao {mesorregiao} no ano {ano}"
            )

        detalhes: list[ResultadoEnergia] = []
        for registro in registros:
            parametros = self._obter_parametros(registro.substrato)
            detalhes.append(self.calcular_de_registro(registro, parametros))

        potencial_total_tj = sum(r.potencial_tj for r in detalhes)
        return potencial_total_tj, detalhes

    def potencial_total_por_mesorregiao_no_ano(
        self, ano: int
    ) -> list[ResultadoEnergiaMesorregiaoTotal]:
        mesorregioes = self.rebanho_repo.listar_mesorregioes_por_ano(ano)
        if not mesorregioes:
            raise ValueError(f"Sem dados de rebanho para o ano {ano}")

        resultados: list[ResultadoEnergiaMesorregiaoTotal] = []
        for nome in mesorregioes:
            total_tj, _ = self.potencial_por_mesorregiao(nome, ano)
            resultados.append(
                ResultadoEnergiaMesorregiaoTotal(
                    ano=ano,
                    mesorregiao=nome,
                    potencial_tj=total_tj,
                )
            )
        return resultados
