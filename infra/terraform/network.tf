resource "docker_network" "cloudpulse_net" {
  name   = "cloudpulse_net_tf"
  driver = "bridge"
}
