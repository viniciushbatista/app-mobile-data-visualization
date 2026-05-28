# API Biogás PB

API REST em FastAPI com dados de rebanho da Paraíba (municipal + agregação por mesorregião via VIEW).

## Estrutura do banco

**Tabela principal:** `rebanho_municipio` (fonte única, espelha `data_munic_meso.xlsx`)

| Coluna | Descrição |
|--------|-----------|
| `codigo_ibge` | Código IBGE do município |
| `municipio` | Nome do município |
| `mesorregiao` | Mesorregião (IBGE) |
| `ano` | Ano (1974–2024) |
| `substrato` | Tipo de rebanho |
| `quantidade` | Cabeças |
| `dado_disponivel` | Dado disponível na PPM |

**VIEW:** `vw_rebanho_mesorregiao` — agrega por `ano`, `mesorregiao`, `substrato` (sem redundância).

**Parâmetros energéticos:** `parametros_substrato` — composição química (Dulong), PCS/PCI e `dejeto_kg_dia`.

```
backend/
├── alembic/              ← migrations
├── app/
│   ├── models/
│   │   ├── rebanho_municipio.py
│   │   ├── parametros_substrato.py
│   │   └── vw_rebanho_mesorregiao.py
│   ├── repositories/     ← acesso ao banco
│   ├── services/
│   │   ├── energia_calculos.py   ← fórmulas puras (testáveis)
│   │   ├── energia_service.py    ← orquestração
│   │   └── previsao_service.py   ← integração futura Prophet
│   ├── data/data_munic_meso.xlsx
│   └── tests/
├── alembic.ini
├── requirements.txt
└── venv/
```

## Como rodar

**Sempre na pasta `backend`:**

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 1. Aplicar migration (cria tabela + VIEW)

```powershell
alembic upgrade head
```

### 2. Importar Excel

```powershell
python -m app.scripts.seed --forcar
```

### 3. Seed parâmetros energéticos (Dulong)

```powershell
python -m app.scripts.seed_parametros
python -m app.scripts.seed_parametros --forcar   # recalcular
```

### 4. Subir API

```powershell
fastapi dev
# ou: uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Documentação: http://127.0.0.1:8000/docs

---

## Como acessar os endpoints

URL base: `http://127.0.0.1:8000`

| Forma | Como |
|-------|------|
| Swagger | http://127.0.0.1:8000/docs |
| Navegador | Cole a URL GET na barra de endereço |
| PowerShell | `Invoke-RestMethod "http://127.0.0.1:8000/health"` |

---

## Endpoints

| Método | Caminho | Descrição |
|--------|---------|-----------|
| `GET` | `/` | Boas-vindas |
| `GET` | `/health` | API + PostgreSQL |
| `GET` | `/mesorregiao/totais` | Lista agregada por mesorregião (VIEW) |
| `GET` | `/mesorregiao/{nome}/serie` | Série histórica (Prophet) |
| `GET` | `/municipio/totais` | Totais por município |
| `POST` | `/admin/seed` | Importa `data_munic_meso.xlsx` |
| `GET` | `/energia/municipio/{codigo_ibge}` | Potencial energético por município (TJ) |
| `GET` | `/energia/mesorregiao/{nome}` | Potencial total da mesorregião (TJ) |

---

## Energia (potencial em TJ)

Metodologia Dulong: PCS/PCI a partir de C, H, O, S, U → massa anual de dejetos → potencial em **TJ**.

### `GET /energia/municipio/{codigo_ibge}?ano=2024`

Retorna um item por substrato no município/ano.

```
http://127.0.0.1:8000/energia/municipio/2510808?ano=2024
http://127.0.0.1:8000/energia/municipio/2510808?ano=2024&substrato=Bovino
```

**Exemplo (item):**
```json
{
  "municipio": "Patos",
  "mesorregiao": "Sertão Paraibano",
  "codigo_ibge": 2510808,
  "ano": 2024,
  "substrato": "Bovino",
  "cabecas": 14000,
  "massa_anual_kg": 119945000,
  "pcs_kj_kg": 18996.85,
  "potencial_tj": 2278.61
}
```

### `GET /energia/mesorregiao/{nome}?ano=2024`

Soma o potencial de todos os municípios da mesorregião.

```
http://127.0.0.1:8000/energia/mesorregiao/Sertão%20Paraibano?ano=2024
http://127.0.0.1:8000/energia/mesorregiao/Sertão%20Paraibano?ano=2024&incluir_detalhes=true
```

### Prophet (futuro)

```
IBGE histórico → Prophet → cabeças previstas → energia_service.calcular_de_cabecas() → TJ
```

O Prophet **não** prevê energia — apenas cabeças. Use `previsao_service.potencial_de_previsao()`.

### Testes unitários

```powershell
pytest tests/ -v
```

---

### `GET /mesorregiao/totais`

Retorna lista plana a partir da VIEW `vw_rebanho_mesorregiao`.

**Parâmetros:** `ano` (obrigatório), `substrato` (opcional)

```
http://127.0.0.1:8000/mesorregiao/totais?ano=2024
http://127.0.0.1:8000/mesorregiao/totais?ano=2024&substrato=Bovino
```

**Resposta:**
```json
[
  {
    "ano": 2024,
    "mesorregiao": "Sertão Paraibano",
    "substrato": "Bovino",
    "quantidade": 350000
  }
]
```

Sem `substrato`: retorna **24 linhas** (4 mesorregiões × 6 substratos).

---

### `GET /mesorregiao/{nome}/serie`

Série histórica de uma mesorregião (1974–2024).

```
http://127.0.0.1:8000/mesorregiao/Agreste%20Paraibano/serie?substrato=Bovino
```

**Mesorregiões:** Agreste Paraibano, Borborema, Mata Paraibana, Sertão Paraibano

---

### `GET /municipio/totais`

Totais por município (223). Filtra `dado_disponivel = true`.

```
http://127.0.0.1:8000/municipio/totais?ano=2024
http://127.0.0.1:8000/municipio/totais?ano=2024&substrato=Ovino
```

**Resposta:**
```json
{
  "ano": 2024,
  "substrato": null,
  "dados": [
    {
      "codigo_ibge": 2507507,
      "municipio": "João Pessoa",
      "mesorregiao": "Mata Paraibana",
      "total": 12500.0
    }
  ]
}
```

---

### `POST /admin/seed`

Importa `app/data/data_munic_meso.xlsx`.

```
POST http://127.0.0.1:8000/admin/seed?forcar=true
```

---

## Substratos válidos

`Bovino`, `Caprino`, `Equino`, `Galináceos - total`, `Ovino`, `Suíno - total`

---

## Migrations Alembic

| Comando | Ação |
|---------|------|
| `alembic upgrade head` | Aplica migrations |
| `alembic downgrade -1` | Reverte última migration |
| `alembic history` | Histórico |

| Migration | Descrição |
|-----------|-----------|
| `001_refactor_rebanho` | `rebanho_municipio` + VIEW |
| `002_parametros_substrato` | Parâmetros químicos Dulong |

---

## Erros comuns

| Problema | Solução |
|----------|---------|
| `No module named 'app'` | Rode na pasta `backend`, não em `backend/app` |
| Tabela não existe | `alembic upgrade head` |
| Banco vazio | `python -m app.scripts.seed --forcar` |
| Porta 8000 ocupada | `fastapi dev --port 8001` |
