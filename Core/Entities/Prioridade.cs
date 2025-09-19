namespace SistemaChamados.Core.Entities;

public class Prioridade
{
    public int Id { get; set; }
    public string Nome { get; set; } = string.Empty;
    public string? Descricao { get; set; }
    public int Nivel { get; set; } // 1 = Baixa, 2 = Média, 3 = Alta, 4 = Crítica
    public bool Ativo { get; set; } = true;
    public DateTime DataCadastro { get; set; } = DateTime.Now;
    
    // Propriedade de navegação
    public virtual ICollection<Chamado> Chamados { get; set; } = new List<Chamado>();
}