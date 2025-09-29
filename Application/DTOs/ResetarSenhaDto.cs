using System.ComponentModel.DataAnnotations;

namespace SistemaChamados.Application.DTOs;

public class ResetarSenhaDto
{
    [Required(ErrorMessage = "O token é obrigatório")]
    public string Token { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "A nova senha é obrigatória")]
    [MinLength(6, ErrorMessage = "A senha deve ter pelo menos 6 caracteres")]
    public string NovaSenha { get; set; } = string.Empty;
}