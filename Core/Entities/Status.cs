namespace SistemaChamados.Core.Entities;

public class Status
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public bool Ativo { get; set; } = true;
    public DateTime DataCadastro { get; set; } = DateTime.Now;
    
    // Propriedade de navegação
    public virtual ICollection<Chamado> Chamados { get; set; } = new List<Chamado>();
}