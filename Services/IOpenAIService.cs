using SistemaChamados.Application.DTOs;

namespace SistemaChamados.Services
{
    public interface IOpenAIService
    {
        Task<AnaliseChamadoResponseDto?> AnalisarChamadoAsync(string descricaoProblema);
    }
}