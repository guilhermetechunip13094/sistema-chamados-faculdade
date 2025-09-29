-- =============================================
-- SCRIPT DB
-- =============================================
USE master;
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
    TipoUsuario INT NOT NULL,
    DataCadastro DATETIME NOT NULL DEFAULT GETDATE(),
    Ativo BIT NOT NULL DEFAULT 1
);
GO

-- =============================================
-- 2. Tabela Status - CORRIGIDA
-- =============================================
CREATE TABLE Status (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(50) NOT NULL,
    Descricao NVARCHAR(255) NULL,
    DataCadastro DATETIME NOT NULL DEFAULT GETDATE(),
    Ativo BIT NOT NULL DEFAULT 1
);
GO

-- =============================================
-- 3. Tabela Prioridades - CORRIGIDA
-- =============================================
CREATE TABLE Prioridades (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(50) NOT NULL,
    Nivel INT NOT NULL,
    Descricao NVARCHAR(255) NULL,
    DataCadastro DATETIME NOT NULL DEFAULT GETDATE(),
    Ativo BIT NOT NULL DEFAULT 1
);
GO

-- =============================================
-- 4. Tabela Categorias - CORRIGIDA
-- =============================================
CREATE TABLE Categorias (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(100) NOT NULL UNIQUE,
    Descricao NVARCHAR(255) NULL,
    DataCadastro DATETIME NOT NULL DEFAULT GETDATE(),
    Ativo BIT NOT NULL DEFAULT 1
);
GO

-- =============================================
-- 5. Tabela Chamados
-- =============================================
CREATE TABLE Chamados (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Titulo NVARCHAR(200) NOT NULL,
    Descricao NVARCHAR(MAX) NOT NULL,
    DataAbertura DATETIME NOT NULL DEFAULT GETDATE(),
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
-- Dados Iniciais (Seed Data)
-- =============================================
INSERT INTO dbo.Status (Nome, Descricao) VALUES ('Aberto', 'Chamado recém criado e aguardando atribuição.');
INSERT INTO dbo.Prioridades (Nome, Nivel, Descricao) VALUES ('Baixa', 1, 'Resolver quando possível.');
INSERT INTO dbo.Categorias (Nome, Descricao) VALUES ('Hardware', 'Problemas com peças físicas do computador.');
GO

PRINT 'Banco de dados recriado e alinhado com o código C#!';