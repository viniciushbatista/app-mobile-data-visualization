# API Biogás PB

## Estrutura

```
backend/
├── app/              ← código da API (models, routes, services, data)
├── requirements.txt
├── .env              ← credenciais do PostgreSQL (não versionar)
├── README.md
└── venv/             ← ignorado pelo Git; só dependências
```

## Comandos
Na pasta `backend`:

```powershell
# Criar tabelas e importar Excel
.\venv\Scripts\python.exe -m app.scripts.seed

# Subir API
.\venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000
```

Documentação: http://127.0.0.1:8000/docs
