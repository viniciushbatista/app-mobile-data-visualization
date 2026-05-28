from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import RebanhoMunicipio, VwRebanhoMesorregiao
from app.schemas.rebanho import (
    RebanhoMesorregiaoItem,
    SerieItem,
    SerieMesorregiaoResponse,
    TotalMunicipioItem,
    TotaisMunicipioResponse,
)


def _validar_substrato(db: Session, substrato: str) -> None:
    existe = (
        db.query(RebanhoMunicipio.substrato)
        .filter(RebanhoMunicipio.substrato == substrato)
        .first()
    )
    if existe is None:
        raise ValueError(f"Substrato não encontrado: {substrato}")


def listar_mesorregiao(
    db: Session,
    ano: int,
    substrato: str | None = None,
) -> list[RebanhoMesorregiaoItem]:
    if substrato is not None:
        _validar_substrato(db, substrato)

    query = db.query(VwRebanhoMesorregiao).filter(VwRebanhoMesorregiao.ano == ano)

    if substrato is not None:
        query = query.filter(VwRebanhoMesorregiao.substrato == substrato)

    rows = query.order_by(
        VwRebanhoMesorregiao.mesorregiao,
        VwRebanhoMesorregiao.substrato,
    ).all()

    return [
        RebanhoMesorregiaoItem(
            ano=row.ano,
            mesorregiao=row.mesorregiao,
            substrato=row.substrato,
            quantidade=float(row.quantidade),
        )
        for row in rows
    ]


def serie_mesorregiao(
    db: Session,
    nome_mesorregiao: str,
    substrato: str | None = None,
) -> SerieMesorregiaoResponse:
    if substrato is not None:
        _validar_substrato(db, substrato)

    query = db.query(VwRebanhoMesorregiao).filter(
        VwRebanhoMesorregiao.mesorregiao == nome_mesorregiao
    )

    if substrato is not None:
        query = query.filter(VwRebanhoMesorregiao.substrato == substrato)

    rows = query.order_by(VwRebanhoMesorregiao.ano).all()

    if not rows:
        existe = (
            db.query(RebanhoMunicipio.mesorregiao)
            .filter(RebanhoMunicipio.mesorregiao == nome_mesorregiao)
            .first()
        )
        if existe is None:
            raise ValueError(f"Mesorregião não encontrada: {nome_mesorregiao}")

    if substrato is None:
        aggregated: dict[int, float] = {}
        for row in rows:
            aggregated[row.ano] = aggregated.get(row.ano, 0) + float(row.quantidade)
        dados = [
            SerieItem(ano=ano_val, quantidade=total)
            for ano_val, total in sorted(aggregated.items())
        ]
    else:
        dados = [
            SerieItem(ano=row.ano, quantidade=float(row.quantidade)) for row in rows
        ]

    return SerieMesorregiaoResponse(
        mesorregiao=nome_mesorregiao,
        substrato=substrato,
        dados=dados,
    )


def totais_por_municipio(
    db: Session,
    ano: int,
    substrato: str | None = None,
) -> TotaisMunicipioResponse:
    if substrato is not None:
        _validar_substrato(db, substrato)

    query = (
        db.query(
            RebanhoMunicipio.codigo_ibge,
            RebanhoMunicipio.municipio,
            RebanhoMunicipio.mesorregiao,
            func.sum(RebanhoMunicipio.quantidade).label("total"),
        )
        .filter(
            RebanhoMunicipio.ano == ano,
            RebanhoMunicipio.dado_disponivel.is_(True),
        )
    )

    if substrato is not None:
        query = query.filter(RebanhoMunicipio.substrato == substrato)

    rows = (
        query.group_by(
            RebanhoMunicipio.codigo_ibge,
            RebanhoMunicipio.municipio,
            RebanhoMunicipio.mesorregiao,
        )
        .order_by(RebanhoMunicipio.municipio)
        .all()
    )

    return TotaisMunicipioResponse(
        ano=ano,
        substrato=substrato,
        dados=[
            TotalMunicipioItem(
                codigo_ibge=r.codigo_ibge,
                municipio=r.municipio,
                mesorregiao=r.mesorregiao,
                total=float(r.total or 0),
            )
            for r in rows
        ],
    )
