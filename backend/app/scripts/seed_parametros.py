"""
Insere os 6 substratos em parametros_substrato e calcula W, PCS e PCI (Dulong).

Uso (na pasta backend):
  python -m app.scripts.seed_parametros
  python -m app.scripts.seed_parametros --forcar
"""
import argparse

from app.database import SessionLocal
from app.repositories import ParametrosSubstratoRepository
from app.services.energia_calculos import calcular_parametros_completos

# Nomes alinhados aos registros em rebanho_municipio (data_munic_meso.xlsx)
PARAMETROS_QUIMICOS: list[dict] = [
    {
        "substrato": "Bovino",
        "c": 0.4938,
        "h": 0.0646,
        "o": 0.3979,
        "s": 0.0105,
        "u": 0.707,
        "dejeto_kg_dia": 23.5,
    },
    {
        "substrato": "Caprino",
        "c": 0.4208,
        "h": 0.0562,
        "o": 0.3985,
        "s": 0.0100,
        "u": 0.0892,
        "dejeto_kg_dia": 2.8,
    },
    {
        "substrato": "Equino",
        "c": 0.4710,
        "h": 0.0500,
        "o": 0.3800,
        "s": 0.0019,
        "u": 0.7700,
        "dejeto_kg_dia": 10.0,
    },
    {
        "substrato": "Galináceos - total",
        "c": 0.5418,
        "h": 0.0634,
        "o": 0.2893,
        "s": 0.0091,
        "u": 0.1114,
        "dejeto_kg_dia": 0.09,
    },
    {
        "substrato": "Ovino",
        "c": 0.2928,
        "h": 0.0385,
        "o": 0.1717,
        "s": 0.0070,
        "u": 0.1510,
        "dejeto_kg_dia": 2.8,
    },
    {
        "substrato": "Suíno - total",
        "c": 0.4210,
        "h": 0.0640,
        "o": 0.1870,
        "s": 0.0110,
        "u": 0.3243,
        "dejeto_kg_dia": 7.0,
    },
]


def executar_seed(*, forcar: bool = False) -> dict[str, int]:
    db = SessionLocal()
    try:
        repo = ParametrosSubstratoRepository(db)
        existentes = repo.listar_todos()
        if existentes and not forcar:
            raise ValueError(
                "Parametros ja cadastrados. Use --forcar para recalcular."
            )

        for base in PARAMETROS_QUIMICOS:
            calculados = calcular_parametros_completos(
                c=base["c"],
                h=base["h"],
                o=base["o"],
                s=base["s"],
                u=base["u"],
                dejeto_kg_dia=base["dejeto_kg_dia"],
            )
            dados = {"substrato": base["substrato"], **calculados}
            repo.upsert(dados)

        db.commit()
        return {"substratos": len(PARAMETROS_QUIMICOS)}
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed parametros_substrato")
    parser.add_argument("--forcar", action="store_true")
    args = parser.parse_args()
    resultado = executar_seed(forcar=args.forcar)
    print("Seed parametros concluido:", resultado)


if __name__ == "__main__":
    main()
