using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaChamados.Application.DTOs;
using SistemaChamados.Application.Services;
using SistemaChamados.Core.Entities;
using SistemaChamados.Data;
using SistemaChamados.Services;
using BCrypt.Net;
using System.Security.Claims;
using System.Security.Cryptography;

namespace SistemaChamados.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsuariosController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;

    public UsuariosController(ApplicationDbContext context, ITokenService tokenService, IEmailService emailService)
    {
        _context = context;
        _tokenService = tokenService;
        _emailService = emailService;
    }

    [HttpPost("registrar-admin")]
    public async Task<ActionResult<UsuarioResponseDto>> RegistrarAdmin(AdminRegisterDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Verificar se email já existe
        if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email))
        {
            return BadRequest(new { message = "Email já está em uso" });
        }

        // Criar usuário admin
        var usuario = new Usuario
        {
            NomeCompleto = dto.NomeCompleto,
            Email = dto.Email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(dto.Senha),
            TipoUsuario = 3, // Admin
            DataCadastro = DateTime.Now,
            Ativo = true
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var response = new UsuarioResponseDto
        {
            Id = usuario.Id,
            NomeCompleto = usuario.NomeCompleto,
            Email = usuario.Email,
            TipoUsuario = usuario.TipoUsuario,
            DataCadastro = usuario.DataCadastro,
            Ativo = usuario.Ativo
        };

        return CreatedAtAction(nameof(RegistrarAdmin), new { id = usuario.Id }, response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto loginRequest)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Buscar usuário pelo email
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == loginRequest.Email);

        // Verificar se usuário existe e senha está correta
        if (usuario == null || !BCrypt.Net.BCrypt.Verify(loginRequest.Senha, usuario.SenhaHash))
        {
            return Unauthorized("Email ou senha inválidos.");
        }

        // Verificar se usuário está ativo
        if (!usuario.Ativo)
        {
            return Unauthorized("Usuário inativo.");
        }

        // Gerar token JWT
        var token = _tokenService.GenerateToken(usuario);

        return Ok(new LoginResponseDto { Token = token });
    }

    [HttpGet("perfil")]
    [Authorize]
    public IActionResult ObterPerfilUsuario()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userId == null)
        {
            return Unauthorized();
        }
        return Ok($"Acesso autorizado. Perfil do usuário com ID: {userId}.");
    }

    [HttpPost("esqueci-senha")]
    [AllowAnonymous] // Permite que usuários não logados acessem este endpoint
    public async Task<IActionResult> EsqueciSenha([FromBody] EsqueciSenhaDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email == request.Email);
        
        // Por segurança, não informamos se o usuário foi encontrado ou não.
        // Apenas retornamos Ok para não permitir que alguém descubra e-mails válidos no sistema.
        if (usuario == null)
        {
            return Ok(new { message = "Se um usuário com este e-mail existir, um link de redefinição de senha foi enviado." });
        }

        // 1. Gerar um token seguro e aleatório
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(64));

        // 2. Salvar o token e a data de expiração no registro do usuário
        usuario.PasswordResetToken = token;
        usuario.ResetTokenExpires = DateTime.UtcNow.AddMinutes(30); // Token expira em 30 minutos

        _context.Usuarios.Update(usuario);
        await _context.SaveChangesAsync();

        // 3. Montar o link de redefinição (a URL do seu frontend)
        var resetLink = $"http://localhost:3000/resetar-senha?token={token}"; // Exemplo de URL de frontend

        // 4. Enviar o e-mail usando o IEmailService
        var subject = "Redefinição de Senha - Sistema de Chamados";
        var message = $@"
            <h1>Redefinição de Senha</h1>
            <p>Olá, {usuario.NomeCompleto},</p>
            <p>Você solicitou a redefinição da sua senha. Por favor, clique no link abaixo para criar uma nova senha:</p>
            <a href='{resetLink}'>Redefinir Minha Senha</a>
            <p>Se você não solicitou isso, por favor, ignore este e-mail.</p>
            <p>Este link expirará em 30 minutos.</p>";

        try
        {
            await _emailService.SendEmailAsync(usuario.Email, subject, message);
        }
        catch (Exception ex)
        {
            // Log do erro (em produção, usar um logger apropriado)
            // Por segurança, não revelamos detalhes do erro para o usuário
            Console.WriteLine($"Erro ao enviar email: {ex.Message}");
        }

        return Ok(new { message = "Se um usuário com este e-mail existir, um link de redefinição de senha foi enviado." });
    }

    [HttpPost("resetar-senha")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetarSenha([FromBody] ResetarSenhaDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // 1. Encontra o usuário pelo token de redefinição de senha
        var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.PasswordResetToken == request.Token);
        
        // 2. Valida o token
        if (usuario == null || usuario.ResetTokenExpires < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Token inválido ou expirado." });
        }
        
        // 3. Cria o hash da nova senha
        var novoSenhaHash = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);
        
        // 4. Atualiza a senha do usuário e limpa os campos do token
        usuario.SenhaHash = novoSenhaHash;
        usuario.PasswordResetToken = null;
        usuario.ResetTokenExpires = null;
        
        _context.Usuarios.Update(usuario);
        await _context.SaveChangesAsync();
        
        return Ok(new { message = "Senha redefinida com sucesso." });
    }
}