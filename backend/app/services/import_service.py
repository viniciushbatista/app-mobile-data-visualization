from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session

from app.models import (
    Mesorregiao,
    Municipio,
    RebanhoMesorregiao,
    RebanhoMunicipal,
    Substrato,
)

BATCH_SIZE = 5000


def _get_or_create_substratos(db: Session, nomes: list[str]) -> dict[str, int]:
    mapa: dict[str, int] = {}
    for nome in sorted(set(nomes)):
        substrato = db.query(Substrato).filter(Substrato.nome == nome).first()
        if substrato is None:
            substrato = Substrato(nome=nome)
            db.add(substrato)
            db.flush()
        mapa[nome] = substrato.id
    db.commit()
    return mapa


def _get_or_create_mesorregioes(db: Session, nomes: list[str]) -> dict[str, int]:
    mapa: dict[str, int] = {}
    for nome in sorted(set(nomes)):
        meso = db.query(Mesorregiao).filter(Mesorregiao.nome == nome).first()
        if meso is None:
            meso = Mesorregiao(nome=nome)
            db.add(meso)
            db.flush()
        mapa[nome] = meso.id
    db.commit()
    return mapa


def importar_mesorregiao(
    db: Session,
    caminho: Path,
    *,
    limpar: bool = False,
) -> int:
    df = pd.read_excel(caminho)
    df = df.rename(
        columns={
            "mesorregiao": "mesorregiao",
            "ano": "ano",
            "substrato": "substrato",
            "quantidade_total": "quantidade_total",
        }
    )
    df = df.dropna(subset=["mesorregiao", "ano", "substrato", "quantidade_total"])
    df["ano"] = df["ano"].astype(int)

    mapa_meso = _get_or_create_mesorregioes(db, df["mesorregiao"].tolist())
    mapa_sub = _get_or_create_substratos(db, df["substrato"].tolist())

    if limpar:
        db.query(RebanhoMesorregiao).delete()
        db.commit()

    registros = []
    for row in df.itertuples(index=False):
        registros.append(
            {
                "mesorregiao_id": mapa_meso[row.mesorregiao],
                "substrato_id": mapa_sub[row.substrato],
                "ano": int(row.ano),
                "quantidade_total": float(row.quantidade_total),
            }
        )

    for i in range(0, len(registros), BATCH_SIZE):
        db.bulk_insert_mappings(RebanhoMesorregiao, registros[i : i + BATCH_SIZE])
    db.commit()
    return len(registros)


def importar_municipal(
    db: Session,
    caminho: Path,
    *,
    limpar: bool = False,
) -> int:
    df = pd.read_excel(caminho)
    df = df.dropna(subset=["codigo_ibge", "ano", "substrato"])
    df["codigo_ibge"] = df["codigo_ibge"].astype(int)
    df["ano"] = df["ano"].astype(int)
    df["dado_disponivel"] = df["dado_disponivel"].fillna(False).astype(bool)

    municipios_df = df[["codigo_ibge", "municipio"]].drop_duplicates("codigo_ibge")
    for row in municipios_df.itertuples(index=False):
        existe = (
            db.query(Municipio)
            .filter(Municipio.codigo_ibge == row.codigo_ibge)
            .first()
        )
        if existe is None:
            db.add(Municipio(codigo_ibge=row.codigo_ibge, nome=row.municipio))
    db.commit()

    mapa_sub = _get_or_create_substratos(db, df["substrato"].tolist())

    if limpar:
        db.query(RebanhoMunicipal).delete()
        db.commit()

    registros = []
    for row in df.itertuples(index=False):
        quantidade = None if pd.isna(row.quantidade) else float(row.quantidade)
        registros.append(
            {
                "codigo_ibge": int(row.codigo_ibge),
                "substrato_id": mapa_sub[row.substrato],
                "ano": int(row.ano),
                "quantidade": quantidade,
                "dado_disponivel": bool(row.dado_disponivel),
            }
        )

    for i in range(0, len(registros), BATCH_SIZE):
        db.bulk_insert_mappings(RebanhoMunicipal, registros[i : i + BATCH_SIZE])
    db.commit()
    return len(registros)


def executar_seed_completo(
    db: Session,
    caminho_meso: Path,
    caminho_munic: Path,
    *,
    forcar: bool = False,
) -> dict[str, int]:
    if forcar:
        db.query(RebanhoMunicipal).delete()
        db.query(RebanhoMesorregiao).delete()
        db.commit()
    else:
        if db.query(RebanhoMesorregiao).count() > 0:
            raise ValueError(
                "Banco já possui dados. Use forcar=True para recarregar."
            )

    linhas_meso = importar_mesorregiao(db, caminho_meso, limpar=forcar)
    linhas_munic = importar_municipal(db, caminho_munic, limpar=forcar)

    return {
        "mesorregiao_linhas": linhas_meso,
        "municipal_linhas": linhas_munic,
        "mesorregioes": db.query(Mesorregiao).count(),
        "municipios": db.query(Municipio).count(),
        "substratos": db.query(Substrato).count(),
    }
