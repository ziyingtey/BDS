using Microsoft.EntityFrameworkCore;

namespace bds_backend.Data;

/// <summary>
/// <see cref="DatabaseFacade.EnsureCreated"/> does not add tables when the database already exists
/// (e.g. created before Branch/Queue entities). This applies the missing schema idempotently.
/// </summary>
public static class EnsureBranchQueueSchema
{
    public static void ApplyIfNeeded(AppDbContext db)
    {
        db.Database.ExecuteSqlRaw("""
            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'Branches')
            BEGIN
                CREATE TABLE [Branches] (
                    [Id] int NOT NULL IDENTITY,
                    [Name] nvarchar(max) NOT NULL,
                    [DistanceKm] float NOT NULL,
                    [CrowdLevel] nvarchar(max) NOT NULL,
                    [SlotCapacity] int NOT NULL,
                    [SlotBooked] int NOT NULL,
                    [WaitingCount] int NOT NULL,
                    [NowServingNumber] int NOT NULL,
                    [LastIssuedNumber] int NOT NULL,
                    [BookingDisabled] bit NOT NULL,
                    CONSTRAINT [PK_Branches] PRIMARY KEY ([Id])
                );
            END
            """);

        // nvarchar(max) cannot be used in index keys in SQL Server; EF uses 450 for indexed strings.
        db.Database.ExecuteSqlRaw("""
            IF OBJECT_ID(N'BranchTimeSlots', N'U') IS NOT NULL
            AND NOT EXISTS (
                SELECT 1 FROM sys.indexes i
                WHERE i.object_id = OBJECT_ID(N'BranchTimeSlots')
                  AND i.name = N'IX_BranchTimeSlots_BranchId_Label')
            BEGIN
                DROP TABLE [BranchTimeSlots];
            END
            """);

        db.Database.ExecuteSqlRaw("""
            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'BranchTimeSlots')
            BEGIN
                CREATE TABLE [BranchTimeSlots] (
                    [Id] int NOT NULL IDENTITY,
                    [BranchId] int NOT NULL,
                    [Label] nvarchar(450) NOT NULL,
                    [Capacity] int NOT NULL,
                    [BookedCount] int NOT NULL,
                    CONSTRAINT [PK_BranchTimeSlots] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_BranchTimeSlots_Branches_BranchId] FOREIGN KEY ([BranchId])
                        REFERENCES [Branches] ([Id]) ON DELETE CASCADE
                );
                CREATE UNIQUE INDEX [IX_BranchTimeSlots_BranchId_Label]
                    ON [BranchTimeSlots] ([BranchId], [Label]);
            END
            """);

        db.Database.ExecuteSqlRaw("""
            IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = N'QueueTickets')
            BEGIN
                CREATE TABLE [QueueTickets] (
                    [Id] int NOT NULL IDENTITY,
                    [UserId] int NOT NULL,
                    [BranchId] int NOT NULL,
                    [ServiceType] nvarchar(max) NOT NULL,
                    [TimeSlotLabel] nvarchar(max) NOT NULL,
                    [QueueLabel] nvarchar(max) NOT NULL,
                    [QueueNumber] int NOT NULL,
                    [Status] nvarchar(max) NOT NULL,
                    [CreatedAtUtc] datetime2 NOT NULL,
                    CONSTRAINT [PK_QueueTickets] PRIMARY KEY ([Id]),
                    CONSTRAINT [FK_QueueTickets_UserAccounts_UserId] FOREIGN KEY ([UserId])
                        REFERENCES [UserAccounts] ([Id]),
                    CONSTRAINT [FK_QueueTickets_Branches_BranchId] FOREIGN KEY ([BranchId])
                        REFERENCES [Branches] ([Id])
                );
                CREATE INDEX [IX_QueueTickets_UserId] ON [QueueTickets] ([UserId]);
                CREATE INDEX [IX_QueueTickets_BranchId] ON [QueueTickets] ([BranchId]);
            END
            """);
    }
}
