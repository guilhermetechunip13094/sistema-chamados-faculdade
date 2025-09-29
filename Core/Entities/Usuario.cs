using System.ComponentModel.DataAnnotations;

namespace SistemaChamados.Core.Entities;

public class Usuario
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(150)]
    public string NomeCompleto { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string SenhaHash { get; set; } = string.Empty;
    
    [Required]
    public int TipoUsuario { get; set; } // 1 para Aluno, 2 para Professor, 3 para Admin
    
    [Required]
    public DateTime DataCadastro { get; set; } = DateTime.Now;
    
    [Required]
    public bool Ativo { get; set; } = true;

    public int? EspecialidadeCategoriaId { get; set; }
    
    // Campos para reset de senha
    [MaxLength(128)]
    public string? PasswordResetToken { get; set; }
    
    public DateTime? ResetTokenExpires { get; set; }
    
    // Propriedades de navegação
    public AlunoPerfil? AlunoPerfil { get; set; }
    public ProfessorPerfil? ProfessorPerfil { get; set; }
}