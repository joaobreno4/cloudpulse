resource "docker_volume" "postgres_data" {
  name = "postgres_data_tf"
}

resource "docker_volume" "neo4j_data" {
  name = "neo4j_data_tf"
}

resource "docker_volume" "neo4j_logs" {
  name = "neo4j_logs_tf"
}
