from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Municipio(Base):
    __tablename__ = "municipio"

    codigo_ibge: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)

    rebanhos: Mapped[list["RebanhoMunicipal"]] = relationship(
        back_populates="municipio"
    )
