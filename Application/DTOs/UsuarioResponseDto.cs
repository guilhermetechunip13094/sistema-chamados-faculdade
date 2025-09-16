namespace SistemaChamados.Application.DTOs;

public class UsuarioResponseDto
{
    public int Id { get; set; }
    public string NomeCompleto { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int TipoUsuario { get; set; }
    public DateTime DataCadastro { get; set; }
    public bool Ativo { get; set; }
}