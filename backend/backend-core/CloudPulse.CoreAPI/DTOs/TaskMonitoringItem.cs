namespace CloudPulse.CoreAPI.DTOs
{
    public class TaskMonitoringItem
    {
        public string Name      { get; init; } = string.Empty;
        public string Status    { get; init; } = string.Empty;
        public double CpuUsage  { get; init; }
        public DateTime UpdatedAt { get; init; }
    }
}
