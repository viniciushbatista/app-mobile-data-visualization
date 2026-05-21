from sqlalchemy import Boolean, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RebanhoMunicipal(Base):
    __tablename__ = "rebanho_municipal"
    __table_args__ = (
        UniqueConstraint(
            "codigo_ibge",
            "substrato_id",
            "ano",
            name="uq_rebanho_municipal",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    codigo_ibge: Mapped[int] = mapped_column(
        ForeignKey("municipio.codigo_ibge"), nullable=False, index=True
    )
    substrato_id: Mapped[int] = mapped_column(
        ForeignKey("substrato.id"), nullable=False, index=True
    )
    ano: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    quantidade: Mapped[float | None] = mapped_column(Float, nullable=True)
    dado_disponivel: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    municipio: Mapped["Municipio"] = relationship(back_populates="rebanhos")
    substrato: Mapped["Substrato"] = relationship(back_populates="rebanhos_municipais")
