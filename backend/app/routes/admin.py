from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas.rebanho import SeedResponse
from app.services.import_service import importar_excel

router = APIRouter()


@router.post("/seed", response_model=SeedResponse)
def seed_database(
    forcar: bool = Query(False, description="Apaga dados e recarrega o Excel"),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    if not settings.excel_path.exists():
        raise HTTPException(
            status_code=500, detail="data_munic_meso.xlsx não encontrado"
        )

    try:
        resultado = importar_excel(db, settings.excel_path, limpar=forcar)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return SeedResponse(**resultado)
