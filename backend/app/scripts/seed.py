"""
Importa data_munic_meso.xlsx para rebanho_municipio.

Pré-requisito: alembic upgrade head

Uso (na pasta backend):
  python -m app.scripts.seed
  python -m app.scripts.seed --forcar
"""
import argparse

from app.config import get_settings
from app.database import SessionLocal
from app.services.import_service import importar_excel


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed do banco biogas_pb")
    parser.add_argument(
        "--forcar",
        action="store_true",
        help="Apaga dados de rebanho e recarrega",
    )
    args = parser.parse_args()
    settings = get_settings()

    db = SessionLocal()
    try:
        resultado = importar_excel(
            db, settings.excel_path, limpar=args.forcar
        )
        print("Seed concluído:", resultado)
    finally:
        db.close()


if __name__ == "__main__":
    main()
