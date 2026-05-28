from pydantic import BaseModel, Field


class EnergiaMunicipioItem(BaseModel):
    municipio: str
    mesorregiao: str
    codigo_ibge: int
    ano: int
    substrato: str
    cabecas: float
    massa_anual_kg: float = Field(..., description="Massa anual de dejetos (kg)")
    pcs_kj_kg: float = Field(..., description="Poder calorifico superior (kJ/kg)")
    potencial_tj: float = Field(..., description="Potencial energetico (TJ)")


class EnergiaMunicipioResponse(BaseModel):
    codigo_ibge: int
    ano: int
    resultados: list[EnergiaMunicipioItem]


class EnergiaMesorregiaoResponse(BaseModel):
    mesorregiao: str
    ano: int
    potencial_tj: float = Field(..., description="Soma do potencial de todos os municipios (TJ)")
    detalhes: list[EnergiaMunicipioItem] | None = Field(
        default=None,
        description="Detalhamento por municipio/substrato (incluir_detalhes=true)",
    )


class EnergiaMesorregiaoTotalItem(BaseModel):
    ano: int
    mesorregiao: str
    potencial_tj: float = Field(
        ..., description="Soma do potencial da mesorregiao no ano (TJ)"
    )
