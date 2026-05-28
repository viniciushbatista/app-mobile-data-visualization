from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.rebanho import RebanhoMesorregiaoItem, SerieMesorregiaoResponse
from app.services import agregacao_service

router = APIRouter()


@router.get("/totais", response_model=list[RebanhoMesorregiaoItem])
def listar_totais(
    ano: int = Query(..., ge=1974, le=2030),
    substrato: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        return agregacao_service.listar_mesorregiao(
            db, ano=ano, substrato=substrato
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{nome}/serie", response_model=SerieMesorregiaoResponse)
def obter_serie(
    nome: str,
    substrato: str | None = None,
    db: Session = Depends(get_db),
):
    try:
        return agregacao_service.serie_mesorregiao(
            db, nome_mesorregiao=nome, substrato=substrato
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
