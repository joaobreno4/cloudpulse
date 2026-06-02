import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
from datetime import datetime

app = FastAPI(
    title="CloudPulse Metrics API",
    version="1.1"
)

# Configuração essencial de CORS para permitir que o React (Vite) acesse esta API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Em produção, substitua pelo IP/Domínio do Front-end
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelo Pydantic para a Ingestão de Métricas
class MetricInput(BaseModel):
    service_id: str
    cpu_usage_percent: float
    memory_usage_percent: float
    latency_ms: float
    error_rate_percent: float

# Função para conectar no PostgreSQL do Terraform
def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
            dbname=os.getenv("DB_NAME", "cloudpulse_metrics"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "postgres")
        )
        return conn
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados: {e}")
        raise HTTPException(status_code=500, detail="Database connection failed")

# Inicialização da Tabela (para evitar a falha de persistência)
@app.on_event("startup")
def startup_event():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry_history (
                id SERIAL PRIMARY KEY,
                service_id VARCHAR(255) NOT NULL,
                cpu_usage_percent FLOAT NOT NULL,
                memory_usage_percent FLOAT NOT NULL,
                latency_ms FLOAT NOT NULL,
                error_rate_percent FLOAT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        cursor.close()
        conn.close()
        print("Tabela telemetry_history verificada/criada com sucesso.")
    except Exception as e:
        print(f"Erro no startup do banco: {e}")

# Rota de Teste Base
@app.get("/")
def read_root():
    return {"status": "Metrics API is running"}

# --- ROTA 1: INGESTÃO DE MÉTRICAS (POST) ---
@app.post("/api/metrics/ingest")
def ingest_metric(metric: MetricInput):
    """
    Recebe as métricas de um serviço e salva no histórico do PostgreSQL.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO telemetry_history (
                service_id, cpu_usage_percent, memory_usage_percent, latency_ms, error_rate_percent
            ) VALUES (%s, %s, %s, %s, %s)
        """, (
            metric.service_id, 
            metric.cpu_usage_percent, 
            metric.memory_usage_percent, 
            metric.latency_ms, 
            metric.error_rate_percent
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"status": "success", "message": "Telemetry authorized by Core and saved", "service_id": metric.service_id}
    
    except Exception as e:
        print(f"Erro ao inserir métrica: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ROTA 2: AGREGAÇÃO PARA O DASHBOARD FRONT-END (GET) ---
@app.get("/api/metrics/aggregate/{service_id}")
def get_service_metrics(service_id: str):
    """
    Busca o histórico de telemetria de um serviço específico 
    e formata os dados EXATAMENTE como o Recharts espera no Front-end.
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT timestamp, cpu_usage_percent, memory_usage_percent 
            FROM telemetry_history 
            WHERE service_id = %s 
            ORDER BY timestamp ASC 
            LIMIT 20
        """, (service_id,))
        
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        if not rows:
            return []

        formatted_metrics = []
        for row in rows:
            raw_time = row[0]
            cpu = row[1]
            memory = row[2]
            
            # Formata a hora para o eixo X do gráfico (ex: "10:15")
            formatted_time = raw_time.strftime("%H:%M") 
            
            formatted_metrics.append({
                "time": formatted_time,
                "cpu": float(cpu),
                "memory": float(memory)
            })

        return formatted_metrics

    except Exception as e:
        print(f"Erro ao buscar métricas: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao buscar telemetria")
