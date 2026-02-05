-- =============================================================
-- ORACLE TUNING LAB - Criacao das Tabelas
-- =============================================================
-- Este script cria as tabelas para estudo de indices no Oracle
-- Executado automaticamente na inicializacao do container
-- =============================================================

-- Conecta ao PDB
ALTER SESSION SET CONTAINER = FREEPDB1;

-- Tabela de Clientes (cenario principal)
CREATE TABLE clientes (
    id            NUMBER PRIMARY KEY,
    nome          VARCHAR2(255),
    email         VARCHAR2(255),
    cpf           VARCHAR2(14),
    estado        CHAR(2),
    cidade        VARCHAR2(100),
    data_cadastro DATE,
    status        VARCHAR2(20),
    valor_limite  NUMBER(10,2)
);

-- Tabela de Pedidos (para JOINs)
CREATE TABLE pedidos (
    id            NUMBER PRIMARY KEY,
    cliente_id    NUMBER,
    data_pedido   DATE,
    valor_total   NUMBER(10,2),
    status        VARCHAR2(20),
    CONSTRAINT fk_pedido_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Tabela de Itens do Pedido
CREATE TABLE itens_pedido (
    id            NUMBER PRIMARY KEY,
    pedido_id     NUMBER,
    produto       VARCHAR2(200),
    quantidade    NUMBER,
    valor_unit    NUMBER(10,2),
    CONSTRAINT fk_item_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
);

-- Tabela de Logs (para estudar indices em tabelas muito grandes)
CREATE TABLE logs_acesso (
    id            NUMBER PRIMARY KEY,
    cliente_id    NUMBER,
    data_acesso   TIMESTAMP,
    ip_address    VARCHAR2(45),
    acao          VARCHAR2(50),
    detalhes      VARCHAR2(500)
);

-- Cria sinonimos publicos para acesso facil
CREATE PUBLIC SYNONYM clientes FOR clientes;
CREATE PUBLIC SYNONYM pedidos FOR pedidos;
CREATE PUBLIC SYNONYM itens_pedido FOR itens_pedido;
CREATE PUBLIC SYNONYM logs_acesso FOR logs_acesso;

-- Concede permissoes ao usuario tuning_lab
GRANT ALL ON clientes TO tuning_lab;
GRANT ALL ON pedidos TO tuning_lab;
GRANT ALL ON itens_pedido TO tuning_lab;
GRANT ALL ON logs_acesso TO tuning_lab;

-- Permissoes adicionais para o usuario trabalhar com indices e estatisticas
GRANT CREATE ANY INDEX TO tuning_lab;
GRANT DROP ANY INDEX TO tuning_lab;
GRANT ANALYZE ANY TO tuning_lab;
