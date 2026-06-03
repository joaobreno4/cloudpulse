using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using CloudPulse.CoreAPI.DTOs;

namespace CloudPulse.CoreAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        // ActivitySource nomeado — deve coincidir com o AddSource() registrado no Program.cs.
        private static readonly ActivitySource _source = new("CloudPulse.CoreAPI.Tasks");

        // GET: api/tasks
        [HttpGet]
        public IActionResult GetAll()
        {
            using var activity = _source.StartActivity("tasks.list");

            var tasks = BuildTaskSnapshot();

            // Enriquece o span com atributos semânticos do domínio.
            activity?.SetTag("tasks.total",     tasks.Count);
            activity?.SetTag("tasks.running",   tasks.Count(t => t.Status == "Running"));
            activity?.SetTag("tasks.pending",   tasks.Count(t => t.Status == "Pending"));
            activity?.SetTag("tasks.completed", tasks.Count(t => t.Status == "Completed"));
            activity?.SetTag("tasks.failed",    tasks.Count(t => t.Status == "Failed"));

            return Ok(tasks);
        }

        // Snapshot simulado dos processos internos de monitoramento do cluster.
        // Em produção, substituir pela consulta real ao agendador de tarefas / k8s Jobs.
        private static List<TaskMonitoringItem> BuildTaskSnapshot()
        {
            var rng = new Random();
            var now = DateTime.UtcNow;

            return
            [
                new() { Name = "prometheus-scrape",        Status = "Running",   CpuUsage = Round(rng, 1, 5),   UpdatedAt = now.AddSeconds(-rng.Next(5, 30)) },
                new() { Name = "otel-collector-pipeline",  Status = "Running",   CpuUsage = Round(rng, 2, 8),   UpdatedAt = now.AddSeconds(-rng.Next(5, 30)) },
                new() { Name = "alertmanager-eval",        Status = "Running",   CpuUsage = Round(rng, 0.5, 3), UpdatedAt = now.AddSeconds(-rng.Next(5, 30)) },
                new() { Name = "jaeger-trace-ingestion",   Status = "Running",   CpuUsage = Round(rng, 1, 6),   UpdatedAt = now.AddSeconds(-rng.Next(5, 30)) },
                new() { Name = "grafana-health-check",     Status = "Running",   CpuUsage = Round(rng, 0.2, 2), UpdatedAt = now.AddSeconds(-rng.Next(5, 30)) },
                new() { Name = "neo4j-sync",               Status = "Pending",   CpuUsage = 0,                  UpdatedAt = now.AddMinutes(-rng.Next(1, 5))  },
                new() { Name = "postgres-migration-check", Status = "Completed", CpuUsage = 0,                  UpdatedAt = now.AddMinutes(-rng.Next(2, 10)) },
                new() { Name = "ingress-cert-rotation",    Status = "Completed", CpuUsage = 0,                  UpdatedAt = now.AddHours(-rng.Next(1, 6))    },
                new() { Name = "trivy-image-scan",         Status = "Failed",    CpuUsage = 0,                  UpdatedAt = now.AddMinutes(-rng.Next(5, 20)) },
            ];
        }

        private static double Round(Random rng, double min, double max) =>
            Math.Round(min + rng.NextDouble() * (max - min), 2);
    }
}
