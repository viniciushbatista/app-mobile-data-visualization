#!/bin/bash
# Script de inicialização do backend em produção (Render)
# Roda migrações do banco antes de subir o servidor

set -e

echo "==> Rodando migrações Alembic..."
alembic upgrade head

echo "==> Rodando seed de parametros_substrato..."
python -m app.scripts.seed_parametros || echo "==> Parâmetros químicos já populados."

echo "==> Inicialização concluída. Iniciando servidor..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"

