using bds_backend.Data;
using bds_backend.Dtos;
using bds_backend.Models;
using bds_backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bds_backend.Controllers;

/// <summary>Branch staff operations + customer simulator (FYP: anonymous for demo; lock down in production).</summary>
[ApiController]
[Route("api/staff/branches/{branchId:int}")]
[AllowAnonymous]
public class StaffBranchController(
    AppDbContext db,
    WaitPredictionService waitPrediction,
    IConfiguration config,
    ILogger<StaffBranchController> log) : ControllerBase
{
    private const string SimulatorEmail = "simulator@bds.demo";

    [HttpGet("dashboard")]
    public async Task<ActionResult<StaffBranchDashboardDto>> Dashboard(int branchId, CancellationToken ct)
    {
        var branch = await db.Branches.AsNoTracking().FirstOrDefaultAsync(b => b.Id == branchId, ct);
        if (branch is null) return NotFound();

        var counters = await db.ServiceCounters.AsNoTracking()
            .Where(c => c.BranchId == branchId)
            .OrderBy(c => c.Id)
            .ToListAsync(ct);

        var waiting = await db.QueueTickets.AsNoTracking()
            .Where(t => t.BranchId == branchId && t.Status == "Waiting")
            .OrderBy(t => t.QueueNumber)
            .Select(t => new StaffWaitingTicketDto
            {
                Id = t.Id,
                QueueLabel = t.QueueLabel,
                ServiceType = t.ServiceType,
                TimeSlotLabel = t.TimeSlotLabel,
                CreatedAtUtc = t.CreatedAtUtc,
            })
            .ToListAsync(ct);

        var openCounters = counters.Count(c => c.IsOpen);
        var now = DateTime.UtcNow;
        var predict = await waitPrediction.PredictAsync(new PredictWaitRequest
        {
            BranchId = branchId,
            DayOfWeek = (int)now.DayOfWeek,
            HourOfDay = now.Hour,
            Month = now.Month,
            ServiceType = "GeneralBanking",
            QueueLength = Math.Max(0, branch.WaitingCount - 1),
            CountersOpen = Math.Max(1, openCounters),
        }, ct);

        return Ok(new StaffBranchDashboardDto
        {
            BranchId = branch.Id,
            BranchName = branch.Name,
            CrowdLevel = branch.CrowdLevel,
            BookingDisabled = branch.BookingDisabled,
            NowServingNumber = branch.NowServingNumber,
            NowServingLabel = $"Q-{branch.NowServingNumber}",
            WaitingCount = branch.WaitingCount,
            LastIssuedNumber = branch.LastIssuedNumber,
            OpenCounters = openCounters,
            TotalCounters = counters.Count,
            EstimatedWaitNextMinutes = predict.WaitMinutes,
            EstimateSource = predict.Source,
            WaitingTickets = waiting,
            Counters = counters.Select(c => new StaffCounterDto
            {
                Id = c.Id,
                Label = c.Label,
                ServiceType = c.ServiceType,
                IsOpen = c.IsOpen,
                ClosedReason = c.ClosedReason,
            }).ToList(),
        });
    }

    [HttpPost("call-next")]
    public async Task<ActionResult<StaffCallNextResponse>> CallNext(int branchId, CancellationToken ct)
    {
        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == branchId, ct);
        if (branch is null) return NotFound();

        var next = await db.QueueTickets
            .Where(t => t.BranchId == branchId && t.Status == "Waiting")
            .OrderBy(t => t.QueueNumber)
            .FirstOrDefaultAsync(ct);

        if (next is null)
            return Conflict(new { message = "No customers waiting in the queue." });

        next.Status = "Done";
        branch.NowServingNumber = next.QueueNumber;
        branch.WaitingCount = Math.Max(0, branch.WaitingCount - 1);

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        log.LogInformation("Staff called next at branch {BranchId}: served {Label}", branchId, next.QueueLabel);

        return Ok(new StaffCallNextResponse
        {
            ServedQueueLabel = next.QueueLabel,
            NowServingNumber = branch.NowServingNumber,
            WaitingRemaining = branch.WaitingCount,
        });
    }

    [HttpPatch("counters/{counterId:int}")]
    public async Task<ActionResult<StaffCounterDto>> UpdateCounter(
        int branchId,
        int counterId,
        [FromBody] StaffUpdateCounterRequest body,
        CancellationToken ct)
    {
        var counter = await db.ServiceCounters.FirstOrDefaultAsync(
            c => c.Id == counterId && c.BranchId == branchId, ct);
        if (counter is null) return NotFound();

        var branch = await db.Branches.AsNoTracking().FirstAsync(b => b.Id == branchId, ct);
        var all = await db.ServiceCounters.Where(c => c.BranchId == branchId).ToListAsync(ct);

        var minOpen = config.GetValue("Staff:LunchPolicy:MinOpenCounters", 2);
        var maxLunch = config.GetValue("Staff:LunchPolicy:MaxConcurrentLunchClosures", 1);
        var enforceWhenWaiting = config.GetValue("Staff:LunchPolicy:EnforceMinOpenWhenWaitingExceeds", 0);

        if (!body.IsOpen)
        {
            var openAfter = all.Sum(c =>
            {
                var open = c.Id == counterId ? body.IsOpen : c.IsOpen;
                return open ? 1 : 0;
            });

            var shouldEnforce = enforceWhenWaiting <= 0 || branch.WaitingCount >= enforceWhenWaiting;
            if (shouldEnforce && openAfter < minOpen)
            {
                return Conflict(new
                {
                    message = $"Cannot close: at least {minOpen} counter(s) must stay open (branch policy while customers may be waiting).",
                });
            }

            var reason = body.ClosedReason?.Trim() ?? "Closed";
            if (counter.IsOpen && reason.Contains("lunch", StringComparison.OrdinalIgnoreCase))
            {
                var otherOnLunch = all.Count(c => c.Id != counterId
                    && !c.IsOpen
                    && (c.ClosedReason?.Contains("lunch", StringComparison.OrdinalIgnoreCase) ?? false));
                if (otherOnLunch >= maxLunch)
                {
                    return Conflict(new
                    {
                        message = $"Only {maxLunch} counter(s) may be on lunch at the same time (stakeholder rule).",
                    });
                }
            }
        }

        counter.IsOpen = body.IsOpen;
        counter.ClosedReason = body.IsOpen ? null : (string.IsNullOrWhiteSpace(body.ClosedReason) ? "Closed" : body.ClosedReason.Trim());

        await db.SaveChangesAsync(ct);

        return Ok(new StaffCounterDto
        {
            Id = counter.Id,
            Label = counter.Label,
            ServiceType = counter.ServiceType,
            IsOpen = counter.IsOpen,
            ClosedReason = counter.ClosedReason,
        });
    }

    [HttpPatch("policy")]
    public async Task<IActionResult> PatchPolicy(int branchId, [FromBody] StaffBranchPolicyPatchRequest body, CancellationToken ct)
    {
        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == branchId, ct);
        if (branch is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(body.CrowdLevel))
        {
            var cl = body.CrowdLevel.Trim();
            if (cl.Equals("Low", StringComparison.OrdinalIgnoreCase)) branch.CrowdLevel = "Low";
            else if (cl.Equals("Moderate", StringComparison.OrdinalIgnoreCase)) branch.CrowdLevel = "Moderate";
            else if (cl.Equals("High", StringComparison.OrdinalIgnoreCase)) branch.CrowdLevel = "High";
            else return BadRequest(new { message = "CrowdLevel must be Low, Moderate, or High." });
        }

        if (body.BookingDisabled.HasValue)
            branch.BookingDisabled = body.BookingDisabled.Value;

        await db.SaveChangesAsync(ct);
        return Ok(new { branch.CrowdLevel, branch.BookingDisabled });
    }

    /// <summary>Simulates a customer joining the queue (same rules as authenticated booking).</summary>
    [HttpPost("simulator/join-queue")]
    public async Task<ActionResult<StaffSimulatorJoinResponse>> SimulatorJoin(
        int branchId,
        [FromBody] StaffSimulatorJoinRequest req,
        CancellationToken ct)
    {
        var simUser = await db.UserAccounts.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == SimulatorEmail, ct);
        if (simUser is null)
            return StatusCode(500, new { message = "Simulator user not seeded. Restart the API." });

        if (string.IsNullOrWhiteSpace(req.ServiceType) || string.IsNullOrWhiteSpace(req.TimeSlotLabel))
            return BadRequest(new { message = "ServiceType and TimeSlotLabel are required." });

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == branchId, ct);
        if (branch is null) return NotFound();

        if (branch.BookingDisabled)
            return Conflict(new { message = "Booking is disabled for this branch." });

        if (string.Equals(branch.CrowdLevel, "High", StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "Branch is overcrowded; booking closed." });

        var slot = await db.BranchTimeSlots.FirstOrDefaultAsync(
            s => s.BranchId == branchId && s.Label == req.TimeSlotLabel.Trim(), ct);
        if (slot is null)
            return BadRequest(new { message = "Invalid time slot." });

        if (slot.BookedCount >= slot.Capacity)
            return Conflict(new { message = "This time slot is full." });

        branch.LastIssuedNumber++;
        branch.WaitingCount++;
        branch.SlotBooked++;
        slot.BookedCount++;

        var qn = branch.LastIssuedNumber;
        var label = $"Q-{qn}";
        var ticket = new QueueTicket
        {
            UserId = simUser.Id,
            BranchId = branch.Id,
            ServiceType = req.ServiceType.Trim(),
            TimeSlotLabel = req.TimeSlotLabel.Trim(),
            QueueLabel = label,
            QueueNumber = qn,
            Status = "Waiting",
            CreatedAtUtc = DateTime.UtcNow,
        };

        db.QueueTickets.Add(ticket);
        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return Ok(new StaffSimulatorJoinResponse
        {
            TicketId = ticket.Id,
            QueueLabel = label,
            QueueNumber = qn,
            ServiceType = ticket.ServiceType,
            TimeSlotLabel = ticket.TimeSlotLabel,
        });
    }
}
