# Estágio de construção e execução
FROM python:3.11-slim

WORKDIR /app

# Instala dependências do sistema necessárias para compilação leve, se houver
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copia e instala os pacotes do Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY main.py .

# Expõe a porta interna do container
EXPOSE 8001

# Comando para rodar a aplicação escutando em todas as interfaces de rede (0.0.0.0)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
