using Microsoft.EntityFrameworkCore;
using SistemaChamados.Application.DTOs;
using SistemaChamados.Data;
using System.Text;
using System.Text.Json;

namespace SistemaChamados.Services;

public class GeminiService : IGeminiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<GeminiService> _logger;

    public GeminiService(HttpClient httpClient, IConfiguration configuration, ApplicationDbContext context, ILogger<GeminiService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _context = context;
        _logger = logger;
    }

    public async Task<GeminiAnaliseResponseDto?> AnalisarChamadoAsync(string descricaoProblema)
    {
        try
        {
            // Buscar categorias e prioridades ativas do banco
            var categorias = await _context.Categorias
                .Where(c => c.Ativo)
                .Select(c => new { c.Id, c.Nome, c.Descricao })
                .ToListAsync();

            var prioridades = await _context.Prioridades
                .Where(p => p.Ativo)
                .OrderBy(p => p.Nivel)
                .Select(p => new { p.Id, p.Nome, p.Descricao, p.Nivel })
                .ToListAsync();

            // Montar o prompt
            var prompt = CriarPromptAnalise(descricaoProblema, categorias, prioridades);

            // Ler a chave da API
            var apiKey = _configuration["Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogError("Chave da API do Gemini não configurada");
                return null;
            }

            // Preparar a requisição para a API do Gemini
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                },
                generationConfig = new
                {
                    temperature = 0.1,
                    topK = 1,
                    topP = 1,
                    maxOutputTokens = 2048,
                }
            };

            var jsonContent = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            // URL da API do Gemini
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={apiKey}";

            // Fazer a requisição
            var response = await _httpClient.PostAsync(url, content);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError($"Erro na API do Gemini: {response.StatusCode} - {errorContent}");
                return null;
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            
            // Parse da resposta do Gemini
            var geminiResponse = JsonSerializer.Deserialize<GeminiApiResponse>(responseContent);
            
            if (geminiResponse?.candidates?.Length > 0 && 
                geminiResponse.candidates[0].content?.parts?.Length > 0)
            {
                var responseText = geminiResponse.candidates[0].content!.parts![0].text;
                
                // Tentar fazer parse do JSON retornado
                if (!string.IsNullOrEmpty(responseText))
                {
                    return ParsearRespostaGemini(responseText);
                }
            }

            _logger.LogWarning("Resposta vazia ou inválida da API do Gemini");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao analisar chamado com Gemini");
            return null;
        }
    }

    private string CriarPromptAnalise(string descricaoProblema, IEnumerable<dynamic> categorias, IEnumerable<dynamic> prioridades)
    {
        var categoriasTexto = string.Join("\n", categorias.Select(c => $"- ID: {c.Id}, Nome: {c.Nome}, Descrição: {c.Descricao ?? "N/A"}"));
        var prioridadesTexto = string.Join("\n", prioridades.Select(p => $"- ID: {p.Id}, Nome: {p.Nome}, Nível: {p.Nivel}, Descrição: {p.Descricao ?? "N/A"}"));

        return $@"
Você é um assistente especializado em análise de chamados de suporte técnico para uma faculdade.

Analise a seguinte descrição de problema e classifique-a de acordo com as categorias e prioridades disponíveis:

**DESCRIÇÃO DO PROBLEMA:**
{descricaoProblema}

**CATEGORIAS DISPONÍVEIS:**
{categoriasTexto}

**PRIORIDADES DISPONÍVEIS:**
{prioridadesTexto}

**INSTRUÇÕES:**
1. Analise cuidadosamente a descrição do problema
2. Identifique a categoria mais apropriada baseada no conteúdo
3. Determine a prioridade baseada na urgência e impacto do problema
4. Sugira um título claro e conciso para o chamado
5. Forneça uma justificativa para suas escolhas
6. Indique seu nível de confiança (0.0 a 1.0) para categoria e prioridade

**FORMATO DE RESPOSTA (JSON):**
Responda APENAS com um JSON válido no seguinte formato:

{{
  ""CategoriaId"": [ID da categoria escolhida],
  ""CategoriaNome"": ""[Nome da categoria]"",
  ""PrioridadeId"": [ID da prioridade escolhida],
  ""PrioridadeNome"": ""[Nome da prioridade]"",
  ""TituloSugerido"": ""[Título sugerido para o chamado]"",
  ""Justificativa"": ""[Explicação das escolhas feitas]"",
  ""ConfiancaCategoria"": [valor entre 0.0 e 1.0],
  ""ConfiancaPrioridade"": [valor entre 0.0 e 1.0]
}}

IMPORTANTE: Responda APENAS com o JSON, sem texto adicional antes ou depois.";
    }

    private GeminiAnaliseResponseDto? ParsearRespostaGemini(string responseText)
    {
        try
        {
            // Limpar possíveis caracteres extras
            var jsonText = responseText.Trim();
            
            // Remover possíveis marcadores de código se existirem
            if (jsonText.StartsWith("```json"))
            {
                jsonText = jsonText.Substring(7);
            }
            if (jsonText.EndsWith("```"))
            {
                jsonText = jsonText.Substring(0, jsonText.Length - 3);
            }
            
            jsonText = jsonText.Trim();

            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            return JsonSerializer.Deserialize<GeminiAnaliseResponseDto>(jsonText, options);
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, $"Erro ao fazer parse da resposta do Gemini: {responseText}");
            return null;
        }
    }
}

// Classes para deserialização da resposta da API do Gemini
public class GeminiApiResponse
{
    public GeminiCandidate[]? candidates { get; set; }
}

public class GeminiCandidate
{
    public GeminiContent? content { get; set; }
}

public class GeminiContent
{
    public GeminiPart[]? parts { get; set; }
}

public class GeminiPart
{
    public string? text { get; set; }
}