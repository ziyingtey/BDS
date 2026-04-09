namespace bds_backend.Dtos;

public class PredictWaitRequest
{
    public int BranchId { get; set; }
    public int DayOfWeek { get; set; }
    public int HourOfDay { get; set; }
    public int Month { get; set; }
    public string ServiceType { get; set; } = "GeneralBanking";
    public int QueueLength { get; set; }
    public int CountersOpen { get; set; } = 4;
}

public class PredictWaitResponse
{
    public double WaitMinutes { get; set; }
    public string Source { get; set; } = "fallback";
}
