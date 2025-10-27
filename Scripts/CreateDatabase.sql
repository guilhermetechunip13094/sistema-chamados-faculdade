-- =================================================================
-- Script de Criação do Banco de Dados
-- Sistema de Chamados - PIM
-- =================================================================

-- Apaga o banco antigo para garantir um recomeço limpo
USE master;
GO
DROP DATABASE IF EXISTS SistemaChamados;
GO
CREATE DATABASE SistemaChamados;
GO
USE SistemaChamados;
GO

-- =============================================
-- 1. Tabela Usuarios
-- =============================================
CREATE TABLE Usuarios (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    NomeCompleto NVARCHAR(150) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    SenhaHash NVARCHAR(255) NOT NULL,
    TipoUsuario INT NOT NULL, -- 1: Usuário Comum, 3: Técnico/Admin
    DataCadastro DATETIME NOT NULL DEFAULT GETDATE(),
    Ativo BIT NOT NULL DEFAULT 1,
    PasswordResetToken NVARCHAR(255) NULL,
    ResetTokenExpires DATETIME NULL,
    EspecialidadeCategoriaId INT NULL
);
GO

-- =============================================
-- 2. Tabela Status, Prioridades, Categorias
-- =============================================
CREATE TABLE Status (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(50) NOT NULL,
    Descricao NVARCHAR(255) NULL,
    DataCadastro DATETIME NOT NULL DEFAULT GETDATE(),
    Ativo BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE Prioridades (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(50) NOT NULL,
    Nivel INT NOT NULL,
    Descricao NVARCHAR(255) NULL,
    DataCadastro DATETIME NOT NULL DEFAULT GETDATE(),
    Ativo BIT NOT NULL DEFAULT 1
);
GO

CREATE TABLE Categorias (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(100) NOT NULL UNIQUE,
    Descricao NVARCHAR(255) NULL,
    DataCadastro DATETIME NOT NULL DEFAULT GETDATE(),
    Ativo BIT NOT NULL DEFAULT 1
);
GO

-- Adicionando a chave estrangeira de Especialidade em Usuarios
ALTER TABLE dbo.Usuarios
ADD CONSTRAINT FK_Usuarios_Categorias_Especialidade 
FOREIGN KEY (EspecialidadeCategoriaId) REFERENCES Categorias(Id);
GO

-- =============================================
-- 3. Tabela Chamados
-- =============================================
CREATE TABLE Chamados (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Titulo NVARCHAR(200) NOT NULL,
    Descricao NVARCHAR(MAX) NOT NULL,
    DataAbertura DATETIME NOT NULL DEFAULT GETDATE(),
    DataUltimaAtualizacao DATETIME NULL,
    DataFechamento DATETIME NULL,
    SolicitanteId INT NOT NULL,
    TecnicoId INT NULL,
    StatusId INT NOT NULL,
    PrioridadeId INT NOT NULL,
    CategoriaId INT NOT NULL,
    CONSTRAINT FK_Chamados_Usuario_Solicitante FOREIGN KEY (SolicitanteId) REFERENCES Usuarios(Id),
    CONSTRAINT FK_Chamados_Usuario_Tecnico FOREIGN KEY (TecnicoId) REFERENCES Usuarios(Id),
    CONSTRAINT FK_Chamados_Status FOREIGN KEY (StatusId) REFERENCES Status(Id),
    CONSTRAINT FK_Chamados_Prioridades FOREIGN KEY (PrioridadeId) REFERENCES Prioridades(Id),
    CONSTRAINT FK_Chamados_Categorias FOREIGN KEY (CategoriaId) REFERENCES Categorias(Id)
);
GO

-- =============================================
-- 4. Dados Iniciais (Seed Data)
-- =============================================
INSERT INTO dbo.Status (Nome, Descricao) VALUES 
('Aberto', 'Chamado recém criado e aguardando atribuição.'),
('Em Andamento', 'Um técnico já está trabalhando no chamado.'),
('Aguardando Resposta', 'Aguardando mais informações do usuário.'),
('Fechado', 'O chamado foi resolvido.');
GO

INSERT INTO dbo.Prioridades (Nome, Nivel, Descricao) VALUES 
('Baixa', 1, 'Resolver quando possível.'),
('Média', 2, 'Prioridade normal.'),
('Alta', 3, 'Resolver com urgência.');
GO

INSERT INTO dbo.Categorias (Nome, Descricao) VALUES 
('Hardware', 'Problemas com peças físicas do computador.'),
('Software', 'Problemas com programas e sistemas.'),
('Rede', 'Problemas de conexão com a internet ou rede interna.'),
('Acesso/Login', 'Problemas de senha ou acesso a sistemas.');
GO

-- Inserindo os dois técnicos padrão para testes
-- A senha para ambos é 'senha123'
INSERT INTO dbo.Usuarios 
    (NomeCompleto, Email, SenhaHash, TipoUsuario, EspecialidadeCategoriaId, Ativo)
VALUES 
    ('Tecnico Hardware Teste', 'tecnico.hardware@helpdesk.com', '$2a$10$Cyr83Y21c1sH5.2.t3D5Ku1f.0C5M3u7g.x5j.s5g.k5f.h7j.x5j', 3, 1, 1), -- Especialidade: Hardware (ID 1)
    ('Tecnico Software Teste', 'tecnico.software@helpdesk.com', '$2a$10$Cyr83Y21c1sH5.2.t3D5Ku1f.0C5M3u7g.x5j.s5g.k5f.h7j.x5j', 3, 2, 1); -- Especialidade: Software (ID 2)
GO

PRINT 'Banco de dados para o sistema de chamados criado com sucesso!.';