FROM python:3.11-slim

# Dependências do sistema necessárias para Prophet + cmdstanpy (compilação Stan)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependências Python primeiro (aproveita cache do Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Tornar o script de startup executável
RUN chmod +x start.sh

# Porta padrão do Render (variável $PORT é injetada automaticamente pelo Render)
EXPOSE 8000

CMD ["./start.sh"]
