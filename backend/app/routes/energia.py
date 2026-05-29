from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.energia import (
    EnergiaMesorregiaoTotalItem,
    EnergiaMesorregiaoResponse,
    EnergiaMesorregiaoSerieItem,
    EnergiaMesorregiaoSerieResponse,
    EnergiaMunicipioItem,
    EnergiaMunicipioResponse,
    EnergiaMunicipioSerieResponse,
)
from app.services.energia_service import (
    EnergiaService,
    ResultadoEnergia,
    ResultadoEnergiaMesorregiaoTotal,
    ResultadoEnergiaMesorregiaoSerie,
    ResultadoEnergiaMunicipioSerie,
)

router = APIRouter()


def _para_schema(item: ResultadoEnergia) -> EnergiaMunicipioItem:
    return EnergiaMunicipioItem(
        municipio=item.municipio,
        mesorregiao=item.mesorregiao,
        codigo_ibge=item.codigo_ibge,
        ano=item.ano,
        substrato=item.substrato,
        cabecas=item.cabecas,
        massa_anual_kg=round(item.massa_anual_kg, 2),
        pcs_kj_kg=round(item.pcs_kj_kg, 4),
        potencial_tj=round(item.potencial_tj, 4),
    )


def _para_schema_total_mesorregiao(
    item: ResultadoEnergiaMesorregiaoTotal,
) -> EnergiaMesorregiaoTotalItem:
    return EnergiaMesorregiaoTotalItem(
        ano=item.ano,
        mesorregiao=item.mesorregiao,
        potencial_tj=round(item.potencial_tj, 4),
    )


@router.get(
    "/mesorregiao/totais",
    response_model=list[EnergiaMesorregiaoTotalItem],
)
def energia_totais_mesorregiao(
    ano: int = Query(..., ge=1974, le=2030),
    db: Session = Depends(get_db),
):
    try:
        service = EnergiaService(db)
        resultados = service.potencial_total_por_mesorregiao_no_ano(ano)
        return [_para_schema_total_mesorregiao(r) for r in resultados]
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/municipio/{codigo_ibge}", response_model=EnergiaMunicipioResponse)
def energia_municipio(
    codigo_ibge: int,
    ano: int = Query(..., ge=1974, le=2030),
    substrato: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        service = EnergiaService(db)
        resultados = service.potencial_por_municipio(codigo_ibge, ano, substrato)
        return EnergiaMunicipioResponse(
            codigo_ibge=codigo_ibge,
            ano=ano,
            resultados=[_para_schema(r) for r in resultados],
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/mesorregiao/{nome}", response_model=EnergiaMesorregiaoResponse)
def energia_mesorregiao(
    nome: str,
    ano: int = Query(..., ge=1974, le=2030),
    substrato: str | None = None,
    incluir_detalhes: bool = Query(
        False, description="Inclui calculo por municipio/substrato"
    ),
    db: Session = Depends(get_db),
):
    try:
        service = EnergiaService(db)
        total_tj, detalhes = service.potencial_por_mesorregiao(nome, ano, substrato)
        return EnergiaMesorregiaoResponse(
            mesorregiao=nome,
            ano=ano,
            potencial_tj=round(total_tj, 4),
            detalhes=[_para_schema(r) for r in detalhes] if incluir_detalhes else None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/mesorregiao/{nome}/serie", response_model=EnergiaMesorregiaoSerieResponse)
def energia_serie_mesorregiao(
    nome: str,
    substrato: str | None = None,
    db: Session = Depends(get_db),
):
    """Retorna a série histórica completa de potencial energético de uma mesorregião.
    Uma única chamada substitui N chamadas (uma por ano).
    """
    try:
        service = EnergiaService(db)
        resultado = service.serie_potencial_por_mesorregiao(nome, substrato)
        return EnergiaMesorregiaoSerieResponse(
            mesorregiao=resultado.mesorregiao,
            substrato=resultado.substrato,
            dados=[
                EnergiaMesorregiaoSerieItem(ano=ano, potencial_tj=tj)
                for ano, tj in resultado.dados
            ],
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/municipio/{codigo_ibge}/serie", response_model=EnergiaMunicipioSerieResponse)
def energia_serie_municipio(
    codigo_ibge: int,
    substrato: str | None = None,
    db: Session = Depends(get_db),
):
    """Retorna a série histórica completa de potencial energético de um município.
    Uma única chamada substitui N chamadas.
    """
    try:
        service = EnergiaService(db)
        resultado = service.serie_potencial_por_municipio(codigo_ibge, substrato)
        return EnergiaMunicipioSerieResponse(
            codigo_ibge=resultado.codigo_ibge,
            municipio=resultado.municipio,
            substrato=resultado.substrato,
            dados=[
                EnergiaMesorregiaoSerieItem(ano=ano, potencial_tj=tj)
                for ano, tj in resultado.dados
            ],
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

