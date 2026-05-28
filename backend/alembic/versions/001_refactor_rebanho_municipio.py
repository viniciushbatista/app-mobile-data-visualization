"""refactor: tabela unica rebanho_municipio + view vw_rebanho_mesorregiao

Revision ID: 001_refactor_rebanho
Revises:
Create Date: 2026-05-21

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001_refactor_rebanho"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Remove estrutura antiga (ordem respeita FKs)
    op.execute("DROP VIEW IF EXISTS vw_rebanho_mesorregiao CASCADE")
    op.execute("DROP TABLE IF EXISTS rebanho_mesorregiao CASCADE")
    op.execute("DROP TABLE IF EXISTS rebanho_municipal CASCADE")
    op.execute("DROP TABLE IF EXISTS mesorregiao CASCADE")
    op.execute("DROP TABLE IF EXISTS municipio CASCADE")
    op.execute("DROP TABLE IF EXISTS substrato CASCADE")
    op.execute("DROP TABLE IF EXISTS rebanho_municipio CASCADE")

    op.create_table(
        "rebanho_municipio",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("codigo_ibge", sa.Integer(), nullable=False),
        sa.Column("municipio", sa.String(length=150), nullable=False),
        sa.Column("mesorregiao", sa.String(length=100), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("substrato", sa.String(length=80), nullable=False),
        sa.Column("quantidade", sa.Float(), nullable=True),
        sa.Column("dado_disponivel", sa.Boolean(), nullable=False, server_default="true"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "codigo_ibge", "ano", "substrato", name="uq_rebanho_municipio"
        ),
    )
    op.create_index("ix_rebanho_municipio_codigo_ibge", "rebanho_municipio", ["codigo_ibge"])
    op.create_index("ix_rebanho_municipio_mesorregiao", "rebanho_municipio", ["mesorregiao"])
    op.create_index("ix_rebanho_municipio_ano", "rebanho_municipio", ["ano"])
    op.create_index("ix_rebanho_municipio_substrato", "rebanho_municipio", ["substrato"])

    op.execute(
        """
        CREATE OR REPLACE VIEW vw_rebanho_mesorregiao AS
        SELECT
            ano,
            mesorregiao,
            substrato,
            SUM(quantidade) AS quantidade
        FROM rebanho_municipio
        WHERE quantidade IS NOT NULL
        GROUP BY
            ano,
            mesorregiao,
            substrato
        """
    )


def downgrade() -> None:
    op.execute("DROP VIEW IF EXISTS vw_rebanho_mesorregiao CASCADE")
    op.drop_table("rebanho_municipio")

    op.create_table(
        "mesorregiao",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome"),
    )
    op.create_table(
        "substrato",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("nome", sa.String(length=80), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("nome"),
    )
    op.create_table(
        "municipio",
        sa.Column("codigo_ibge", sa.Integer(), nullable=False),
        sa.Column("nome", sa.String(length=150), nullable=False),
        sa.PrimaryKeyConstraint("codigo_ibge"),
    )
    op.create_table(
        "rebanho_mesorregiao",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("mesorregiao_id", sa.Integer(), nullable=False),
        sa.Column("substrato_id", sa.Integer(), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("quantidade_total", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(["mesorregiao_id"], ["mesorregiao.id"]),
        sa.ForeignKeyConstraint(["substrato_id"], ["substrato.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "mesorregiao_id", "substrato_id", "ano", name="uq_rebanho_mesorregiao"
        ),
    )
    op.create_table(
        "rebanho_municipal",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("codigo_ibge", sa.Integer(), nullable=False),
        sa.Column("substrato_id", sa.Integer(), nullable=False),
        sa.Column("ano", sa.Integer(), nullable=False),
        sa.Column("quantidade", sa.Float(), nullable=True),
        sa.Column("dado_disponivel", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["codigo_ibge"], ["municipio.codigo_ibge"]),
        sa.ForeignKeyConstraint(["substrato_id"], ["substrato.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "codigo_ibge", "substrato_id", "ano", name="uq_rebanho_municipal"
        ),
    )
