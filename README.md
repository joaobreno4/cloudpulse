# CloudPulse Observer

![CI](https://github.com/joaobreno4/cloudpulse/actions/workflows/ci.yml/badge.svg)
![Kubernetes](https://img.shields.io/badge/Orchestration-Kubernetes-326CE5?logo=kubernetes&logoColor=white)
![.NET](https://img.shields.io/badge/Backend-.NET_8-512BD4?logo=dotnet&logoColor=white)
![React](https://img.shields.io/badge/Frontend-React_19-61DAFB?logo=react&logoColor=black)
![OpenTelemetry](https://img.shields.io/badge/Traces-OpenTelemetry-425CC7?logo=opentelemetry&logoColor=white)
![Jaeger](https://img.shields.io/badge/Tracing-Jaeger-66CFE2?logo=jaeger&logoColor=white)
![Prometheus](https://img.shields.io/badge/Metrics-Prometheus-E6522C?logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Dashboards-Grafana-F46800?logo=grafana&logoColor=white)
![Terraform](https://img.shields.io/badge/IaC-Terraform-7B42BC?logo=terraform&logoColor=white)
![ArgoCD](https://img.shields.io/badge/GitOps-ArgoCD-EF7B4D?logo=argo&logoColor=white)

**CloudPulse** é uma plataforma de observabilidade e mapeamento topológico para ecossistemas de microsserviços, construída sobre uma stack SRE-driven com Kubernetes, traces distribuídos via OpenTelemetry e alertas gerenciados por código.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         cloudpulse.local  (Ingress NGINX)               │
│                                                                          │
│   /          ──►  cloudpulse-frontend  (React 19 + Vite)                │
│   /api       ──►  cloudpulse-core-api  (.NET 8 Minimal APIs)            │
│   /grafana   ──►  kube-prometheus-stack-grafana  (bridge svc)           │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────────┐
          ▼                    ▼                         ▼
   ┌─────────────┐    ┌──────────────────┐    ┌───────────────────┐
   │  PostgreSQL │    │     Neo4j         │    │  OTel Collector   │
   │  (entities) │    │  (topology graph) │    │  OTLP :4317/:4318 │
   └─────────────┘    └──────────────────┘    └────────┬──────────┘
                                                        │
                                          ┌─────────────┼────────────┐
                                          ▼             ▼            │
                                   ┌──────────┐  ┌──────────┐       │
                                   │ Prometheus│  │  Jaeger  │       │
                                   │ :8889     │  │ UI :16686│       │
                                   └──────────┘  └──────────┘       │
                                          ▲                          │
                                   ┌──────────┐                      │
                                   │ Grafana  │◄─────────────────────┘
                                   │ :3000    │    (datasource Prometheus)
                                   └──────────┘
```

### Fluxo de dados

```
Browser
  └── GET cloudpulse.local/
        └── Ingress NGINX (cloudpulse-frontend)
              └── React 19 SPA carrega

  └── GET cloudpulse.local/api/tasks
        └── Ingress NGINX (cloudpulse-core-api)
              ├── Responde JSON  ──►  React renderiza TaskDashboard
              └── Emite span OTLP/HTTP
                    └── OTel Collector (:4318)
                          ├── Prometheus exporter (:8889)  ──►  Prometheus scrape
                          └── otlp_grpc/jaeger  ──►  Jaeger (:4317)
                                                          └── Jaeger UI (:16686)
```

---

## Stack

| Camada | Tecnologia | Função |
|---|---|---|
| **Orquestração** | Kubernetes (Minikube) | Runtime de containers, GitOps via ArgoCD |
| **Ingress** | NGINX Ingress Controller | Roteamento HTTP, gzip, headers de segurança, SPA fallback |
| **Frontend** | React 19 + Vite + React Router | SPA com topologia (ReactFlow), métricas e task dashboard |
| **Backend** | .NET 8 Minimal APIs (C#) | REST API, EF Core + PostgreSQL, Neo4j topology |
| **Traces** | OpenTelemetry SDK + Collector | Instrumentação ASP.NET Core, spans manuais com `ActivitySource` |
| **Trace Storage** | Jaeger all-in-one v1.76 | Persiste e visualiza traces distribuídos via OTLP gRPC |
| **Métricas** | Prometheus + prometheus-net | Scraping de `/metrics`, PrometheusRule por namespace |
| **Dashboards** | Grafana (kube-prometheus-stack) | Visualização, alertas, datasource Prometheus |
| **Alerting** | Alertmanager + AlertmanagerConfig | Roteamento de alertas por namespace com webhook receiver |
| **IaC** | Terraform | Docker provider para ambiente local completo |
| **GitOps** | ArgoCD | Sincronização automática de `k8s/manifests/` no cluster |
| **CI/CD** | GitHub Actions | Build, tfsec, Trivy, CodeQL em paralelo |

---

## Manifests Kubernetes (`k8s/manifests/`)

```
k8s/manifests/
├── namespace.yaml                   # Namespace cloudpulse
├── postgres.yaml                    # PostgreSQL Deployment + PVC + Service
├── core-api.yaml                    # .NET 8 API Deployment + Service (:5223)
├── frontend.yaml                    # React Deployment + Service (:80)
├── ingress.yaml                     # Ingress split: cloudpulse-frontend + cloudpulse-backend
│                                    #   annotations: gzip, proxy timeouts 300s, security headers,
│                                    #   try_files para SPA routing (Blazor/React)
├── grafana-svc-manual.yaml          # Service/Endpoints bridge → kube-prometheus-stack-grafana
├── cpu-alert-rule.yaml              # PrometheusRule: CloudpulseHighCPUUsage (> 80% / 1min)
├── alertmanager-config.yaml         # AlertmanagerConfig: sub-rota namespace=cloudpulse
├── alertmanager-webhook-logger.yaml # Receiver de teste (echo server Python)
├── otel-collector.yaml              # OTel Collector Deployment + Service + ServiceMonitor
│                                    #   receivers: OTLP gRPC :4317, HTTP :4318
│                                    #   exporters: prometheus :8889, otlp_grpc/jaeger :4317
└── jaeger.yaml                      # Jaeger all-in-one: OTLP ingestion + UI :16686
```

---

## Como rodar localmente

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) + [Minikube](https://minikube.sigs.k8s.io/docs/start/) ≥ v1.32
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [.NET 8 SDK](https://dotnet.microsoft.com/download) (só para desenvolvimento da API)
- [Node.js 20+](https://nodejs.org/) (só para desenvolvimento do frontend)

### 1. Subir o cluster

```bash
minikube start --cpus=4 --memory=8g
minikube addons enable ingress

# Adicionar o host ao /etc/hosts
echo "$(minikube ip) cloudpulse.local" | sudo tee -a /etc/hosts
```

### 2. Instalar o kube-prometheus-stack

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace \
  --set grafana.service.type=NodePort
```

### 3. Buildar as imagens localmente (minikube daemon)

```bash
eval $(minikube docker-env)

# API (.NET 8)
docker build -t cloudpulse-core-api:dev ./backend/backend-core/CloudPulse.CoreAPI/

# Frontend (React + nginx)
docker build -t cloudpulse-frontend:dev ./frontend/
```

### 4. Aplicar os manifestos

```bash
kubectl apply -f k8s/manifests/namespace.yaml
kubectl apply -f k8s/manifests/postgres.yaml
kubectl apply -f k8s/manifests/core-api.yaml
kubectl apply -f k8s/manifests/frontend.yaml
kubectl apply -f k8s/manifests/ingress.yaml
kubectl apply -f k8s/manifests/grafana-svc-manual.yaml
kubectl apply -f k8s/manifests/
```

> **Atenção:** após buildar localmente, atualize os deployments para usar as imagens locais:
> ```bash
> kubectl set image deployment/cloudpulse-core-api core-api=cloudpulse-core-api:dev -n cloudpulse
> kubectl set image deployment/cloudpulse-frontend frontend=cloudpulse-frontend:dev -n cloudpulse
> kubectl patch deployment cloudpulse-core-api -n cloudpulse \
>   -p '{"spec":{"template":{"spec":{"containers":[{"name":"core-api","imagePullPolicy":"Never"}]}}}}'
> kubectl patch deployment cloudpulse-frontend -n cloudpulse \
>   -p '{"spec":{"template":{"spec":{"containers":[{"name":"frontend","imagePullPolicy":"Never"}]}}}}'
> ```

### 5. Verificar o cluster

```bash
kubectl get pods -n cloudpulse
kubectl get pods -n monitoring
kubectl get ingress -n cloudpulse
```

### 6. Acessar os serviços

| Serviço | URL / Comando |
|---|---|
| **CloudPulse UI** | `http://cloudpulse.local` |
| **Core API Swagger** | `http://cloudpulse.local/api/swagger` |
| **Grafana** | `http://cloudpulse.local/grafana` → `admin / prom-operator` |
| **Prometheus** | `kubectl port-forward svc/kube-prometheus-stack-prometheus -n monitoring 9090:9090` |
| **Alertmanager** | `kubectl port-forward svc/kube-prometheus-stack-alertmanager -n monitoring 9093:9093` |
| **Jaeger UI** | `kubectl port-forward svc/jaeger-collector -n monitoring 16686:16686` → `http://localhost:16686` |

### Desenvolvimento local (sem Kubernetes)

```bash
# API
cd backend/backend-core/CloudPulse.CoreAPI
dotnet run

# Frontend (em outro terminal)
cd frontend
npm install
npm run dev   # http://localhost:5173
```

---

## Observabilidade

### Traces distribuídos (OpenTelemetry)

A Core API instrumenta automaticamente todas as requisições HTTP via `AddAspNetCoreInstrumentation()` e emite spans manuais nos controllers com `ActivitySource`:

```csharp
// Controllers/TasksController.cs
private static readonly ActivitySource _source = new("CloudPulse.CoreAPI.Tasks");

using var activity = _source.StartActivity("tasks.list");
activity?.SetTag("tasks.total", tasks.Count);
activity?.SetTag("tasks.running", tasks.Count(t => t.Status == "Running"));
```

Os spans são exportados via OTLP/HTTP para o Collector, que os repassa ao Jaeger via gRPC.

**Configuração via env var:**
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring.svc.cluster.local:4318
```

### Alertas como código

```yaml
# k8s/manifests/cpu-alert-rule.yaml
alert: CloudpulseHighCPUUsage
expr: |
  sum(rate(container_cpu_usage_seconds_total{namespace="cloudpulse",...}[2m]))
  / scalar(sum(kube_node_status_allocatable{resource="cpu"})) * 100 > 80
for: 1m
```

O Alertmanager roteia alertas do namespace `cloudpulse` para o webhook logger via `AlertmanagerConfig` CRD:

```bash
kubectl logs -n cloudpulse deployment/alertmanager-webhook-logger -f
```

---

## Pipeline CI/CD

```
push / PR → main
     │
     ├── terraform-validate   (hashicorp/setup-terraform)
     ├── backend-build        (dotnet build, .NET 8)
     ├── frontend-build       (npm ci + vite build, Node 20)
     ├── iac-security         (tfsec → ./infra/terraform)
     ├── container-security   (Trivy → CRITICAL/HIGH CVEs)
     └── sast-codeql          (CodeQL → C# + JavaScript)
```

---

## GitOps com ArgoCD

```bash
# Instalar ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Registrar a Application
kubectl apply -f k8s/argocd/application.yaml

# Acompanhar sincronização
kubectl get applications -n argocd
```

A cada push em `main`, o ArgoCD detecta divergências em `k8s/manifests/` e reconcilia o cluster automaticamente (`prune: true`, `selfHeal: true`).
