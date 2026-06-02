# CloudPulse Observer

![CI](https://github.com/joaobreno4/cloudpulse/actions/workflows/ci.yml/badge.svg)
![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?logo=terraform&logoColor=white)
![Docker](https://img.shields.io/badge/Containers-Docker-2496ED?logo=docker&logoColor=white)
![.NET](https://img.shields.io/badge/Backend-.NET_8-512BD4?logo=dotnet&logoColor=white)
![Python](https://img.shields.io/badge/Backend-Python_FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=black)
![Grafana](https://img.shields.io/badge/Observability-Grafana-F46800?logo=grafana&logoColor=white)
![Datadog](https://img.shields.io/badge/Monitoring-Datadog-632CA6?logo=datadog&logoColor=white)

Plataforma de **observabilidade e mapeamento topológico** para ecossistemas de microsserviços. O CloudPulse descobre, mapeia e monitora dependências entre serviços em tempo real, entregando visibilidade completa da arquitetura, métricas de latência e alertas proativos.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Stack Tecnológico](#stack-tecnológico)
- [Infraestrutura como Código (IaC)](#infraestrutura-como-código-iac)
- [Observabilidade e Monitoramento](#observabilidade-e-monitoramento)
- [Pipeline DevSecOps (CI/CD)](#pipeline-devsecops-cicd)
- [Como Executar](#como-executar)

---

## Visão Geral

O CloudPulse é construído sobre uma arquitetura de **microsserviços desacoplados**, onde cada componente possui responsabilidade única e ciclo de vida independente:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CloudPulse Platform                      │
│                                                                 │
│  ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐  │
│  │  Frontend   │────▶│  Core API    │────▶│   PostgreSQL    │  │
│  │  React 19   │     │  .NET 8 / C# │     │  (Métricas/Core)│  │
│  │  Vite + RFW │     │  Port: 5223  │────▶│   Neo4j         │  │
│  │  Port: 5173 │     └──────────────┘     │  (Topologia)    │  │
│  └─────────────┘                          └─────────────────┘  │
│                       ┌──────────────┐                         │
│                       │ Metrics API  │                         │
│                       │ Python/FastAPI│                        │
│                       │ Port: 8001   │                         │
│                       └──────────────┘                         │
│                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │  Prometheus  │────▶│   Grafana    │     │   Datadog    │   │
│  │  Port: 9090  │     │  Port: 3000  │     │    Agent     │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

| Camada | Serviço | Responsabilidade |
|---|---|---|
| **Frontend** | React 19 + Vite + XY Flow | Visualização interativa de topologia de serviços |
| **API Core** | .NET 8 Minimal APIs (C#) | Gerenciamento de serviços, dependências e métricas |
| **API Metrics** | Python FastAPI | Coleta e processamento de métricas de performance |
| **Graph DB** | Neo4j 5.12 | Armazenamento e consulta da topologia de dependências |
| **Relational DB** | PostgreSQL 15 | Persistência de métricas e dados de configuração |

---

## Stack Tecnológico

| Categoria | Tecnologia |
|---|---|
| Frontend | React 19, Vite, XY Flow (React Flow), Recharts, React Router v7, Axios |
| Backend Core | .NET 8, C#, Minimal APIs, EF Core, Npgsql, Neo4j.Driver, prometheus-net |
| Backend Metrics | Python, FastAPI |
| Bancos de Dados | PostgreSQL 15, Neo4j 5.12 Community |
| Infraestrutura | Terraform, Docker, Docker Compose |
| Observabilidade | Prometheus, Grafana, Datadog |
| CI/CD & Segurança | GitHub Actions, tfsec, Trivy, CodeQL |

---

## Infraestrutura como Código (IaC)

Toda a infraestrutura do CloudPulse é **100% codificada e versionada**, eliminando configuração manual e garantindo ambientes reproduzíveis.

### Terraform — Provisionamento de Recursos

O diretório `infra/terraform/` utiliza o provider `kreuzwerker/docker` para provisionar e gerenciar o ciclo de vida completo dos containers como recursos declarativos:

```
infra/terraform/
├── main.tf          # Provider Docker e configurações globais
├── apps.tf          # Containers das APIs, Prometheus e Grafana
├── databases.tf     # Containers do PostgreSQL e Neo4j
├── network.tf       # Rede bridge cloudpulse-net
├── volumes.tf       # Volumes persistentes
├── variables.tf     # Variáveis parametrizadas (senhas, ambiente)
└── monitoring/
    ├── prometheus.yml          # Configuração de scrape do Prometheus
    └── grafana-datasource.yml  # Datasource provisionado via código
```

O Terraform também é responsável por **provisionar automaticamente o build** da imagem Docker da Core API antes de criar o container, garantindo que a imagem esteja sempre atualizada com o código mais recente.

### Docker Compose — Orquestração Local

O `infra/docker-compose.yml` oferece uma alternativa mais ágil para desenvolvimento local, orquestrando todos os 6 serviços da plataforma em uma única rede bridge:

```bash
docker compose -f infra/docker-compose.yml up -d
```

---

## Observabilidade e Monitoramento

O CloudPulse adota uma cultura **"Observability as Code"**: nenhuma configuração de monitoramento existe fora do repositório.

### Stack Local: Prometheus + Grafana

```
prometheus (9090) ──scrape──▶ cloudpulse-core-api (:5223/metrics)
                  ──scrape──▶ cloudpulse-metrics-api (:8001/metrics)
                      │
                      ▼
               grafana (3000)
               └── datasource.yml   (provisionado via arquivo)
               └── alerting/        (Alerting as Code)
                   ├── alerting.yml  → contact points + políticas
                   └── rules.yml     → regras de alerta
```

#### Alerting as Code

As regras de alerta do Grafana são **versionadas no repositório** e provisionadas automaticamente ao subir o container, sem nenhuma configuração manual via UI:

| Alerta | Condição | Severidade | Janela |
|---|---|---|---|
| **Service Down** | `up{job="cloudpulse-core-api"} == 0` | `critical` | 1 min |
| **High Memory Usage** | `process_resident_memory_bytes > 500MB` | `warning` | 5 min |

O mapeamento de volume `./grafana/provisioning/alerting:/etc/grafana/provisioning/alerting:ro` garante que o Grafana carregue as regras na inicialização, tanto via Docker Compose quanto via Terraform.

### Datadog — Monitoramento Avançado

Além da stack local, o CloudPulse possui integração com o **Datadog** para monitoramento de produção com visibilidade estendida:

- **Dashboards automatizados** e **alertas de métricas** provisionados via Terraform, seguindo o mesmo princípio de IaC aplicado ao restante da infraestrutura.
- O Datadog Agent roda como container na rede `cloudpulse-net`, e a Core API já está instrumentada com as variáveis de rastreamento (`DD_SERVICE`, `DD_ENV`, `DD_VERSION`), prontas para APM e distributed tracing.

---

## Pipeline DevSecOps (CI/CD)

O GitHub Actions executa **6 jobs paralelos** a cada push ou pull request na branch `main`, cobrindo build, validação e três camadas independentes de segurança:

```
push / pull_request → main
         │
         ├── terraform-validate   → hashicorp/setup-terraform
         ├── backend-build        → setup-dotnet@v4 (.NET 8)
         ├── frontend-build       → setup-node@v4 (Node 22)
         │
         ├── [SECURITY] iac-security       → tfsec
         ├── [SECURITY] container-security → trivy
         └── [SECURITY] sast-codeql        → CodeQL (C# + JS)
```

### A Tríade de Segurança

| Job | Ferramenta | O que protege |
|---|---|---|
| `iac-security` | **tfsec** | Escaneia `./infra/terraform` em busca de misconfigurations e más práticas na IaC antes de qualquer `apply` |
| `container-security` | **Trivy** | Escaneia o filesystem do projeto por CVEs em dependências e secrets expostos; falha em severidade `CRITICAL` ou `HIGH` |
| `sast-codeql` | **CodeQL** | Análise estática de código (SAST) para `csharp` e `javascript`, detectando injeções, XSS, e vulnerabilidades de lógica antes do merge |

> Os jobs de build e os de segurança rodam **em paralelo**, mantendo o feedback rápido sem abrir mão da cobertura de segurança.

---

## Como Executar

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [Terraform CLI](https://developer.hashicorp.com/terraform/install) (para o fluxo via IaC)
- [Node.js 22+](https://nodejs.org/) (apenas para desenvolvimento local do frontend)

### Opção 1: Docker Compose (recomendado para desenvolvimento)

Sobe todos os serviços — bancos de dados, APIs, Prometheus e Grafana — com um único comando:

```bash
docker compose -f infra/docker-compose.yml up -d
```

### Opção 2: Terraform (ambiente completo gerenciado por IaC)

```bash
cd infra/terraform
terraform init
terraform apply -auto-approve
```

### Opção 3: Frontend em modo de desenvolvimento

```bash
cd frontend
npm install
npm run dev
```

### Endpoints após a inicialização

| Serviço | URL | Credenciais |
|---|---|---|
| **CloudPulse UI** | http://localhost:5173 | — |
| **Core API (Swagger)** | http://localhost:5223/swagger | — |
| **Metrics API** | http://localhost:8001/docs | — |
| **Grafana** | http://localhost:3000 | `admin` / `admin` |
| **Prometheus** | http://localhost:9090 | — |
| **Neo4j Browser** | http://localhost:7474 | `neo4j` / `cloudpulse_password` |
