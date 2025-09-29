namespace SistemaChamados.Application.DTOs;

public class AnaliseChamadoResponseDto
{
    public int CategoriaId { get; set; }
    public string CategoriaNome { get; set; } = string.Empty;
    public int PrioridadeId { get; set; }
    public string PrioridadeNome { get; set; } = string.Empty;
    public string TituloSugerido { get; set; } = string.Empty;
    public string Justificativa { get; set; } = string.Empty;
    public double ConfiancaCategoria { get; set; }
    public double ConfiancaPrioridade { get; set; }
    public int? TecnicoId { get; set; }
    public string? TecnicoNome { get; set; }
}