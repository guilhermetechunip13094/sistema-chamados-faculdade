namespace SistemaChamados.Application.DTOs;

public class AtualizarChamadoDto
{
    public int StatusId { get; set; }
    public int? TecnicoId { get; set; } // O '?' indica que este campo é opcional
}