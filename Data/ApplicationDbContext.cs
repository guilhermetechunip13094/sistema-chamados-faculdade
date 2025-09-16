using Microsoft.EntityFrameworkCore;
using SistemaChamados.Core.Entities;

namespace SistemaChamados.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }
    
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<AlunoPerfil> AlunoPerfis { get; set; }
    public DbSet<ProfessorPerfil> ProfessorPerfis { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Configuração da entidade Usuario
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.Email).IsRequired().HasMaxLength(150);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.NomeCompleto).IsRequired().HasMaxLength(150);
            entity.Property(e => e.SenhaHash).IsRequired().HasMaxLength(255);
            entity.Property(e => e.TipoUsuario).IsRequired();
            entity.Property(e => e.DataCadastro).IsRequired().HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.Ativo).IsRequired().HasDefaultValue(true);
        });
        
        // Configuração da entidade AlunoPerfil
        modelBuilder.Entity<AlunoPerfil>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UsuarioId).IsRequired();
            entity.HasIndex(e => e.UsuarioId).IsUnique();
            entity.Property(e => e.Matricula).IsRequired().HasMaxLength(20);
            entity.HasIndex(e => e.Matricula).IsUnique();
            entity.Property(e => e.Curso).HasMaxLength(100);
            
            entity.HasOne(e => e.Usuario)
                  .WithOne(u => u.AlunoPerfil)
                  .HasForeignKey<AlunoPerfil>(e => e.UsuarioId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
        
        // Configuração da entidade ProfessorPerfil
        modelBuilder.Entity<ProfessorPerfil>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).ValueGeneratedOnAdd();
            entity.Property(e => e.UsuarioId).IsRequired();
            entity.HasIndex(e => e.UsuarioId).IsUnique();
            entity.Property(e => e.CursoMinistrado).HasMaxLength(100);
            
            entity.HasOne(e => e.Usuario)
                  .WithOne(u => u.ProfessorPerfil)
                  .HasForeignKey<ProfessorPerfil>(e => e.UsuarioId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}