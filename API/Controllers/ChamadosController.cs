using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaChamados.Application.DTOs;
using SistemaChamados.Core.Entities;
using SistemaChamados.Data;
using System.Security.Claims;

namespace SistemaChamados.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChamadosController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ChamadosController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<IActionResult> CriarChamado([FromBody] CriarChamadoRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // Pega o ID do usuário logado a partir do token JWT.
        var solicitanteIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (solicitanteIdStr == null)
        {
            return Unauthorized(); // Token inválido ou não contém o ID
        }

        // Validar se a categoria existe e está ativa
        var categoria = await _context.Categorias
            .FirstOrDefaultAsync(c => c.Id == request.CategoriaId && c.Ativo);
        if (categoria == null)
        {
            return BadRequest("Categoria não encontrada ou inativa");
        }

        // Validar se a prioridade existe e está ativa
        var prioridade = await _context.Prioridades
            .FirstOrDefaultAsync(p => p.Id == request.PrioridadeId && p.Ativo);
        if (prioridade == null)
        {
            return BadRequest("Prioridade não encontrada ou inativa");
        }

        // Validar se o usuário existe
        var solicitanteId = int.Parse(solicitanteIdStr);
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == solicitanteId && u.Ativo);
        if (usuario == null)
        {
            return Unauthorized("Usuário não encontrado ou inativo");
        }

        var novoChamado = new Chamado
        {
            Titulo = request.Titulo,
            Descricao = request.Descricao,
            DataAbertura = DateTime.UtcNow,
            SolicitanteId = solicitanteId,
            StatusId = 1, // Assumindo que o ID 1 seja "Aberto"
            PrioridadeId = request.PrioridadeId,
            CategoriaId = request.CategoriaId
        };

        _context.Chamados.Add(novoChamado);
        await _context.SaveChangesAsync();

        return Ok(novoChamado);
    }
}