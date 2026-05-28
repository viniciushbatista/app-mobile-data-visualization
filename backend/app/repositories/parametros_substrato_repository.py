from sqlalchemy.orm import Session

from app.models import ParametrosSubstrato


class ParametrosSubstratoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def obter_por_substrato(self, substrato: str) -> ParametrosSubstrato | None:
        return (
            self.db.query(ParametrosSubstrato)
            .filter(ParametrosSubstrato.substrato == substrato)
            .first()
        )

    def listar_todos(self) -> list[ParametrosSubstrato]:
        return (
            self.db.query(ParametrosSubstrato)
            .order_by(ParametrosSubstrato.substrato)
            .all()
        )

    def mapa_por_substrato(self) -> dict[str, ParametrosSubstrato]:
        return {p.substrato: p for p in self.listar_todos()}

    def upsert(self, dados: dict) -> ParametrosSubstrato:
        registro = self.obter_por_substrato(dados["substrato"])
        if registro is None:
            registro = ParametrosSubstrato(**dados)
            self.db.add(registro)
        else:
            for chave, valor in dados.items():
                setattr(registro, chave, valor)
        self.db.flush()
        return registro
