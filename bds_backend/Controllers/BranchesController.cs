using bds_backend.Data;
using bds_backend.Dtos;
using bds_backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace bds_backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BranchesController(
    AppDbContext db,
    WaitPredictionService waitPrediction) : ControllerBase
{
    /// <summary>List branches with server-side wait estimates (0 min when nobody is waiting).</summary>
    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<BranchListItemDto>>> List(CancellationToken ct)
    {
        var branches = await db.Branches.AsNoTracking().OrderBy(b => b.Id).ToListAsync(ct);
        var now = DateTime.UtcNow;
        var list = new List<BranchListItemDto>();

        foreach (var b in branches)
        {
            var slots = await db.BranchTimeSlots.AsNoTracking()
                .Where(s => s.BranchId == b.Id)
                .ToListAsync(ct);
            var hasAvailable = slots.Count == 0 || slots.Any(s => s.BookedCount < s.Capacity);
            var overcrowded = string.Equals(b.CrowdLevel, "High", StringComparison.OrdinalIgnoreCase);
            var canBook = !b.BookingDisabled && hasAvailable && !overcrowded;

            var predict = await waitPrediction.PredictAsync(new PredictWaitRequest
            {
                BranchId = b.Id,
                DayOfWeek = (int)now.DayOfWeek,
                HourOfDay = now.Hour,
                Month = now.Month,
                ServiceType = "GeneralBanking",
                QueueLength = b.WaitingCount,
                CountersOpen = 4,
            }, ct);

            list.Add(new BranchListItemDto
            {
                Id = b.Id,
                Name = b.Name,
                DistanceKm = b.DistanceKm,
                CrowdLevel = b.CrowdLevel,
                SlotCapacity = b.SlotCapacity,
                SlotBooked = b.SlotBooked,
                WaitingCount = b.WaitingCount,
                BookingDisabled = b.BookingDisabled,
                HasAvailableSlot = hasAvailable,
                IsOvercrowded = overcrowded,
                CanBook = canBook,
                EstimatedWaitMinutes = predict.WaitMinutes,
                EstimateSource = predict.Source,
            });
        }

        return Ok(list);
    }

    /// <summary>Time slots with live capacity (Module 2).</summary>
    [AllowAnonymous]
    [HttpGet("{id:int}/slots")]
    public async Task<ActionResult<IReadOnlyList<BranchTimeSlotDto>>> Slots(int id, CancellationToken ct)
    {
        var exists = await db.Branches.AsNoTracking().AnyAsync(b => b.Id == id, ct);
        if (!exists) return NotFound();

        var rows = await db.BranchTimeSlots.AsNoTracking()
            .Where(s => s.BranchId == id)
            .OrderBy(s => s.Id)
            .Select(s => new BranchTimeSlotDto
            {
                Label = s.Label,
                Capacity = s.Capacity,
                Booked = s.BookedCount,
            })
            .ToListAsync(ct);

        return Ok(rows);
    }

    /// <summary>Demo: advance the serving counter (staff / test). Decrements waiting count.</summary>
    [AllowAnonymous]
    [HttpPost("{id:int}/call-next")]
    public async Task<IActionResult> CallNext(int id, CancellationToken ct)
    {
        var branch = await db.Branches.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (branch is null) return NotFound();

        if (branch.WaitingCount > 0)
        {
            branch.NowServingNumber++;
            branch.WaitingCount--;
        }
        else
        {
            branch.NowServingNumber++;
        }

        await db.SaveChangesAsync(ct);
        return Ok(new { branch.NowServingNumber, branch.WaitingCount });
    }
}
