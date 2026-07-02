# Aplicativo de Visualização e Análise de Potencial de Produção de Biogás

## Descrição
Aplicativo mobile para visualização e análise de dados de produção de biogás, composto por um backend em FastAPI e um frontend desenvolvido com React/Expo.

## Pré‑requisitos
- **Python 3.9+**
- **Node.js 14+** (necessário para o frontend)
- **Expo CLI** (`npm install -g expo-cli`)

## Instalação
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/aplicativo.git
cd aplicativo

# Backend
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate
pip install -r backend/requirements.txt

# Frontend
cd frontend/my-app
npm install
```

## Execução
```bash
# Iniciar o backend
cd ../../backend
fastapi dev app.main:app

# Iniciar o frontend (Expo)
cd ../frontend/my-app
npx expo start
```

## Licença
Este projeto está licenciado sob a MIT License.

## Autor
Vinícius Batista – [GitHub](https://github.com/vinicb)

