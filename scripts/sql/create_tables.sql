-- =============================================================
-- ORACLE TUNING LAB - Criacao das Tabelas
-- =============================================================
-- Roda como TUNING_LAB. As tabelas ficam no schema do usuario,
-- garantindo que user_indexes, user_tables, etc. funcionem.
-- =============================================================

SET SERVEROUTPUT ON

-- Tabela de Clientes (cenario principal de estudo)
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

-- Tabela de Logs (para estudar tabelas muito grandes)
CREATE TABLE logs_acesso (
    id            NUMBER PRIMARY KEY,
    cliente_id    NUMBER,
    data_acesso   TIMESTAMP,
    ip_address    VARCHAR2(45),
    acao          VARCHAR2(50),
    detalhes      VARCHAR2(500)
);

BEGIN
    DBMS_OUTPUT.PUT_LINE('Tabelas criadas com sucesso no schema TUNING_LAB!');
END;
/
