from pydantic import BaseModel


class RebanhoMesorregiaoItem(BaseModel):
    ano: int
    mesorregiao: str
    substrato: str
    quantidade: float


class SerieItem(BaseModel):
    ano: int
    quantidade: float


class SerieMesorregiaoResponse(BaseModel):
    mesorregiao: str
    substrato: str | None = None
    dados: list[SerieItem]


class TotalMunicipioItem(BaseModel):
    codigo_ibge: int
    municipio: str
    mesorregiao: str
    total: float


class TotaisMunicipioResponse(BaseModel):
    ano: int
    substrato: str | None = None
    dados: list[TotalMunicipioItem]


class SeedResponse(BaseModel):
    linhas_importadas: int
    mesorregioes: int
    municipios: int
    substratos: int


class HealthResponse(BaseModel):
    status: str = "ok"
    database: str
