"""parametros_substrato para calculo energetico Dulong

Revision ID: 002_parametros_substrato
Revises: 001_refactor_rebanho
Create Date: 2026-05-26

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "002_parametros_substrato"
down_revision: Union[str, None] = "001_refactor_rebanho"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "parametros_substrato",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("substrato", sa.String(length=80), nullable=False),
        sa.Column("c", sa.Float(), nullable=False),
        sa.Column("h", sa.Float(), nullable=False),
        sa.Column("o", sa.Float(), nullable=False),
        sa.Column("s", sa.Float(), nullable=False),
        sa.Column("u", sa.Float(), nullable=False),
        sa.Column("w", sa.Float(), nullable=False),
        sa.Column("pcs_kcal_kg", sa.Float(), nullable=False),
        sa.Column("pcs_kj_kg", sa.Float(), nullable=False),
        sa.Column("pci_kcal_kg", sa.Float(), nullable=False),
        sa.Column("pci_kj_kg", sa.Float(), nullable=False),
        sa.Column("dejeto_kg_dia", sa.Float(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("substrato"),
    )
    op.create_index(
        "ix_parametros_substrato_substrato",
        "parametros_substrato",
        ["substrato"],
    )


def downgrade() -> None:
    op.drop_index("ix_parametros_substrato_substrato", table_name="parametros_substrato")
    op.drop_table("parametros_substrato")
