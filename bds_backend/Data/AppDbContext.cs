using bds_backend.Models;
using Microsoft.EntityFrameworkCore;

namespace bds_backend.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<UserAccount> UserAccounts => Set<UserAccount>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<BranchTimeSlot> BranchTimeSlots => Set<BranchTimeSlot>();
    public DbSet<QueueTicket> QueueTickets => Set<QueueTicket>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserAccount>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<QueueTicket>()
            .HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<QueueTicket>()
            .HasOne(t => t.Branch)
            .WithMany()
            .HasForeignKey(t => t.BranchId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<BranchTimeSlot>()
            .HasOne(s => s.Branch)
            .WithMany()
            .HasForeignKey(s => s.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<BranchTimeSlot>()
            .HasIndex(s => new { s.BranchId, s.Label })
            .IsUnique();
    }
}
