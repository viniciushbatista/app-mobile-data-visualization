from datetime import datetime

from sqlalchemy import DateTime, Float, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ParametrosSubstrato(Base):
    __tablename__ = "parametros_substrato"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    substrato: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    c: Mapped[float] = mapped_column(Float, nullable=False)
    h: Mapped[float] = mapped_column(Float, nullable=False)
    o: Mapped[float] = mapped_column(Float, nullable=False)
    s: Mapped[float] = mapped_column(Float, nullable=False)
    u: Mapped[float] = mapped_column(Float, nullable=False)
    w: Mapped[float] = mapped_column(Float, nullable=False)
    pcs_kcal_kg: Mapped[float] = mapped_column(Float, nullable=False)
    pcs_kj_kg: Mapped[float] = mapped_column(Float, nullable=False)
    pci_kcal_kg: Mapped[float] = mapped_column(Float, nullable=False)
    pci_kj_kg: Mapped[float] = mapped_column(Float, nullable=False)
    dejeto_kg_dia: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
