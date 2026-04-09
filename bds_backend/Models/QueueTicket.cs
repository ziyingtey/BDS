namespace bds_backend.Models;

public class QueueTicket
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public UserAccount User { get; set; } = null!;

    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    /// <summary>General Banking | Card Services | Wealth Management (display)</summary>
    public string ServiceType { get; set; } = string.Empty;

    public string TimeSlotLabel { get; set; } = string.Empty;
    public string QueueLabel { get; set; } = string.Empty;

    /// <summary>Same integer as QueueLabel Q-{n} for ordering.</summary>
    public int QueueNumber { get; set; }

    public string Status { get; set; } = "Waiting"; // Waiting | Done | Cancelled

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
