using SistemaChamados.Application.DTOs;

namespace SistemaChamados.Services;

public interface IGeminiService
{
    Task<GeminiAnaliseResponseDto?> AnalisarChamadoAsync(string descricaoProblema);
}