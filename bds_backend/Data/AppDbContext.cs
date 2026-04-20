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
    public DbSet<ServiceCounter> ServiceCounters => Set<ServiceCounter>();

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
            .Property(s => s.Label)
            .HasMaxLength(450);

        modelBuilder.Entity<BranchTimeSlot>()
            .HasIndex(s => new { s.BranchId, s.Label })
            .IsUnique();

        modelBuilder.Entity<ServiceCounter>()
            .HasOne(c => c.Branch)
            .WithMany()
            .HasForeignKey(c => c.BranchId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ServiceCounter>()
            .Property(c => c.Label)
            .HasMaxLength(80);

        modelBuilder.Entity<ServiceCounter>()
            .Property(c => c.ServiceType)
            .HasMaxLength(120);

        modelBuilder.Entity<ServiceCounter>()
            .Property(c => c.ClosedReason)
            .HasMaxLength(200);

        modelBuilder.Entity<ServiceCounter>()
            .HasIndex(c => new { c.BranchId, c.Label })
            .IsUnique();
    }
}
