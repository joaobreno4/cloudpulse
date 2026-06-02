# ==========================================
# RECURSO PARA AUTO-BUILD DA API
# ==========================================
resource "null_resource" "build_core_api_image" {
  triggers = {
    always_run = timestamp()
  }
  provisioner "local-exec" {
    command = "docker build --no-cache -t cloudpulse-backend-core:latest ${path.module}/../../backend-core/CloudPulse.CoreAPI/"
  }
}

# ==========================================
# DEFINIÇÃO DE IMAGENS (APIs e Monitoramento)
# ==========================================
resource "docker_image" "metrics_api_img" {
  name         = "cloudpulse-backend-metrics:latest"
  keep_locally = true
}

resource "docker_image" "core_api_img" {
  name         = "cloudpulse-backend-core:latest"
  keep_locally = true
  lifecycle {
    replace_triggered_by = [null_resource.build_core_api_image.id]
  }
}

resource "docker_image" "prometheus_img" {
  name         = "prom/prometheus:latest"
  keep_locally = true
}

resource "docker_image" "grafana_img" {
  name         = "grafana/grafana:latest"
  keep_locally = true
}

# ==========================================
# CONTÊINERES: APLICAÇÕES (APIs)
# ==========================================
resource "docker_container" "core_api" {
  name  = "cloudpulse-core-api-tf"
  image = docker_image.core_api_img.image_id

  networks_advanced {
    name = docker_network.cloudpulse_net.name
  }

  ports {
    internal = 5223
    external = 5223
  }

  env = [
    "ASPNETCORE_ENVIRONMENT=Development",
    "ConnectionStrings__DefaultConnection=Host=cloudpulse-postgres-tf;Port=5432;Database=cloudpulse_db;Username=cloudpulse_user;Password=cloudpulse_password",
    "Neo4j__Username=neo4j",
    "Neo4j__Password=cloudpulse_password",
    "Neo4j__Uri=bolt://cloudpulse-neo4j-tf:7687",
    
    # Variáveis do Datadog Agent (prontas para o futuro)
    "DD_AGENT_HOST=cloudpulse-datadog-agent-tf",
    "DD_SERVICE=cloudpulse-core-api",
    "DD_ENV=production",
    "DD_VERSION=1.0.0"
  ]

  lifecycle {
    replace_triggered_by = [null_resource.build_core_api_image.id]
  }
}

resource "docker_container" "metrics_api" {
  name  = "cloudpulse-metrics-api-tf"
  image = docker_image.metrics_api_img.image_id

  networks_advanced {
    name = docker_network.cloudpulse_net.name
  }

  ports {
    internal = 8001
    external = 8001
  }

  env = [
    "CORE_API_URL=http://cloudpulse-core-api-tf:5223/api/Services",
    "DB_DSN=host=cloudpulse-postgres-tf port=5432 dbname=cloudpulse_db user=cloudpulse_user password=cloudpulse_password"
  ]
}

# ==========================================
# CONTÊINERES: OBSERVABILIDADE (Prometheus/Grafana)
# ==========================================
resource "docker_container" "prometheus" {
  name  = "cloudpulse-prometheus-tf"
  image = docker_image.prometheus_img.image_id

  networks_advanced {
    name = docker_network.cloudpulse_net.name
  }

  ports {
    internal = 9090
    external = 9090
  }

  volumes {
    host_path      = "${path.cwd}/monitoring/prometheus.yml"
    container_path = "/etc/prometheus/prometheus.yml"
    read_only      = true
  }
}

resource "docker_container" "grafana" {
  name  = "cloudpulse-grafana-tf"
  image = docker_image.grafana_img.image_id

  networks_advanced {
    name = docker_network.cloudpulse_net.name
  }

  ports {
    internal = 3000
    external = 3000
  }

  volumes {
    host_path      = "${path.cwd}/monitoring/grafana-datasource.yml"
    container_path = "/etc/grafana/provisioning/datasources/datasource.yml"
    read_only      = true
  }

  env = [
    "GF_SECURITY_ADMIN_PASSWORD=admin"
  ]
}
