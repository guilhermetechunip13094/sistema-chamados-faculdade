-- =============================================
-- Script de Criação do Banco de Dados
-- Sistema de Chamados - PIM
-- SQL Server
-- =============================================

-- Descomente as 3 linhas abaixo se precisar criar o banco do zero
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
    TipoUsuario INT NOT NULL, -- Ex: 1 para Colaborador, 3 para Admin/Técnico
    DataCadastro DATETIME NOT NULL DEFAULT GETDATE(),
    Ativo BIT NOT NULL DEFAULT 1
);
GO

-- =============================================
-- 2. Tabela Status
-- =============================================
CREATE TABLE Status (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(50) NOT NULL
);
GO

-- =============================================
-- 3. Tabela Prioridades
-- =============================================
CREATE TABLE Prioridades (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(50) NOT NULL,
    Nivel INT NOT NULL
);
GO

-- =============================================
-- 4. Tabela Categorias
-- =============================================
CREATE TABLE Categorias (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Nome NVARCHAR(100) NOT NULL UNIQUE
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
    
    -- Chaves Estrangeiras
    SolicitanteId INT NOT NULL,
    TecnicoId INT NULL, -- Pode ser nulo até um técnico assumir
    StatusId INT NOT NULL,
    PrioridadeId INT NOT NULL,
    CategoriaId INT NOT NULL,

    -- Constraints (Regras de Relacionamento)
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
-- Limpa as tabelas, reseta os IDs e insere os dados iniciais
-- para garantir um banco de dados limpo e previsível.

-- 1. Limpa as tabelas
DELETE FROM dbo.Status;
DELETE FROM dbo.Prioridades;
DELETE FROM dbo.Categorias;
GO

-- 2. Reseta o contador de ID de cada tabela
DBCC CHECKIDENT ('[dbo].[Status]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[Prioridades]', RESEED, 0);
DBCC CHECKIDENT ('[dbo].[Categorias]', RESEED, 0);
GO

-- 3. Insere os dados novamente, com IDs começando em 1
INSERT INTO dbo.Status (Nome) VALUES ('Aberto'), ('Em Andamento'), ('Aguardando Resposta'), ('Fechado');
GO

INSERT INTO dbo.Prioridades (Nome, Nivel) VALUES ('Baixa', 1), ('Média', 2), ('Alta', 3);
GO

INSERT INTO dbo.Categorias (Nome) VALUES ('Hardware'), ('Software'), ('Rede'), ('Acesso/Login');
GO

PRINT 'Banco de dados e tabelas configurados com sucesso!';
PRINT 'Dados iniciais inseridos.';