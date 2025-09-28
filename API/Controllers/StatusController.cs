using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaChamados.Core.Entities;
using SistemaChamados.Data;

namespace SistemaChamados.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StatusController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public StatusController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetStatus()
    {
        var status = await _context.Status
            .Where(s => s.Ativo)
            .ToListAsync();

        return Ok(status);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetStatusPorId(int id)
    {
        var status = await _context.Status
            .FirstOrDefaultAsync(s => s.Id == id);

        if (status == null)
        {
            return NotFound("Status não encontrado.");
        }

        return Ok(status);
    }

    [HttpPost]
    public async Task<IActionResult> CriarStatus([FromBody] CriarStatusDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var status = new Status
        {
            Nome = request.Nome,
            Descricao = request.Descricao,
            Ativo = true
        };

        _context.Status.Add(status);
        await _context.SaveChangesAsync();

        return Ok(status);
    }
}

// DTO para Status
public class CriarStatusDto
{
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
}