from sqlalchemy import Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class VwRebanhoMesorregiao(Base):
    """Mapeamento read-only da VIEW vw_rebanho_mesorregiao."""

    __tablename__ = "vw_rebanho_mesorregiao"
    __table_args__ = {"info": {"is_view": True}}

    ano: Mapped[int] = mapped_column(Integer, primary_key=True)
    mesorregiao: Mapped[str] = mapped_column(String(100), primary_key=True)
    substrato: Mapped[str] = mapped_column(String(80), primary_key=True)
    quantidade: Mapped[float] = mapped_column(Float)
