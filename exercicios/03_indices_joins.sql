-- =============================================================
-- EXERCICIO 3: Indices em JOINs
-- =============================================================
-- Objetivo: Entender como indices afetam operacoes de JOIN
-- =============================================================

SET TIMING ON;
SET LINESIZE 200;

-- =============================================================
-- CENARIO 1: JOIN sem indice na FK
-- =============================================================

-- Query simples com JOIN
EXPLAIN PLAN FOR
SELECT c.nome, p.data_pedido, p.valor_total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE c.id = 12345;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- O que observar:
-- - cliente: INDEX UNIQUE SCAN (PK)
-- - pedidos: TABLE ACCESS FULL (sem indice na FK cliente_id)

-- Cria indice na FK
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);

-- Ve o plano agora
EXPLAIN PLAN FOR
SELECT c.nome, p.data_pedido, p.valor_total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE c.id = 12345;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Agora deve usar: INDEX RANGE SCAN no idx_pedidos_cliente

-- =============================================================
-- CENARIO 2: JOIN com filtro em tabela relacionada
-- =============================================================

-- Buscar clientes que fizeram pedidos em 2024
EXPLAIN PLAN FOR
SELECT DISTINCT c.nome, c.email
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE p.data_pedido >= DATE '2024-01-01'
  AND p.data_pedido < DATE '2025-01-01';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Indice na data do pedido
CREATE INDEX idx_pedidos_data ON pedidos(data_pedido);

-- Ve o plano
EXPLAIN PLAN FOR
SELECT DISTINCT c.nome, c.email
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE p.data_pedido >= DATE '2024-01-01'
  AND p.data_pedido < DATE '2025-01-01';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- =============================================================
-- CENARIO 3: JOIN triplo (3 tabelas)
-- =============================================================

-- Detalhes de um pedido com itens
EXPLAIN PLAN FOR
SELECT c.nome, p.data_pedido, i.produto, i.quantidade, i.valor_unit
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
JOIN itens_pedido i ON i.pedido_id = p.id
WHERE p.id = 50000;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Indice na FK de itens
CREATE INDEX idx_itens_pedido ON itens_pedido(pedido_id);

-- Ve o plano
EXPLAIN PLAN FOR
SELECT c.nome, p.data_pedido, i.produto, i.quantidade, i.valor_unit
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
JOIN itens_pedido i ON i.pedido_id = p.id
WHERE p.id = 50000;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- =============================================================
-- CENARIO 4: Tipos de JOIN no Oracle
-- =============================================================

-- O Oracle escolhe automaticamente entre:
-- 1. NESTED LOOPS - bom para poucos registros, precisa de indice
-- 2. HASH JOIN - bom para muitos registros, nao precisa de indice
-- 3. MERGE JOIN - bom quando dados ja estao ordenados

-- Forca NESTED LOOPS (para comparar)
EXPLAIN PLAN FOR
SELECT /*+ USE_NL(p) */ c.nome, p.valor_total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE c.estado = 'SP';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Forca HASH JOIN
EXPLAIN PLAN FOR
SELECT /*+ USE_HASH(p) */ c.nome, p.valor_total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE c.estado = 'SP';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Compare os custos!

-- =============================================================
-- CENARIO 5: Subquery vs JOIN
-- =============================================================

-- Forma 1: Subquery correlacionada
EXPLAIN PLAN FOR
SELECT c.nome,
       (SELECT COUNT(*) FROM pedidos p WHERE p.cliente_id = c.id) AS total_pedidos
FROM clientes c
WHERE c.estado = 'MG';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Forma 2: LEFT JOIN com agregacao
EXPLAIN PLAN FOR
SELECT c.nome, COUNT(p.id) AS total_pedidos
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id
WHERE c.estado = 'MG'
GROUP BY c.id, c.nome;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Qual e mais eficiente? Depende dos indices e volume de dados!

-- =============================================================
-- INDICES EXISTENTES
-- =============================================================

SELECT table_name, index_name, column_name
FROM user_ind_columns
WHERE table_name IN ('CLIENTES', 'PEDIDOS', 'ITENS_PEDIDO')
ORDER BY table_name, index_name, column_position;
