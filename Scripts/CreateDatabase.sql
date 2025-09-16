-- =============================================
-- Script de Criação do Banco de Dados
-- Sistema de Chamados para Faculdade
-- SQL Server
-- =============================================

-- Criar banco de dados (opcional - descomente se necessário)
-- CREATE DATABASE SistemaChamados;
-- GO
-- USE SistemaChamados;
-- GO

-- =============================================
-- 1. Tabela Usuarios
-- =============================================
CREATE TABLE Usuarios (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NomeCompleto NVARCHAR(150) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    SenhaHash NVARCHAR(255) NOT NULL,
    TipoUsuario INT NOT NULL, -- 1 para Aluno, 2 para Professor, 3 para Admin
    DataCadastro DATETIME NOT NULL DEFAULT GETDATE(),
    Ativo BIT NOT NULL DEFAULT 1
);

-- =============================================
-- 2. Tabela AlunoPerfil
-- =============================================
CREATE TABLE AlunoPerfil (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NOT NULL UNIQUE,
    Matricula NVARCHAR(20) NOT NULL UNIQUE,
    Curso NVARCHAR(100),
    Semestre INT,
    CONSTRAINT FK_AlunoPerfil_Usuarios FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)
);

-- =============================================
-- 3. Tabela ProfessorPerfil
-- =============================================
CREATE TABLE ProfessorPerfil (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UsuarioId INT NOT NULL UNIQUE,
    CursoMinistrado NVARCHAR(100),
    SemestreMinistrado INT,
    CONSTRAINT FK_ProfessorPerfil_Usuarios FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)
);

-- =============================================
-- 4. Tabela Categorias
-- =============================================
CREATE TABLE Categorias (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NomeCategoria NVARCHAR(100) NOT NULL UNIQUE
);

-- =============================================
-- 5. Tabela Chamados
-- =============================================
CREATE TABLE Chamados (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Titulo NVARCHAR(200) NOT NULL,
    Descricao NVARCHAR(MAX) NOT NULL,
    DataAbertura DATETIME NOT NULL DEFAULT GETDATE(),
    SalaLaboratorio NVARCHAR(50),
    NumeroMaquina NVARCHAR(50),
    Status NVARCHAR(50) NOT NULL DEFAULT 'Aberto',
    Prioridade NVARCHAR(50) NOT NULL DEFAULT 'Baixa',
    IdUsuarioSolicitante INT NOT NULL,
    IdUsuarioAtribuido INT NULL,
    IdCategoria INT NOT NULL,
    CONSTRAINT FK_Chamados_UsuarioSolicitante FOREIGN KEY (IdUsuarioSolicitante) REFERENCES Usuarios(Id),
    CONSTRAINT FK_Chamados_UsuarioAtribuido FOREIGN KEY (IdUsuarioAtribuido) REFERENCES Usuarios(Id),
    CONSTRAINT FK_Chamados_Categorias FOREIGN KEY (IdCategoria) REFERENCES Categorias(Id)
);

-- =============================================
-- 6. Tabela HistoricoChamado
-- =============================================
CREATE TABLE HistoricoChamado (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    IdChamado INT NOT NULL,
    IdUsuario INT NOT NULL,
    Descricao NVARCHAR(MAX) NOT NULL,
    DataOcorrencia DATETIME NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_HistoricoChamado_Chamados FOREIGN KEY (IdChamado) REFERENCES Chamados(Id),
    CONSTRAINT FK_HistoricoChamado_Usuarios FOREIGN KEY (IdUsuario) REFERENCES Usuarios(Id)
);

-- =============================================
-- Índices adicionais para performance
-- =============================================

-- Índice para busca por email (já criado automaticamente pela constraint UNIQUE)
-- CREATE UNIQUE INDEX IX_Usuarios_Email ON Usuarios(Email);

-- Índice para busca por matrícula (já criado automaticamente pela constraint UNIQUE)
-- CREATE UNIQUE INDEX IX_AlunoPerfil_Matricula ON AlunoPerfil(Matricula);

-- Índices para melhorar performance nas consultas de chamados
CREATE INDEX IX_Chamados_Status ON Chamados(Status);
CREATE INDEX IX_Chamados_DataAbertura ON Chamados(DataAbertura);
CREATE INDEX IX_Chamados_IdUsuarioSolicitante ON Chamados(IdUsuarioSolicitante);
CREATE INDEX IX_Chamados_IdUsuarioAtribuido ON Chamados(IdUsuarioAtribuido);
CREATE INDEX IX_Chamados_IdCategoria ON Chamados(IdCategoria);

-- Índices para histórico de chamados
CREATE INDEX IX_HistoricoChamado_IdChamado ON HistoricoChamado(IdChamado);
CREATE INDEX IX_HistoricoChamado_DataOcorrencia ON HistoricoChamado(DataOcorrencia);

-- =============================================
-- Dados iniciais (opcional)
-- =============================================

-- Inserir categorias padrão
INSERT INTO Categorias (NomeCategoria) VALUES 
('Hardware'),
('Software'),
('Rede'),
('Impressora'),
('Sistema Operacional'),
('Aplicativo'),
('Outros');

-- =============================================
-- Comentários sobre o esquema
-- =============================================

/*
ESTRUTURA DO BANCO DE DADOS:

1. USUARIOS: Tabela principal que armazena todos os usuários do sistema
   - TipoUsuario: 1=Aluno, 2=Professor, 3=Admin
   - Email: Único no sistema para login
   - SenhaHash: Senha criptografada com BCrypt

2. ALUNOPERFIL: Informações específicas dos alunos
   - Relacionamento 1:1 com Usuarios
   - Matricula: Única no sistema

3. PROFESSORPERFIL: Informações específicas dos professores
   - Relacionamento 1:1 com Usuarios
   - Cursos e semestres que ministram

4. CATEGORIAS: Categorias dos chamados para classificação
   - Nome único para evitar duplicatas

5. CHAMADOS: Tabela principal dos chamados de suporte
   - IdUsuarioSolicitante: Quem abriu o chamado
   - IdUsuarioAtribuido: Técnico responsável (pode ser NULL)
   - Status: Aberto, Em Andamento, Resolvido, Fechado
   - Prioridade: Baixa, Média, Alta, Crítica

6. HISTORICOCHAMADO: Log de todas as ações nos chamados
   - Rastreabilidade completa das alterações
   - Quem fez o que e quando

RELACIONAMENTOS:
- Usuario 1:1 AlunoPerfil (opcional)
- Usuario 1:1 ProfessorPerfil (opcional)
- Usuario 1:N Chamados (como solicitante)
- Usuario 1:N Chamados (como atribuído)
- Categoria 1:N Chamados
- Chamado 1:N HistoricoChamado
- Usuario 1:N HistoricoChamado
*/

PRINT 'Banco de dados criado com sucesso!';
PRINT 'Tabelas criadas: Usuarios, AlunoPerfil, ProfessorPerfil, Categorias, Chamados, HistoricoChamado';
PRINT 'Índices criados para otimização de performance';
PRINT 'Categorias padrão inseridas';