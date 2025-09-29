# GeminiService - Documentação

## Visão Geral

O `GeminiService` é um serviço responsável por se comunicar com a API do Google Gemini para analisar automaticamente a descrição de chamados de suporte técnico, sugerindo categoria, prioridade e título apropriados.

## Estrutura Criada

### 1. Pasta Services
- Localização: `/Services/`
- Contém a interface e implementação do serviço Gemini

### 2. Interface IGeminiService
- Arquivo: `/Services/IGeminiService.cs`
- Define o contrato do serviço com o método `AnalisarChamadoAsync`

### 3. Classe GeminiService
- Arquivo: `/Services/GeminiService.cs`
- Implementa a comunicação com a API do Gemini
- Utiliza HttpClient para requisições HTTP
- Lê configurações do appsettings.json

### 4. DTO de Resposta
- Arquivo: `/Application/DTOs/GeminiAnaliseResponseDto.cs`
- Define a estrutura da resposta da análise

### 5. Endpoint de Análise
- Adicionado ao `ChamadosController`
- Rota: `POST /api/chamados/analisar`

## Configuração

### appsettings.json
```json
{
  "Gemini": {
    "ApiKey": "sua-chave-da-api-gemini"
  }
}
```

### Registro no DI Container (Program.cs)
```csharp
builder.Services.AddScoped<IGeminiService, GeminiService>();
builder.Services.AddHttpClient<IGeminiService, GeminiService>();
```

## Como Usar

### 1. Endpoint de Análise
**POST** `/api/chamados/analisar`

**Request Body:**
```json
{
  "descricaoProblema": "Não consigo acessar o sistema acadêmico. Aparece erro 500 quando tento fazer login."
}
```

**Response:**
```json
{
  "categoriaId": 1,
  "categoriaNome": "Sistema Acadêmico",
  "prioridadeId": 3,
  "prioridadeNome": "Alta",
  "tituloSugerido": "Erro 500 no login do sistema acadêmico",
  "justificativa": "Problema classificado como alta prioridade devido ao impacto no acesso ao sistema acadêmico, categoria identificada baseada na descrição do problema.",
  "confiancaCategoria": 0.95,
  "confiancaPrioridade": 0.87
}
```

### 2. Uso Programático
```csharp
public class ExemploController : ControllerBase
{
    private readonly IGeminiService _geminiService;

    public ExemploController(IGeminiService geminiService)
    {
        _geminiService = geminiService;
    }

    public async Task<IActionResult> AnalisarProblema(string descricao)
    {
        var analise = await _geminiService.AnalisarChamadoAsync(descricao);
        
        if (analise != null)
        {
            // Usar os dados da análise
            Console.WriteLine($"Categoria sugerida: {analise.CategoriaNome}");
            Console.WriteLine($"Prioridade sugerida: {analise.PrioridadeNome}");
            Console.WriteLine($"Título sugerido: {analise.TituloSugerido}");
        }
        
        return Ok(analise);
    }
}
```

## Funcionalidades

### Análise Inteligente
- Analisa a descrição do problema usando IA
- Sugere categoria mais apropriada baseada no conteúdo
- Determina prioridade baseada na urgência e impacto
- Gera título claro e conciso para o chamado

### Contexto Dinâmico
- Busca categorias e prioridades ativas do banco de dados
- Inclui no prompt as opções disponíveis no sistema
- Adapta-se automaticamente a mudanças nas configurações

### Resposta Estruturada
- Retorna dados em formato JSON estruturado
- Inclui níveis de confiança para as sugestões
- Fornece justificativa para as escolhas feitas

### Tratamento de Erros
- Log detalhado de erros
- Tratamento gracioso de falhas da API
- Retorno de null em caso de erro (permite fallback)

## Exemplo de Prompt Gerado

O serviço gera automaticamente um prompt estruturado que inclui:

1. **Contexto**: Descrição do papel do assistente
2. **Problema**: A descrição fornecida pelo usuário
3. **Opções Disponíveis**: Categorias e prioridades do banco
4. **Instruções**: Como analisar e classificar
5. **Formato**: Estrutura JSON esperada na resposta

## Considerações de Segurança

- A chave da API é lida do arquivo de configuração
- Não há exposição de dados sensíveis nos logs
- Validação de entrada nos endpoints
- Tratamento seguro de exceções

## Extensibilidade

O serviço pode ser facilmente estendido para:
- Análise de outros tipos de conteúdo
- Integração com outras APIs de IA
- Personalização de prompts por contexto
- Cache de respostas para otimização