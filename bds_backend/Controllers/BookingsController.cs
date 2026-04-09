using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using bds_backend.Data;
using bds_backend.Dtos;
using bds_backend.Models;
using bds_backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bds_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BookingsController(AppDbContext db, WaitPredictionService waitPrediction) : ControllerBase
{
    private static int? GetUserId(ClaimsPrincipal user)
    {
        var v = user.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);
        return int.TryParse(v, out var id) ? id : null;
    }

    /// <summary>Create a queue ticket: capacity check, queue number, updates branch counters (Module 2).</summary>
    [Authorize]
    [HttpPost]
    public async Task<ActionResult<CreateBookingResponse>> Create([FromBody] CreateBookingRequest req, CancellationToken ct)
    {
        var userId = GetUserId(User);
        if (userId is null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(req.ServiceType) || string.IsNullOrWhiteSpace(req.TimeSlotLabel))
            return BadRequest(new { message = "Service and time slot are required." });

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == req.BranchId, ct);
        if (branch is null) return NotFound(new { message = "Branch not found." });

        if (branch.BookingDisabled)
            return Conflict(new { message = "Booking is disabled for this branch." });

        if (string.Equals(branch.CrowdLevel, "High", StringComparison.OrdinalIgnoreCase))
            return Conflict(new { message = "Branch is overcrowded; booking closed." });

        var slot = await db.BranchTimeSlots.FirstOrDefaultAsync(
            s => s.BranchId == req.BranchId && s.Label == req.TimeSlotLabel.Trim(), ct);
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
            UserId = userId.Value,
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

        return Ok(new CreateBookingResponse
        {
            TicketId = ticket.Id,
            BranchId = branch.Id,
            BranchName = branch.Name,
            ServiceType = ticket.ServiceType,
            TimeSlotLabel = ticket.TimeSlotLabel,
            QueueLabel = label,
            QueueNumber = qn,
        });
    }

    /// <summary>Active waiting ticket for the current user (latest).</summary>
    [Authorize]
    [HttpGet("active")]
    public async Task<ActionResult<TicketStatusDto>> Active(CancellationToken ct)
    {
        var userId = GetUserId(User);
        if (userId is null) return Unauthorized();

        var ticket = await db.QueueTickets.AsNoTracking()
            .Where(t => t.UserId == userId && t.Status == "Waiting")
            .OrderByDescending(t => t.Id)
            .FirstOrDefaultAsync(ct);

        if (ticket is null) return NotFound();

        return await BuildStatus(ticket.Id, userId.Value, ct);
    }

    /// <summary>Poll queue position and dynamic ETA (Module 3).</summary>
    [Authorize]
    [HttpGet("{ticketId:int}/status")]
    public async Task<ActionResult<TicketStatusDto>> Status(int ticketId, CancellationToken ct)
    {
        var userId = GetUserId(User);
        if (userId is null) return Unauthorized();

        var ticket = await db.QueueTickets.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.UserId == userId.Value, ct);
        if (ticket is null) return NotFound();

        return await BuildStatus(ticket.Id, userId.Value, ct);
    }

    [Authorize]
    [HttpDelete("{ticketId:int}")]
    public async Task<IActionResult> Cancel(int ticketId, CancellationToken ct)
    {
        var userId = GetUserId(User);
        if (userId is null) return Unauthorized();

        await using var tx = await db.Database.BeginTransactionAsync(ct);

        var ticket = await db.QueueTickets.FirstOrDefaultAsync(t => t.Id == ticketId && t.UserId == userId.Value, ct);
        if (ticket is null) return NotFound();

        if (ticket.Status != "Waiting")
            return Conflict(new { message = "Ticket is not active." });

        var branch = await db.Branches.FirstAsync(b => b.Id == ticket.BranchId, ct);
        var slot = await db.BranchTimeSlots.FirstOrDefaultAsync(
            s => s.BranchId == ticket.BranchId && s.Label == ticket.TimeSlotLabel, ct);

        ticket.Status = "Cancelled";
        branch.WaitingCount = Math.Max(0, branch.WaitingCount - 1);
        branch.SlotBooked = Math.Max(0, branch.SlotBooked - 1);
        if (slot is not null) slot.BookedCount = Math.Max(0, slot.BookedCount - 1);

        await db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return Ok(new { message = "Ticket cancelled." });
    }

    private async Task<ActionResult<TicketStatusDto>> BuildStatus(int ticketId, int userId, CancellationToken ct)
    {
        var ticket = await db.QueueTickets.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == ticketId && t.UserId == userId, ct);
        if (ticket is null) return NotFound();
        if (ticket.Status != "Waiting") return NotFound();

        var branch = await db.Branches.AsNoTracking().FirstAsync(b => b.Id == ticket.BranchId, ct);
        var now = DateTime.UtcNow;

        var ahead = Math.Max(0, ticket.QueueNumber - branch.NowServingNumber - 1);
        var mlType = ToMlServiceType(ticket.ServiceType);

        var predict = await waitPrediction.PredictAsync(new PredictWaitRequest
        {
            BranchId = branch.Id,
            DayOfWeek = (int)now.DayOfWeek,
            HourOfDay = now.Hour,
            Month = now.Month,
            ServiceType = mlType,
            QueueLength = ahead,
            CountersOpen = 4,
        }, ct);

        var dto = new TicketStatusDto
        {
            TicketId = ticket.Id,
            BranchId = branch.Id,
            BranchName = branch.Name,
            ServiceType = ticket.ServiceType,
            TimeSlotLabel = ticket.TimeSlotLabel,
            QueueLabel = ticket.QueueLabel,
            QueueNumber = ticket.QueueNumber,
            NowServingNumber = branch.NowServingNumber,
            NowServingLabel = $"Q-{branch.NowServingNumber}",
            CustomersAhead = ahead,
            EstimatedWaitMinutes = predict.WaitMinutes,
            EstimateSource = predict.Source,
            Status = ticket.Status,
        };

        return Ok(dto);
    }

    private static string ToMlServiceType(string display)
    {
        var d = display.Trim();
        if (d.Contains("Wealth", StringComparison.OrdinalIgnoreCase)) return "WealthManagement";
        if (d.Contains("Card", StringComparison.OrdinalIgnoreCase)) return "CardServices";
        return "GeneralBanking";
    }
}
