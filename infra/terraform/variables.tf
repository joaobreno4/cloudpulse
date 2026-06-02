variable "db_password" {
  description = "Senha padrão para os bancos de dados"
  type        = string
  default     = "cloudpulse_password"
}

variable "environment" {
  description = "Ambiente de execução das APIs (.NET)"
  type        = string
  default     = "Development"
}
