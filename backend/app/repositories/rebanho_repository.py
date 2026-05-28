from sqlalchemy.orm import Session

from app.models import RebanhoMunicipio


class RebanhoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def listar_por_municipio(
        self,
        codigo_ibge: int,
        ano: int,
        substrato: str | None = None,
    ) -> list[RebanhoMunicipio]:
        query = self.db.query(RebanhoMunicipio).filter(
            RebanhoMunicipio.codigo_ibge == codigo_ibge,
            RebanhoMunicipio.ano == ano,
            RebanhoMunicipio.dado_disponivel.is_(True),
            RebanhoMunicipio.quantidade.isnot(None),
        )
        if substrato is not None:
            query = query.filter(RebanhoMunicipio.substrato == substrato)
        return query.order_by(RebanhoMunicipio.substrato).all()

    def listar_por_mesorregiao(
        self,
        mesorregiao: str,
        ano: int,
        substrato: str | None = None,
    ) -> list[RebanhoMunicipio]:
        query = self.db.query(RebanhoMunicipio).filter(
            RebanhoMunicipio.mesorregiao == mesorregiao,
            RebanhoMunicipio.ano == ano,
            RebanhoMunicipio.dado_disponivel.is_(True),
            RebanhoMunicipio.quantidade.isnot(None),
        )
        if substrato is not None:
            query = query.filter(RebanhoMunicipio.substrato == substrato)
        return query.order_by(
            RebanhoMunicipio.codigo_ibge, RebanhoMunicipio.substrato
        ).all()

    def existe_municipio(self, codigo_ibge: int) -> bool:
        return (
            self.db.query(RebanhoMunicipio.codigo_ibge)
            .filter(RebanhoMunicipio.codigo_ibge == codigo_ibge)
            .first()
            is not None
        )

    def existe_mesorregiao(self, mesorregiao: str) -> bool:
        return (
            self.db.query(RebanhoMunicipio.mesorregiao)
            .filter(RebanhoMunicipio.mesorregiao == mesorregiao)
            .first()
            is not None
        )

    def listar_mesorregioes_por_ano(self, ano: int) -> list[str]:
        rows = (
            self.db.query(RebanhoMunicipio.mesorregiao)
            .filter(
                RebanhoMunicipio.ano == ano,
                RebanhoMunicipio.dado_disponivel.is_(True),
                RebanhoMunicipio.quantidade.isnot(None),
            )
            .distinct()
            .order_by(RebanhoMunicipio.mesorregiao)
            .all()
        )
        return [r[0] for r in rows]
