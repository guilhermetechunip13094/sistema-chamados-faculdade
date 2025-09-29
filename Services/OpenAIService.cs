using Microsoft.EntityFrameworkCore;
using SistemaChamados.Application.DTOs;
using SistemaChamados.Data;
using System.Text;
using System.Text.Json;

namespace SistemaChamados.Services
{
    public class OpenAIService : IOpenAIService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<OpenAIService> _logger;

        public OpenAIService(HttpClient httpClient, IConfiguration configuration, ApplicationDbContext context, ILogger<OpenAIService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _context = context;
            _logger = logger;
        }

        public async Task<AnaliseChamadoResponseDto?> AnalisarChamadoAsync(string descricaoProblema)
        {
            var apiKey = _configuration["OpenAI:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
            {
                _logger.LogError("Chave da API da OpenAI não configurada.");
                return null;
            }

            try
            {
                var prompt = await CriarPromptAnalise(descricaoProblema);

                var requestBody = new OpenAIRequest
                {
                    model = "gpt-3.5-turbo",
                    messages = new List<OpenAIMessage>
                    {
                        new OpenAIMessage { role = "system", content = "Você é um especialista em triagem de chamados de TI. Responda apenas com o formato JSON solicitado." },
                        new OpenAIMessage { role = "user", content = prompt }
                    },
                    temperature = 0.2
                };

                var jsonContent = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

                var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Erro na API da OpenAI: {response.StatusCode} - {errorContent}");
                    return null;
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var openAIResponse = JsonSerializer.Deserialize<OpenAIResponse>(responseContent);

                var resultText = openAIResponse?.choices?.FirstOrDefault()?.message?.content;

                if (string.IsNullOrWhiteSpace(resultText))
                {
                    return null;
                }

                var analise = JsonSerializer.Deserialize<AnaliseChamadoResponseDto>(resultText);
                
                if (analise != null)
                {
                    // Nova Lógica: Buscar técnico especialista
                    var tecnicoEspecialista = await _context.Usuarios
                        .FirstOrDefaultAsync(u => u.TipoUsuario == 3 && u.EspecialidadeCategoriaId == analise.CategoriaId && u.Ativo);
                    
                    if (tecnicoEspecialista != null)
                    {
                        analise.TecnicoId = tecnicoEspecialista.Id;
                        analise.TecnicoNome = tecnicoEspecialista.NomeCompleto;
                    }
                }
                
                return analise;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao se comunicar com a OpenAI.");
                return null;
            }
        }

        private async Task<string> CriarPromptAnalise(string descricaoProblema)
        {
            var categorias = await _context.Categorias.Where(c => c.Ativo).ToListAsync();
            var prioridades = await _context.Prioridades.Where(p => p.Ativo).ToListAsync();

            var categoriasTexto = string.Join("\n", categorias.Select(c => $"- ID: {c.Id}, Nome: {c.Nome}"));
            var prioridadesTexto = string.Join("\n", prioridades.Select(p => $"- ID: {p.Id}, Nome: {p.Nome}"));

            return $@"Analise o problema de TI a seguir e classifique-o.

Descrição do Problema: ""{descricaoProblema}""

Categorias Disponíveis:
{categoriasTexto}

Prioridades Disponíveis:
{prioridadesTexto}

Responda APENAS com um JSON no seguinte formato, sem texto adicional:
{{
  ""CategoriaId"": <ID da categoria>,
  ""CategoriaNome"": ""<Nome da categoria>"",
  ""PrioridadeId"": <ID da prioridade>,
  ""PrioridadeNome"": ""<Nome da prioridade>"",
  ""TituloSugerido"": ""<Um título curto e claro para o chamado>"",
  ""Justificativa"": ""<Uma breve justificativa para a sua escolha>""
}}";
        }
    }
}