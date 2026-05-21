from sqlalchemy import Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class RebanhoMesorregiao(Base):
    __tablename__ = "rebanho_mesorregiao"
    __table_args__ = (
        UniqueConstraint(
            "mesorregiao_id",
            "substrato_id",
            "ano",
            name="uq_rebanho_mesorregiao",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    mesorregiao_id: Mapped[int] = mapped_column(
        ForeignKey("mesorregiao.id"), nullable=False, index=True
    )
    substrato_id: Mapped[int] = mapped_column(
        ForeignKey("substrato.id"), nullable=False, index=True
    )
    ano: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    quantidade_total: Mapped[float] = mapped_column(Float, nullable=False)

    mesorregiao: Mapped["Mesorregiao"] = relationship(back_populates="rebanhos")
    substrato: Mapped["Substrato"] = relationship(back_populates="rebanhos_mesorregiao")
