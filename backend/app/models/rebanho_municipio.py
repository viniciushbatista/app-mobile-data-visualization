from sqlalchemy import Boolean, Float, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RebanhoMunicipio(Base):
    __tablename__ = "rebanho_municipio"
    __table_args__ = (
        UniqueConstraint(
            "codigo_ibge",
            "ano",
            "substrato",
            name="uq_rebanho_municipio",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    codigo_ibge: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    municipio: Mapped[str] = mapped_column(String(150), nullable=False)
    mesorregiao: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    ano: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    substrato: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    quantidade: Mapped[float | None] = mapped_column(Float, nullable=True)
    dado_disponivel: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
