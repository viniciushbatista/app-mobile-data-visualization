from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import Base, engine, get_db
from app.schemas.rebanho import SeedResponse
from app.services.import_service import executar_seed_completo

router = APIRouter()


@router.post("/seed", response_model=SeedResponse)
def seed_database(
    forcar: bool = Query(False, description="Apaga fatos e recarrega os Excel"),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    if not settings.mesorregiao_excel_path.exists():
        raise HTTPException(status_code=500, detail="dataset_meso.xlsx não encontrado")
    if not settings.municipal_excel_path.exists():
        raise HTTPException(status_code=500, detail="data_munic.xlsx não encontrado")

    Base.metadata.create_all(bind=engine)

    try:
        resultado = executar_seed_completo(
            db,
            settings.mesorregiao_excel_path,
            settings.municipal_excel_path,
            forcar=forcar,
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return SeedResponse(**resultado)
