// DTO para a requisição à API da OpenAI
public class OpenAIRequest
{
    public string model { get; set; } = string.Empty;
    public List<OpenAIMessage> messages { get; set; } = new();
    public double temperature { get; set; }
}

public class OpenAIMessage
{
    public string role { get; set; } = string.Empty;
    public string content { get; set; } = string.Empty;
}

// DTOs para a resposta da API da OpenAI
public class OpenAIResponse
{
    public List<OpenAIChoice> choices { get; set; } = new();
}

public class OpenAIChoice
{
    public OpenAIMessage message { get; set; } = new();
}