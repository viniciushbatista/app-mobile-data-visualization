"""Schemas Pydantic para os endpoints de previsão Prophet."""

from pydantic import BaseModel, Field


class MetricasValidacao(BaseModel):
    mae: float = Field(..., description="Mean Absolute Error")
    mape: float = Field(..., description="Mean Absolute Percentage Error (%)")
    rmse: float = Field(..., description="Root Mean Squared Error")
    n_pontos_treino: int
    n_pontos_validacao: int


class PrevisaoItem(BaseModel):
    ano: int
    quantidade_prevista: float = Field(..., description="Cabeças previstas pelo Prophet")
    limite_inferior: float = Field(..., description="Intervalo de confiança inferior (80%)")
    limite_superior: float = Field(..., description="Intervalo de confiança superior (80%)")
    potencial_tj: float | None = Field(
        None, description="Potencial energético calculado a partir das cabeças previstas (TJ)"
    )
    desvio_padrao: float | None = Field(
        None, description="Desvio padrão implícito derivado do intervalo de confiança 80% do Prophet"
    )
    tolerancia_1sigma: float | None = Field(
        None, description="Tolerância ±1σ em torno da previsão (68.27%)"
    )
    tolerancia_2sigma: float | None = Field(
        None, description="Tolerância ±2σ em torno da previsão (95.45%)"
    )


class HistoricoItem(BaseModel):
    ano: int
    quantidade: float = Field(..., description="Quantidade real (IBGE)")


class PrevisaoResponse(BaseModel):
    tipo: str = Field(..., description="'mesorregiao' ou 'municipio'")
    identificador: str = Field(..., description="Nome da mesorregião ou código IBGE")
    substrato: str
    historico: list[HistoricoItem]
    previsoes: list[PrevisaoItem]
    metricas: MetricasValidacao | None = None
