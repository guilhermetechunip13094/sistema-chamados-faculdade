using System.ComponentModel.DataAnnotations;

namespace SistemaChamados.Application.DTOs;

public class AdminRegisterDto
{
    [Required(ErrorMessage = "Nome completo é obrigatório")]
    [StringLength(150, ErrorMessage = "Nome completo deve ter no máximo 150 caracteres")]
    public string NomeCompleto { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Email é obrigatório")]
    [EmailAddress(ErrorMessage = "Email deve ter um formato válido")]
    [StringLength(150, ErrorMessage = "Email deve ter no máximo 150 caracteres")]
    public string Email { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Senha é obrigatória")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Senha deve ter entre 6 e 100 caracteres")]
    public string Senha { get; set; } = string.Empty;
}