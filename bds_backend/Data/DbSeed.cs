using bds_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace bds_backend.Data;

public static class DbSeed
{
    public static void SeedBranches(AppDbContext db)
    {
        if (db.Branches.Any()) return;

        var slotsLabels = new[]
        {
            "09:00 - 09:30",
            "09:30 - 10:00",
            "10:00 - 10:30",
            "10:30 - 11:00",
            "11:00 - 11:30",
        };

        var b1 = new Branch
        {
            Name = "BDS KL Sentral",
            DistanceKm = 1.2,
            CrowdLevel = "Low",
            SlotCapacity = 8,
            SlotBooked = 5,
            WaitingCount = 3,
            NowServingNumber = 101,
            LastIssuedNumber = 104,
            BookingDisabled = false,
        };
        var b2 = new Branch
        {
            Name = "BDS Mid Valley",
            DistanceKm = 2.3,
            CrowdLevel = "High",
            SlotCapacity = 8,
            SlotBooked = 8,
            WaitingCount = 12,
            NowServingNumber = 200,
            LastIssuedNumber = 212,
            BookingDisabled = true,
        };
        var b3 = new Branch
        {
            Name = "BDS Bangsar",
            DistanceKm = 3.1,
            CrowdLevel = "Moderate",
            SlotCapacity = 8,
            SlotBooked = 8,
            WaitingCount = 6,
            NowServingNumber = 50,
            LastIssuedNumber = 56,
            BookingDisabled = false,
        };
        var b4 = new Branch
        {
            Name = "BDS Damansara",
            DistanceKm = 5.4,
            CrowdLevel = "Low",
            SlotCapacity = 10,
            SlotBooked = 4,
            WaitingCount = 0,
            NowServingNumber = 300,
            LastIssuedNumber = 300,
            BookingDisabled = false,
        };

        db.Branches.AddRange(b1, b2, b3, b4);
        db.SaveChanges();

        var branches = db.Branches.OrderBy(x => x.Id).ToList();
        foreach (var b in branches)
        {
            var bookedPattern = b.Id switch
            {
                1 => new[] { 8, 5, 7, 3, 8 },
                2 => new[] { 8, 8, 8, 8, 8 },
                3 => new[] { 8, 8, 8, 8, 8 },
                _ => new[] { 4, 3, 2, 1, 0 },
            };
            for (var i = 0; i < slotsLabels.Length; i++)
            {
                db.BranchTimeSlots.Add(new BranchTimeSlot
                {
                    BranchId = b.Id,
                    Label = slotsLabels[i],
                    Capacity = 8,
                    BookedCount = bookedPattern[Math.Min(i, bookedPattern.Length - 1)],
                });
            }
        }

        db.SaveChanges();
    }
}
