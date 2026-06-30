"""
Endpoints de previsao de rebanho via Prophet.

GET /previsao/mesorregiao/{nome}?substrato=Bovino&horizonte=2030
GET /previsao/municipio/{codigo_ibge}?substrato=Bovino&horizonte=2030
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.previsao import (
    HistoricoItem,
    MetricasValidacao,
    PrevisaoItem,
    PrevisaoResponse,
)
from app.services.prophet_service import ProphetService, PrevisaoCompleta

router = APIRouter()


def _para_response(resultado: PrevisaoCompleta) -> PrevisaoResponse:
    """Converte dataclass interna para schema Pydantic."""
    return PrevisaoResponse(
        tipo=resultado.tipo,
        identificador=resultado.identificador,
        substrato=resultado.substrato,
        historico=[
            HistoricoItem(ano=h.ano, quantidade=h.quantidade)
            for h in resultado.historico
        ],
        previsoes=[
            PrevisaoItem(
                ano=p.ano,
                quantidade_prevista=p.quantidade_prevista,
                limite_inferior=p.limite_inferior,
                limite_superior=p.limite_superior,
                potencial_tj=p.potencial_tj,
                desvio_padrao=p.desvio_padrao,
                tolerancia_1sigma=p.tolerancia_1sigma,
                tolerancia_2sigma=p.tolerancia_2sigma,
            )
            for p in resultado.previsoes
        ],
        metricas=(
            MetricasValidacao(
                mae=resultado.metricas.mae,
                mape=resultado.metricas.mape,
                rmse=resultado.metricas.rmse,
                n_pontos_treino=resultado.metricas.n_pontos_treino,
                n_pontos_validacao=resultado.metricas.n_pontos_validacao,
            )
            if resultado.metricas
            else None
        ),
    )


@router.get("/mesorregiao/{nome}", response_model=PrevisaoResponse)
def previsao_mesorregiao(
    nome: str,
    substrato: str = Query(..., description="Ex: Bovino, Caprino, Ovino"),
    horizonte: int = Query(
        2030,
        ge=2025,
        le=2035,
        description="Ano final da previsao (max 2035)",
    ),
    incluir_energia: bool = Query(True, description="Calcular potencial TJ"),
    db: Session = Depends(get_db),
):
    """Previsao Prophet de cabecas de animais para uma mesorregiao."""
    try:
        service = ProphetService(db)
        resultado = service.prever_mesorregiao(
            mesorregiao=nome,
            substrato=substrato,
            horizonte_ano=horizonte,
            incluir_energia=incluir_energia,
        )
        return _para_response(resultado)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/municipio/{codigo_ibge}", response_model=PrevisaoResponse)
def previsao_municipio(
    codigo_ibge: int,
    substrato: str = Query(..., description="Ex: Bovino, Caprino, Ovino"),
    horizonte: int = Query(
        2030,
        ge=2025,
        le=2035,
        description="Ano final da previsao (max 2035)",
    ),
    incluir_energia: bool = Query(True, description="Calcular potencial TJ"),
    db: Session = Depends(get_db),
):
    """Previsao Prophet de cabecas de animais para um municipio."""
    try:
        service = ProphetService(db)
        resultado = service.prever_municipio(
            codigo_ibge=codigo_ibge,
            substrato=substrato,
            horizonte_ano=horizonte,
            incluir_energia=incluir_energia,
        )
        return _para_response(resultado)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
