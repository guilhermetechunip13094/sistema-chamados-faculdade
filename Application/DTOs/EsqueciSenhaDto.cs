using System.ComponentModel.DataAnnotations;

namespace SistemaChamados.Application.DTOs;

public class EsqueciSenhaDto
{
    [Required(ErrorMessage = "O email é obrigatório")]
    [EmailAddress(ErrorMessage = "Formato de email inválido")]
    public string Email { get; set; } = string.Empty;
}