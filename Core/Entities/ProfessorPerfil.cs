using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SistemaChamados.Core.Entities;

public class ProfessorPerfil
{
    public int Id { get; set; }
    
    [Required]
    public int UsuarioId { get; set; }
    
    [MaxLength(100)]
    public string? CursoMinistrado { get; set; }
    
    public int? SemestreMinistrado { get; set; }
    
    // Propriedade de navegação
    [ForeignKey("UsuarioId")]
    public Usuario Usuario { get; set; } = null!;
}