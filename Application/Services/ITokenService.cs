using SistemaChamados.Core.Entities;

namespace SistemaChamados.Application.Services;

public interface ITokenService
{
    string GenerateToken(Usuario usuario);
}