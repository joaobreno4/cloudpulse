# CloudPulse Observer

![CI](https://github.com/joaobreno4/cloudpulse/actions/workflows/ci.yml/badge.svg)
![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?logo=terraform&logoColor=white)
![Docker](https://img.shields.io/badge/Containers-Docker-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5?logo=kubernetes&logoColor=white)
![ArgoCD](https://img.shields.io/badge/GitOps-ArgoCD-EF7B4D?logo=argo&logoColor=white)
![.NET](https://img.shields.io/badge/Backend-.NET_8-512BD4?logo=dotnet&logoColor=white)
![Python](https://img.shields.io/badge/Backend-Python_FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=black)
![Grafana](https://img.shields.io/badge/Observability-Grafana-F46800?logo=grafana&logoColor=white)
![Loki](https://img.shields.io/badge/Logs-Loki-F5A800?logo=grafana&logoColor=white)
![OpenTelemetry](https://img.shields.io/badge/Traces-OpenTelemetry-425CC7?logo=opentelemetry&logoColor=white)
![Jaeger](https://img.shields.io/badge/Tracing-Jaeger-66CFE2?logo=jaeger&logoColor=white)
![Datadog](https://img.shields.io/badge/Monitoring-Datadog-632CA6?logo=datadog&logoColor=white)
![LocalStack](https://img.shields.io/badge/Cloud_Local-LocalStack-E74C3C?logo=amazon-aws&logoColor=white)

Plataforma de **observabilidade e mapeamento topológico** para ecossistemas de microsserviços. O CloudPulse descobre, mapeia e monitora dependências entre serviços em tempo real, entregando visibilidade completa da arquitetura, métricas de latência, logs centralizados e alertas proativos.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Stack Tecnológico](#stack-tecnológico)
- [Infraestrutura como Código (IaC)](#infraestrutura-como-código-iac)
- [Observabilidade e Monitoramento](#observabilidade-e-monitoramento)
- [GitOps com Kubernetes e ArgoCD](#gitops-com-kubernetes-e-argocd)
- [Emulação de Cloud com LocalStack](#emulação-de-cloud-com-localstack)
- [Pipeline DevSecOps (CI/CD)](#pipeline-devsecops-cicd)
- [Como Executar](#como-executar)

---

## Visão Geral

O CloudPulse é construído sobre uma arquitetura de **microsserviços desacoplados**, onde cada componente possui responsabilidade única e ciclo de vida independente:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          CloudPulse Platform                             │
│                                                                          │
│  ┌─────────────┐     ┌──────────────┐     ┌──────────────────────────┐  │
│  │  Frontend   │────▶│  Core API    │────▶│  PostgreSQL (Core/Dados) │  │
│  │  React 19   │     │  .NET 8 / C# │     └──────────────────────────┘  │
│  │  Vite + RFW │     │  Port: 5223  │────▶┌──────────────────────────┐  │
│  │  Port: 5173 │     └──────────────┘     │  Neo4j (Topologia)       │  │
│  └─────────────┘     ┌──────────────┐     └──────────────────────────┘  │
│                       │ Metrics API  │                                   │
│                       │ Python/FastAPI│                                  │
│                       │ Port: 8001   │                                   │
│                       └──────────────┘                                   │
│                                                                          │
│  ── OBSERVABILIDADE ──────────────────────────────────────────────────  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐             │
│  │  Prometheus  │────▶│              │     │   Datadog    │             │
│  │  Port: 9090  │     │   Grafana    │     │    Agent     │             │
│  ├──────────────┤     │  Port: 3000  │     └──────────────┘             │
│  │     Loki     │────▶│              │                                   │
│  │  Port: 3100  │     └──────────────┘                                   │
│  └──────────────┘           ▲                                            │
│  ┌──────────────┐           │                                            │
│  │   Promtail   │───logs────┘                                            │
│  │  (Docker SD) │                                                        │
│  └──────────────┘                                                        │
│                                                                          │
│  ── INFRA LOCAL ──────────────────────────────────────────────────────  │
│  ┌──────────────────────────┐   ┌─────────────────────────────────────┐ │
│  │  LocalStack (Port: 4566) │   │  Kubernetes + ArgoCD (GitOps)       │ │
│  │  S3: cloudpulse-assets   │   │  k8s/manifests/ ──sync──▶ Minikube  │ │
│  │  SQS: cloudpulse-events  │   └─────────────────────────────────────┘ │
│  └──────────────────────────┘                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

| Camada | Serviço | Responsabilidade |
|---|---|---|
| **Frontend** | React 19 + Vite + XY Flow | Visualização interativa de topologia de serviços |
| **API Core** | .NET 8 Minimal APIs (C#) | Gerenciamento de serviços, dependências e métricas |
| **API Metrics** | Python FastAPI | Coleta e processamento de métricas de performance |
| **Graph DB** | Neo4j 5.12 | Armazenamento e consulta da topologia de dependências |
| **Relational DB** | PostgreSQL 15 | Persistência de métricas e dados de configuração |
| **Métricas** | Prometheus + Grafana | Coleta, visualização e alertas de métricas |
| **Alerting** | Alertmanager | Roteamento e notificação de alertas por namespace |
| **Traces** | OpenTelemetry Collector + Jaeger | Tracing distribuído end-to-end via OTLP |
| **Logs** | Loki + Promtail | Agregação e consulta de logs centralizados |
| **GitOps** | Kubernetes + ArgoCD | Deployment declarativo e sincronização automática |
| **Cloud Local** | LocalStack | Emulação de S3 e SQS da AWS para desenvolvimento |

---

## Stack Tecnológico

| Categoria | Tecnologia |
|---|---|
| Frontend | React 19, Vite, XY Flow (React Flow), Recharts, React Router v7, Axios |
| Backend Core | .NET 8, C#, Minimal APIs, EF Core, Npgsql, Neo4j.Driver, prometheus-net, Datadog APM |
| Backend Metrics | Python, FastAPI |
| Bancos de Dados | PostgreSQL 15, Neo4j 5.12 Community |
| Infraestrutura | Terraform, Docker, Docker Compose |
| Orquestração | Kubernetes, ArgoCD |
| Observabilidade | Prometheus, Grafana, Alertmanager, OpenTelemetry Collector, Jaeger, Loki, Promtail, Datadog |
| Cloud Local | LocalStack (S3, SQS) |
| CI/CD & Segurança | GitHub Actions, tfsec, Trivy, CodeQL |

---

## Infraestrutura como Código (IaC)

Toda a infraestrutura do CloudPulse é **100% codificada e versionada**, eliminando configuração manual e garantindo ambientes reproduzíveis.

### Terraform — Provisionamento de Recursos

O diretório `infra/terraform/` utiliza o provider `kreuzwerker/docker` para provisionar e gerenciar o ciclo de vida completo dos containers como recursos declarativos:

```
infra/terraform/
├── main.tf          # Provider Docker e configurações globais
├── apps.tf          # Containers das APIs, Prometheus, Grafana, Loki, Promtail e LocalStack
├── databases.tf     # Containers do PostgreSQL e Neo4j
├── network.tf       # Rede bridge cloudpulse-net
├── volumes.tf       # Volumes persistentes
├── variables.tf     # Variáveis parametrizadas (senhas, ambiente)
├── monitoring/
│   ├── prometheus.yml          # Configuração de scrape do Prometheus
│   └── grafana-datasource.yml  # Datasources Prometheus e Loki provisionados via código
└── aws_local/
    └── main.tf      # Provider AWS apontando para LocalStack (S3 + SQS)
```

O Terraform também é responsável por **provisionar automaticamente o build** da imagem Docker da Core API antes de criar o container, garantindo que a imagem esteja sempre atualizada com o código mais recente.

### Docker Compose — Orquestração Local

O `infra/docker-compose.yml` orquestra todos os **10 serviços** da plataforma em uma única rede bridge, incluindo o stack completo de observabilidade e o LocalStack:

```bash
docker compose -f infra/docker-compose.yml up -d
```

---

## Observabilidade e Monitoramento

O CloudPulse adota uma cultura **"Observability as Code"**: nenhuma configuração de monitoramento existe fora do repositório.

### Métricas: Prometheus + Grafana

```
prometheus (9090) ──scrape──▶ cloudpulse-core-api (:5223/metrics)
                  ──scrape──▶ otel-collector (:8889/metrics)  ← via ServiceMonitor
                      │
                      ▼
               grafana (3000)
               ├── datasources/datasource.yml  (Prometheus + Loki via arquivo)
               └── alerting/
                   ├── alerting.yml  → contact points + políticas
                   └── rules.yml     → regras de alerta
```

#### Alerting as Code (Kubernetes)

As regras e roteamento de alertas são **CRDs versionados no repositório**, gerenciados pelo Prometheus Operator:

| Recurso | Tipo | Descrição |
|---|---|---|
| `cpu-alert-rule.yaml` | `PrometheusRule` | `CloudpulseHighCPUUsage`: CPU > 80% da capacidade do cluster por > 1 min |
| `alertmanager-config.yaml` | `AlertmanagerConfig` | Sub-rota `namespace=cloudpulse` → webhook logger |
| `alertmanager-webhook-logger.yaml` | `Deployment` | Receiver de teste que imprime alertas JSON no stdout |

### Traces: OpenTelemetry + Jaeger

```
cloudpulse-core-api (.NET 8)
  └── OTLP/HTTP :4318 ──► otel-collector (monitoring ns)
                               ├── metrics ──► prometheus exporter :8889
                               ├── traces  ──► jaeger-collector :4317
                               └── logs    ──► debug
                                                │
                                           jaeger UI :16686
```

A Core API exporta traces via `OpenTelemetry.Exporter.OpenTelemetryProtocol` com instrumentação automática de ASP.NET Core e HttpClient. O endpoint OTLP é configurável via variável de ambiente `OTEL_EXPORTER_OTLP_ENDPOINT`.

### Logs: Loki + Promtail

```
containers Docker
     │  (stdout/stderr)
     ▼
promtail ──docker_sd_configs──▶ descobre containers automaticamente
     │         via /var/run/docker.sock
     │  (push)
     ▼
  loki (3100) ──▶ grafana (datasource: cloudpulse-loki)
```

O Promtail usa **Docker Service Discovery** (`docker_sd_configs`) para detectar e coletar logs de todos os containers da rede automaticamente, sem configuração manual por serviço. Cada log é enriquecido com os labels `container`, `service` e `logstream`.

O container Loki no Terraform recebe o **network alias `loki`**, garantindo que o mesmo `promtail-config.yml` funcione tanto no Docker Compose (pelo service name) quanto no Terraform (pelo alias de rede).

### Datadog — Monitoramento Avançado

Além da stack local, o CloudPulse possui integração com o **Datadog** para monitoramento de produção:

- **Dashboards automatizados** e **alertas de métricas** provisionados via Terraform.
- A Core API tem instrumentação completa de **APM** via Datadog .NET Tracer (CLR Profiler), habilitado diretamente no Dockerfile com `CORECLR_ENABLE_PROFILING=1`.
- Variáveis `DD_SERVICE`, `DD_ENV` e `DD_VERSION` injetadas via Terraform para rastreamento distribuído.

---

## GitOps com Kubernetes e ArgoCD

A trilha GitOps permite o deployment declarativo da plataforma em um cluster Kubernetes (Minikube local), com sincronização automática via ArgoCD.

### Estrutura dos Manifestos

```
k8s/
├── manifests/
│   ├── namespace.yaml                  # Namespace cloudpulse
│   ├── postgres.yaml                   # Deployment + PVC (1Gi) + Service
│   ├── core-api.yaml                   # Deployment + Service (ClusterIP :5223)
│   ├── frontend.yaml                   # Deployment + Service (NodePort :30080)
│   ├── ingress.yaml                    # Ingress split: frontend (Blazor SPA) + backend
│   ├── grafana-svc-manual.yaml         # Bridge Service/Endpoints → monitoring namespace
│   ├── cpu-alert-rule.yaml             # PrometheusRule: CPU > 80% por 1 min
│   ├── alertmanager-config.yaml        # AlertmanagerConfig: roteamento por namespace
│   ├── alertmanager-webhook-logger.yaml# Receiver de teste (webhook echo)
│   ├── otel-collector.yaml             # OTel Collector + ServiceMonitor
│   └── jaeger.yaml                     # Jaeger all-in-one (OTLP + UI :16686)
└── argocd/
    └── application.yaml                # Recurso Application do ArgoCD
```

### ArgoCD — Sincronização Automática

O arquivo `k8s/argocd/application.yaml` define um recurso `Application` que aponta para o diretório `k8s/manifests/` deste repositório. A cada push na branch `main`, o ArgoCD detecta a divergência e reconcilia o estado do cluster automaticamente:

```yaml
syncPolicy:
  automated:
    prune: true      # remove recursos deletados do repo
    selfHeal: true   # reverte mudanças manuais no cluster
  syncOptions:
    - CreateNamespace=true
```

### Subindo com Minikube

```bash
# Instalar ArgoCD no cluster
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Aplicar o recurso Application
kubectl apply -f k8s/argocd/application.yaml

# Acompanhar a sincronização
kubectl get applications -n argocd
```

---

## Emulação de Cloud com LocalStack

O **LocalStack** emula os serviços da AWS localmente na porta `4566`, permitindo desenvolver e testar integrações com S3 e SQS sem nenhum custo ou acesso à cloud real.

### Recursos Provisionados

O módulo `infra/terraform/aws_local/` usa o provider `hashicorp/aws` apontando todos os endpoints para `http://localhost:4566`:

| Recurso | Tipo | Nome |
|---|---|---|
| Armazenamento de arquivos | S3 Bucket | `cloudpulse-assets` |
| Fila de eventos assíncronos | SQS Queue | `cloudpulse-events` |

### Provisionando os recursos AWS locais

```bash
# LocalStack deve estar rodando (via Docker Compose ou Terraform)
cd infra/terraform/aws_local
terraform init
terraform apply -auto-approve
```

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
- [Terraform CLI](https://developer.hashicorp.com/terraform/install) (para os fluxos via IaC)
- [kubectl](https://kubernetes.io/docs/tasks/tools/) + [Minikube](https://minikube.sigs.k8s.io/docs/start/) (para o fluxo GitOps)
- [Node.js 22+](https://nodejs.org/) (apenas para desenvolvimento local do frontend)

### Opção 1: Docker Compose (recomendado para desenvolvimento)

Sobe todos os 10 serviços — APIs, bancos de dados, Prometheus, Grafana, Loki, Promtail e LocalStack — com um único comando:

```bash
docker compose -f infra/docker-compose.yml up -d
```

### Opção 2: Terraform (ambiente completo gerenciado por IaC)

```bash
cd infra/terraform
terraform init
terraform apply -auto-approve
```

### Opção 3: GitOps com Kubernetes e ArgoCD

> Requer Minikube rodando localmente: `minikube start`

**Passo 1 — Instalar o ArgoCD no cluster:**

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

**Passo 2 — Aguardar os pods do ArgoCD ficarem prontos:**

```bash
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=120s
```

**Passo 3 — Expor a UI do ArgoCD localmente:**

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

**Passo 4 — Obter a senha inicial do admin:**

```bash
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

**Passo 5 — Registrar o Application do CloudPulse:**

```bash
kubectl apply -f k8s/argocd/application.yaml
```

A partir daqui, o ArgoCD monitora o diretório `k8s/manifests/` e sincroniza automaticamente a cada push na branch `main`. Acesse a UI em **https://localhost:8080** com `admin` e a senha obtida no passo 4.

**Verificar o status da sincronização:**

```bash
kubectl get applications -n argocd
kubectl get pods -n cloudpulse
```

### Opção 4: Frontend em modo de desenvolvimento

```bash
cd frontend
npm install
npm run dev
```

### Endpoints após a inicialização

| Serviço | URL | Credenciais |
|---|---|---|
| Serviço | URL | Credenciais |
|---|---|---|
| **CloudPulse UI** | http://localhost:5173 | — |
| **Core API (Swagger)** | http://localhost:5223/swagger | — |
| **Metrics API** | http://localhost:8001/docs | — |
| **Grafana** | http://localhost:3000 | `admin` / `admin` |
| **Prometheus** | http://localhost:9090 | — |
| **Alertmanager** | http://localhost:9093 | — |
| **Jaeger UI** | `kubectl port-forward -n monitoring svc/jaeger-collector 16686:16686` | — |
| **Loki** | http://localhost:3100 | — |
| **LocalStack** | http://localhost:4566 | — |
| **Neo4j Browser** | http://localhost:7474 | `neo4j` / `cloudpulse_password` |
