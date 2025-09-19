namespace SistemaChamados.Core.Entities;

public class Chamado
{
    public int Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Descricao { get; set; } = string.Empty;
    public DateTime DataAbertura { get; set; } = DateTime.Now;
    public DateTime? DataFechamento { get; set; }
    public DateTime? DataUltimaAtualizacao { get; set; }
    
    // Chaves estrangeiras
    public int SolicitanteId { get; set; }
    public int? TecnicoId { get; set; }
    public int CategoriaId { get; set; }
    public int PrioridadeId { get; set; }
    public int StatusId { get; set; }
    
    // Propriedades de navegação
    public virtual Usuario Solicitante { get; set; } = null!;
    public virtual Usuario? Tecnico { get; set; }
    public virtual Categoria Categoria { get; set; } = null!;
    public virtual Prioridade Prioridade { get; set; } = null!;
    public virtual Status Status { get; set; } = null!;
}