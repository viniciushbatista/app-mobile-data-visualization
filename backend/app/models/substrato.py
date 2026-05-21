from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Substrato(Base):
    __tablename__ = "substrato"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)

    rebanhos_municipais: Mapped[list["RebanhoMunicipal"]] = relationship(
        back_populates="substrato"
    )
    rebanhos_mesorregiao: Mapped[list["RebanhoMesorregiao"]] = relationship(
        back_populates="substrato"
    )
