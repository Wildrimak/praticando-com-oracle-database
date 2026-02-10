-- =============================================================
-- EXERCICIO 3: Indices em JOINs
-- =============================================================
-- Objetivo: Entender como indices afetam operacoes de JOIN
-- Pre-requisito: Exercicios 1 e 2 concluidos
-- =============================================================

SET TIMING ON;
SET LINESIZE 200;

-- =============================================================
-- VOLUME DE DADOS (verifique antes de comecar)
-- =============================================================
-- Os dados crescem em background via DBMS_SCHEDULER.

SELECT table_name, num_rows, TO_CHAR(last_analyzed, 'DD/MM HH24:MI') AS stats_date
FROM user_tables
WHERE table_name IN ('CLIENTES', 'PEDIDOS', 'ITENS_PEDIDO', 'LOGS_ACESSO')
ORDER BY table_name;

-- =============================================================
-- CENARIO 1: JOIN sem indice na FK
-- =============================================================

-- Query simples: buscar pedidos de um cliente
EXPLAIN PLAN FOR
SELECT c.nome, p.data_pedido, p.valor_total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE c.id = 12345;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- O que observar:
-- - clientes: INDEX UNIQUE SCAN (PK do id) --> rapido
-- - pedidos: TABLE ACCESS FULL (sem indice em cliente_id) --> LENTO!
--   Oracle precisa ler TODOS os pedidos para achar os do cliente 12345

-- Cria indice na FK
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);

-- Ve o plano agora
EXPLAIN PLAN FOR
SELECT c.nome, p.data_pedido, p.valor_total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE c.id = 12345;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Agora: INDEX RANGE SCAN no idx_pedidos_cliente
-- Reducao dramatica no custo. ENORME diferenca.
-- REGRA: Sempre crie indices nas colunas de FK!

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

-- Indice na data do pedido para filtrar antes do JOIN
CREATE INDEX idx_pedidos_data ON pedidos(data_pedido);

-- Ve o plano
EXPLAIN PLAN FOR
SELECT DISTINCT c.nome, c.email
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE p.data_pedido >= DATE '2024-01-01'
  AND p.data_pedido < DATE '2025-01-01';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- NOTA: Os pedidos cobrem ~730 dias (2 anos).
-- 1 ano = ~50% da tabela. O otimizador pode decidir
-- que FTS e melhor para um range tao grande.
-- Para ranges menores (ex: 1 mes), o indice faz mais diferenca.

-- =============================================================
-- CENARIO 3: JOIN triplo (3 tabelas)
-- =============================================================

-- Detalhes de um pedido especifico com seus itens
EXPLAIN PLAN FOR
SELECT c.nome, p.data_pedido, i.produto, i.quantidade, i.valor_unit
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
JOIN itens_pedido i ON i.pedido_id = p.id
WHERE p.id = 50000;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Sem indice em itens_pedido.pedido_id, o Oracle faz FTS na tabela
-- de itens (que pode ter milhoes de registros!)

-- Cria indice na FK de itens
CREATE INDEX idx_itens_pedido ON itens_pedido(pedido_id);

-- Ve o plano
EXPLAIN PLAN FOR
SELECT c.nome, p.data_pedido, i.produto, i.quantidade, i.valor_unit
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
JOIN itens_pedido i ON i.pedido_id = p.id
WHERE p.id = 50000;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Com indices nas FKs, o JOIN triplo fica eficiente:
-- pedidos: INDEX UNIQUE SCAN (PK)
-- clientes: INDEX UNIQUE SCAN (PK via FK)
-- itens: INDEX RANGE SCAN (idx_itens_pedido)

-- =============================================================
-- CENARIO 4: Tipos de JOIN no Oracle
-- =============================================================

-- O Oracle escolhe automaticamente o algoritmo de JOIN:
-- 1. NESTED LOOPS - bom para POUCOS registros, precisa de indice
-- 2. HASH JOIN - bom para MUITOS registros, nao precisa de indice
-- 3. MERGE JOIN - bom quando dados ja estao ordenados

-- Forca NESTED LOOPS (para comparar)
EXPLAIN PLAN FOR
SELECT /*+ USE_NL(p) */ c.nome, p.valor_total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE c.estado = 'SP';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- NESTED LOOPS: para CADA cliente de SP (~8.3%), busca seus pedidos no indice.
-- Com muitos clientes x ~4-5 pedidos cada = muitas iteracoes. Lento!

-- Forca HASH JOIN
EXPLAIN PLAN FOR
SELECT /*+ USE_HASH(p) */ c.nome, p.valor_total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE c.estado = 'SP';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- HASH JOIN: cria hash table de clientes SP, depois varre pedidos.
-- Muito mais eficiente para grandes volumes!

-- Compare os custos: HASH JOIN geralmente ganha quando
-- ambas as tabelas retornam muitos registros.

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

-- Qual e mais eficiente? Compare os custos!
-- Com indice em pedidos(cliente_id), a subquery correlacionada
-- pode ser eficiente (usa o indice para cada cliente).
-- Sem indice, o LEFT JOIN com HASH tende a ser melhor.
-- Depende dos indices e volume de dados!

-- =============================================================
-- INDICES EXISTENTES
-- =============================================================

SELECT table_name, index_name, column_name
FROM user_ind_columns
WHERE table_name IN ('CLIENTES', 'PEDIDOS', 'ITENS_PEDIDO')
ORDER BY table_name, index_name, column_position;

-- =============================================================
-- LIMPEZA (para refazer o exercicio)
-- =============================================================

-- DROP INDEX idx_pedidos_cliente;
-- DROP INDEX idx_pedidos_data;
-- DROP INDEX idx_itens_pedido;
