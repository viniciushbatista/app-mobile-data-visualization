from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas.rebanho import SeedResponse
from app.services.import_service import importar_excel
from app.services.prophet_service import limpar_cache as limpar_cache_prophet
from app.services.energia_service import limpar_cache_energia
from app.scripts.seed_parametros import executar_seed as seed_parametros

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
        # Tenta popular a tabela de parâmetros químicos (segunda tabela)
        try:
            seed_parametros(forcar=forcar)
        except Exception as e:
            # Ignora erros se os dados já existirem e não estivermos forçando
            if forcar:
                raise e

        # Popula a tabela de rebanho e municípios a partir do Excel
        resultado = importar_excel(db, settings.excel_path, limpar=forcar)
        limpar_cache_prophet()  # Invalida modelos Prophet treinados
        limpar_cache_energia()  # Invalida cache de cálculos de potencial de energia
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return SeedResponse(**resultado)
