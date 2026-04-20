namespace bds_backend.Models;

/// <summary>Physical counter at a branch (open/closed, lunch, service line).</summary>
public class ServiceCounter
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public string Label { get; set; } = string.Empty;
    /// <summary>General Banking | Card Services | Wealth Management</summary>
    public string ServiceType { get; set; } = string.Empty;

    public bool IsOpen { get; set; } = true;
    /// <summary>When closed: Lunch, Break, Maintenance, etc.</summary>
    public string? ClosedReason { get; set; }
}
