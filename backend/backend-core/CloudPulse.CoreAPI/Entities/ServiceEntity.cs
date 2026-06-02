using System;

namespace CloudPulse.CoreAPI.Entities
{
    public class ServiceEntity
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Environment { get; set; } = "Production"; // Production, Staging, Dev
        public string Language { get; set; } = string.Empty;    // C#, Python, Go
        public string Status { get; set; } = "UNKNOWN";         // UP, DOWN, DEGRADED, UNKNOWN
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastHealthCheck { get; set; } = DateTime.UtcNow;
    }
}
