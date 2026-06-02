# CloudPulse Observer

O CloudPulse Observer é uma plataforma de observabilidade e mapeamento topológico projetada para ecossistemas de microsserviços. Ele descobre, mapeia e monitora as dependências entre serviços em tempo real, fornecendo uma visão clara da arquitetura e das métricas de latência.

## Arquitetura e Stack Tecnológico

Este projeto reflete uma abordagem estruturada em infraestrutura e DevOps, utilizando IaC e observabilidade nativa para gerenciar o ciclo de vida da aplicação.

* Frontend: React, Vite, React Flow
* Backend: C# .NET 8 (Minimal APIs) e Python (FastAPI)
* Banco de Dados Relacional: PostgreSQL
* Banco de Dados de Grafos: Neo4j
* Observabilidade: Prometheus e Grafana
* Infraestrutura: Terraform e Docker (Scale-to-Zero local)

## Como Executar o Projeto Localmente

### Pré-requisitos
* Docker e Docker Compose
* Terraform CLI
* Node.js (v18+)

### Passo 1: Provisionar a Infraestrutura e Back-end
Acesse o diretório de infraestrutura, inicialize o Terraform e aplique as configurações:

cd infra/terraform
terraform init
terraform apply -auto-approve

### Passo 2: Iniciar o Front-end
Em um novo terminal, instale as dependências e inicie o servidor local:

cd frontend
npm install
npm run dev

### Passo 3: Acessos da Plataforma
* CloudPulse UI: http://localhost:5173
* Grafana: http://localhost:3000
