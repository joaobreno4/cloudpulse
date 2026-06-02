# 🗄️ Imagem e Container do PostgreSQL
resource "docker_image" "postgres_img" {
  name         = "postgres:15-alpine"
  keep_locally = true
}

resource "docker_container" "postgres_db" {
  name  = "cloudpulse-postgres-tf"
  image = docker_image.postgres_img.image_id

  env = [
    "POSTGRES_DB=cloudpulse_db",
    "POSTGRES_USER=cloudpulse_user",
    "POSTGRES_PASSWORD=${var.db_password}"
  ]

  ports {
    internal = 5432
    external = 5432
  }

  volumes {
    volume_name    = docker_volume.postgres_data.name
    container_path = "/var/lib/postgresql/data"
  }

  networks_advanced {
    name = docker_network.cloudpulse_net.name
  }
}

# 🕸️ Imagem e Container do Neo4j
resource "docker_image" "neo4j_img" {
  name         = "neo4j:5.12.0-community"
  keep_locally = true
}

resource "docker_container" "neo4j_db" {
  name  = "cloudpulse-neo4j-tf"
  image = docker_image.neo4j_img.image_id

  env = [
    "NEO4J_AUTH=neo4j/${var.db_password}"
  ]

  ports {
    internal = 7474
    external = 7474
  }

  ports {
    internal = 7687
    external = 7687
  }

  volumes {
    volume_name    = docker_volume.neo4j_data.name
    container_path = "/data"
  }

  volumes {
    volume_name    = docker_volume.neo4j_logs.name
    container_path = "/logs"
  }

  networks_advanced {
    name = docker_network.cloudpulse_net.name
  }
}
