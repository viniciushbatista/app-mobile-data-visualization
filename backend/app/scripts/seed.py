"""
Cria tabelas e importa os Excel para o PostgreSQL.

Uso (na pasta backend):
  python -m app.scripts.seed
  python -m app.scripts.seed --forcar
"""
import argparse

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.services.import_service import executar_seed_completo


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed do banco biogas_pb")
    parser.add_argument(
        "--forcar",
        action="store_true",
        help="Apaga dados de rebanho e recarrega",
    )
    args = parser.parse_args()
    settings = get_settings()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        resultado = executar_seed_completo(
            db,
            settings.mesorregiao_excel_path,
            settings.municipal_excel_path,
            forcar=args.forcar,
        )
        print("Seed concluído:", resultado)
    finally:
        db.close()


if __name__ == "__main__":
    main()
