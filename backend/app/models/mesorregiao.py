from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Mesorregiao(Base):
    __tablename__ = "mesorregiao"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    rebanhos: Mapped[list["RebanhoMesorregiao"]] = relationship(
        back_populates="mesorregiao"
    )
