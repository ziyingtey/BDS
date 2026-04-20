namespace bds_backend.Dtos;

public class StaffWaitingTicketDto
{
    public int Id { get; set; }
    public string QueueLabel { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public string TimeSlotLabel { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; }
}

public class StaffCounterDto
{
    public int Id { get; set; }
    public string Label { get; set; } = string.Empty;
    public string ServiceType { get; set; } = string.Empty;
    public bool IsOpen { get; set; }
    public string? ClosedReason { get; set; }
}

public class StaffBranchDashboardDto
{
    public int BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public string CrowdLevel { get; set; } = string.Empty;
    public bool BookingDisabled { get; set; }
    public int NowServingNumber { get; set; }
    public string NowServingLabel { get; set; } = string.Empty;
    public int WaitingCount { get; set; }
    public int LastIssuedNumber { get; set; }
    public int OpenCounters { get; set; }
    public int TotalCounters { get; set; }
    public double EstimatedWaitNextMinutes { get; set; }
    public string EstimateSource { get; set; } = string.Empty;
    public IReadOnlyList<StaffWaitingTicketDto> WaitingTickets { get; set; } = Array.Empty<StaffWaitingTicketDto>();
    public IReadOnlyList<StaffCounterDto> Counters { get; set; } = Array.Empty<StaffCounterDto>();
}

public class StaffUpdateCounterRequest
{
    public bool IsOpen { get; set; }
    public string? ClosedReason { get; set; }
}

public class StaffBranchPolicyPatchRequest
{
    public string? CrowdLevel { get; set; }
    public bool? BookingDisabled { get; set; }
}

public class StaffSimulatorJoinRequest
{
    public string ServiceType { get; set; } = string.Empty;
    public string TimeSlotLabel { get; set; } = string.Empty;
}

public class StaffSimulatorJoinResponse
{
    public int TicketId { get; set; }
    public string QueueLabel { get; set; } = string.Empty;
    public int QueueNumber { get; set; }
    public string ServiceType { get; set; } = string.Empty;
    public string TimeSlotLabel { get; set; } = string.Empty;
}

public class StaffCallNextResponse
{
    public string? ServedQueueLabel { get; set; }
    public int NowServingNumber { get; set; }
    public int WaitingRemaining { get; set; }
}
