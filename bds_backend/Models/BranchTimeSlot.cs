namespace bds_backend.Models;

/// <summary>Per-branch time window with capacity (Module 2).</summary>
public class BranchTimeSlot
{
    public int Id { get; set; }
    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public string Label { get; set; } = string.Empty;
    public int Capacity { get; set; } = 8;
    public int BookedCount { get; set; }
}
