from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import (
    Mesorregiao,
    Municipio,
    RebanhoMesorregiao,
    RebanhoMunicipal,
    Substrato,
)
from app.schemas.rebanho import (
    SerieItem,
    SerieMesorregiaoResponse,
    TotalMesorregiaoItem,
    TotalMunicipioItem,
    TotaisMesorregiaoResponse,
    TotaisMunicipioResponse,
)


def _resolver_substrato_id(
    db: Session, substrato: str | None
) -> int | None:
    if substrato is None:
        return None
    registro = db.query(Substrato).filter(Substrato.nome == substrato).first()
    if registro is None:
        raise ValueError(f"Substrato não encontrado: {substrato}")
    return registro.id


def totais_por_mesorregiao(
    db: Session,
    ano: int,
    substrato: str | None = None,
) -> TotaisMesorregiaoResponse:
    substrato_id = _resolver_substrato_id(db, substrato)

    query = (
        db.query(
            Mesorregiao.nome.label("mesorregiao"),
            func.sum(RebanhoMesorregiao.quantidade_total).label("total"),
        )
        .join(RebanhoMesorregiao.mesorregiao)
        .filter(RebanhoMesorregiao.ano == ano)
    )

    if substrato_id is not None:
        query = query.filter(RebanhoMesorregiao.substrato_id == substrato_id)

    rows = query.group_by(Mesorregiao.id, Mesorregiao.nome).order_by(Mesorregiao.nome).all()

    return TotaisMesorregiaoResponse(
        ano=ano,
        substrato=substrato,
        dados=[
            TotalMesorregiaoItem(mesorregiao=r.mesorregiao, total=float(r.total or 0))
            for r in rows
        ],
    )


def serie_mesorregiao(
    db: Session,
    nome_mesorregiao: str,
    substrato: str | None = None,
) -> SerieMesorregiaoResponse:
    meso = db.query(Mesorregiao).filter(Mesorregiao.nome == nome_mesorregiao).first()
    if meso is None:
        raise ValueError(f"Mesorregião não encontrada: {nome_mesorregiao}")

    substrato_id = _resolver_substrato_id(db, substrato)

    query = db.query(
        RebanhoMesorregiao.ano,
        RebanhoMesorregiao.quantidade_total,
    ).filter(RebanhoMesorregiao.mesorregiao_id == meso.id)

    if substrato_id is not None:
        query = query.filter(RebanhoMesorregiao.substrato_id == substrato_id)

    rows = query.order_by(RebanhoMesorregiao.ano).all()

    if substrato is None:
        aggregated: dict[int, float] = {}
        for row in rows:
            aggregated[row.ano] = aggregated.get(row.ano, 0) + float(
                row.quantidade_total
            )
        dados = [
            SerieItem(ano=ano, quantidade=total)
            for ano, total in sorted(aggregated.items())
        ]
    else:
        dados = [
            SerieItem(ano=row.ano, quantidade=float(row.quantidade_total))
            for row in rows
        ]

    return SerieMesorregiaoResponse(
        mesorregiao=meso.nome,
        substrato=substrato,
        dados=dados,
    )


def totais_por_municipio(
    db: Session,
    ano: int,
    substrato: str | None = None,
) -> TotaisMunicipioResponse:
    substrato_id = _resolver_substrato_id(db, substrato)

    query = (
        db.query(
            Municipio.codigo_ibge,
            Municipio.nome.label("municipio"),
            func.sum(RebanhoMunicipal.quantidade).label("total"),
        )
        .join(RebanhoMunicipal.municipio)
        .filter(
            RebanhoMunicipal.ano == ano,
            RebanhoMunicipal.dado_disponivel.is_(True),
        )
    )

    if substrato_id is not None:
        query = query.filter(RebanhoMunicipal.substrato_id == substrato_id)

    rows = (
        query.group_by(Municipio.codigo_ibge, Municipio.nome)
        .order_by(Municipio.nome)
        .all()
    )

    return TotaisMunicipioResponse(
        ano=ano,
        substrato=substrato,
        dados=[
            TotalMunicipioItem(
                codigo_ibge=r.codigo_ibge,
                municipio=r.municipio,
                total=float(r.total or 0),
            )
            for r in rows
        ],
    )
