using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaChamados.Core.Entities;
using SistemaChamados.Data;

namespace SistemaChamados.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PrioridadesController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PrioridadesController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPrioridades()
    {
        var prioridades = await _context.Prioridades
            .Where(p => p.Ativo)
            .OrderBy(p => p.Nivel)
            .ToListAsync();

        return Ok(prioridades);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPrioridade(int id)
    {
        var prioridade = await _context.Prioridades
            .FirstOrDefaultAsync(p => p.Id == id);

        if (prioridade == null)
        {
            return NotFound("Prioridade não encontrada.");
        }

        return Ok(prioridade);
    }

    [HttpPost]
    public async Task<IActionResult> CriarPrioridade([FromBody] CriarPrioridadeDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var prioridade = new Prioridade
        {
            Nome = request.Nome,
            Nivel = request.Nivel,
            Descricao = request.Descricao,
            Ativo = true
        };

        _context.Prioridades.Add(prioridade);
        await _context.SaveChangesAsync();

        return Ok(prioridade);
    }
}

// DTO para Prioridade
public class CriarPrioridadeDto
{
    public string Nome { get; set; } = string.Empty;
    public int Nivel { get; set; }
    public string? Descricao { get; set; }
}
