from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

from app.models import RebanhoMunicipio

BATCH_SIZE = 5000

COLUNAS_OBRIGATORIAS = [
    "codigo_ibge",
    "municipio",
    "mesorregiao",
    "ano",
    "substrato",
]


def importar_excel(
    db: Session,
    caminho: Path,
    *,
    limpar: bool = False,
) -> dict[str, int]:
    df = pd.read_excel(caminho)

    for col in COLUNAS_OBRIGATORIAS:
        if col not in df.columns:
            raise ValueError(f"Coluna obrigatória ausente no Excel: {col}")

    df = df.dropna(subset=COLUNAS_OBRIGATORIAS)
    df["codigo_ibge"] = df["codigo_ibge"].astype(int)
    df["ano"] = df["ano"].astype(int)
    df["dado_disponivel"] = df["dado_disponivel"].fillna(False).astype(bool)

    if limpar:
        db.query(RebanhoMunicipio).delete()
        db.commit()
    elif db.query(RebanhoMunicipio).count() > 0:
        raise ValueError(
            "Banco já possui dados. Use forcar=True para recarregar."
        )

    registros = []
    for row in df.itertuples(index=False):
        quantidade = None if pd.isna(row.quantidade) else float(row.quantidade)
        registros.append(
            {
                "codigo_ibge": int(row.codigo_ibge),
                "municipio": str(row.municipio),
                "mesorregiao": str(row.mesorregiao),
                "ano": int(row.ano),
                "substrato": str(row.substrato),
                "quantidade": quantidade,
                "dado_disponivel": bool(row.dado_disponivel),
            }
        )

    for i in range(0, len(registros), BATCH_SIZE):
        db.bulk_insert_mappings(RebanhoMunicipio, registros[i : i + BATCH_SIZE])
    db.commit()

    return {
        "linhas_importadas": len(registros),
        "mesorregioes": db.query(RebanhoMunicipio.mesorregiao)
        .distinct()
        .count(),
        "municipios": db.query(RebanhoMunicipio.codigo_ibge).distinct().count(),
        "substratos": db.query(RebanhoMunicipio.substrato).distinct().count(),
    }
