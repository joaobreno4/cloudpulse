using Microsoft.EntityFrameworkCore;
using CloudPulse.CoreAPI.Entities;

namespace CloudPulse.CoreAPI.Data
{
    public class AppDbContext : DbContext
    {
        // Certifique-se de que o construtor receba DbContextOptions<AppDbContext>
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<ServiceEntity> Services { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            
            // Força a tabela a ser gerada com letras minúsculas no Postgres
            modelBuilder.Entity<ServiceEntity>().ToTable("services");
        }
    }
}
