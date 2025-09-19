using System.ComponentModel.DataAnnotations;

namespace SistemaChamados.Application.DTOs;

public class CriarChamadoRequestDto
{
    [Required(ErrorMessage = "Título é obrigatório")]
    [StringLength(200, ErrorMessage = "Título deve ter no máximo 200 caracteres")]
    public string Titulo { get; set; } = string.Empty;

    [Required(ErrorMessage = "Descrição é obrigatória")]
    [StringLength(2000, ErrorMessage = "Descrição deve ter no máximo 2000 caracteres")]
    public string Descricao { get; set; } = string.Empty;

    [Required(ErrorMessage = "Categoria é obrigatória")]
    [Range(1, int.MaxValue, ErrorMessage = "ID da categoria deve ser maior que zero")]
    public int CategoriaId { get; set; }

    [Required(ErrorMessage = "Prioridade é obrigatória")]
    [Range(1, int.MaxValue, ErrorMessage = "ID da prioridade deve ser maior que zero")]
    public int PrioridadeId { get; set; }
}