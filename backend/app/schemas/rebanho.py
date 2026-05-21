from pydantic import BaseModel, Field


class TotalMesorregiaoItem(BaseModel):
    mesorregiao: str
    total: float


class TotaisMesorregiaoResponse(BaseModel):
    ano: int
    substrato: str | None = None
    dados: list[TotalMesorregiaoItem]


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
    total: float


class TotaisMunicipioResponse(BaseModel):
    ano: int
    substrato: str | None = None
    dados: list[TotalMunicipioItem]


class SeedResponse(BaseModel):
    mesorregiao_linhas: int
    municipal_linhas: int
    mesorregioes: int
    municipios: int
    substratos: int


class HealthResponse(BaseModel):
    status: str = "ok"
    database: str
