# Sistema de Chamados - API

API desenvolvida em ASP.NET Core 8 para gerenciamento de chamados de suporte técnico em ambiente acadêmico.

## 🏗️ Arquitetura

O projeto segue uma arquitetura limpa com separação de responsabilidades:

```
SistemaChamados/
├── Core/
│   └── Entities/          # Entidades do domínio
├── Application/
│   └── DTOs/              # Data Transfer Objects
├── API/
│   └── Controllers/       # Controllers da API
└── Data/                  # Contexto do Entity Framework
```

## 🚀 Tecnologias Utilizadas

- **ASP.NET Core 8** - Framework web
- **Entity Framework Core** - ORM para acesso a dados
- **SQL Server** - Banco de dados
- **BCrypt.Net** - Hash seguro de senhas
- **Swagger/OpenAPI** - Documentação da API

## 📋 Funcionalidades Implementadas

### ✅ Registro de Usuário Admin

- **Endpoint**: `POST /api/usuarios/registrar-admin`
- **Descrição**: Registra um novo usuário do tipo Administrador
- **Validações**:
  - Email único no sistema
  - Campos obrigatórios
  - Formato de email válido
  - Senha com mínimo de 6 caracteres
- **Segurança**: Senha criptografada com BCrypt

#### Exemplo de Requisição:
```json
{
  "nomeCompleto": "Administrador do Sistema",
  "email": "admin@faculdade.edu.br",
  "senha": "Admin123!"
}
```

#### Exemplo de Resposta (201 Created):
```json
{
  "id": 1,
  "nomeCompleto": "Administrador do Sistema",
  "email": "admin@faculdade.edu.br",
  "tipoUsuario": 3,
  "dataCadastro": "2025-09-16T02:45:00.000Z",
  "ativo": true
}
```

## 🗄️ Banco de Dados

### Script de Criação
Execute o script `Scripts/CreateDatabase.sql` no SQL Server para criar todas as tabelas necessárias.

### Estrutura das Tabelas

O projeto utiliza as seguintes entidades principais:

1. **Usuarios**: Informações básicas dos usuários do sistema
2. **AlunoPerfil**: Perfil específico para alunos (relacionamento 1:1 com Usuarios)
3. **ProfessorPerfil**: Perfil específico para professores (relacionamento 1:1 com Usuarios)
4. **Categorias**: Categorias para classificação dos chamados
5. **Chamados**: Chamados de suporte técnico
6. **HistoricoChamado**: Histórico de alterações nos chamados

### Tipos de Usuário:
- `1` - Aluno
- `2` - Professor  
- `3` - Administrador

### Relacionamentos:
- Usuario 1:1 AlunoPerfil (opcional)
- Usuario 1:1 ProfessorPerfil (opcional)
- Usuario 1:N Chamados (como solicitante)
- Usuario 1:N Chamados (como atribuído)
- Categoria 1:N Chamados
- Chamado 1:N HistoricoChamado

## ⚙️ Configuração

### Pré-requisitos:
- .NET 8 SDK
- SQL Server (LocalDB ou instância completa)

### String de Conexão:
Configure no `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=SistemaChamados;Trusted_Connection=true;TrustServerCertificate=true;"
  }
}
```

### Executar o Projeto:
```bash
dotnet run
```

A API estará disponível em:
- HTTPS: `https://localhost:7000`
- HTTP: `http://localhost:5000`
- Swagger UI: `https://localhost:7000/swagger`

## 🧪 Testes

Use o arquivo `test-admin-register.http` para testar os endpoints com diferentes cenários:
- Registro bem-sucedido
- Email duplicado
- Dados inválidos

## 🔒 Segurança

- **Hash de Senhas**: Utiliza BCrypt com salt automático
- **Validação de Entrada**: Data Annotations para validação
- **CORS**: Configurado para desenvolvimento
- **HTTPS**: Redirecionamento automático

## 📝 Próximos Passos

- [ ] Implementar autenticação JWT
- [ ] Adicionar endpoints para alunos e professores
- [ ] Implementar sistema de chamados
- [ ] Adicionar testes unitários
- [ ] Configurar logging estruturado