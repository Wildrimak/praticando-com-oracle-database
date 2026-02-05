-- =============================================================
-- EXERCICIO 1: Entendendo o Plano de Execucao
-- =============================================================
-- Objetivo: Aprender a ler e interpretar planos de execucao
-- =============================================================

-- Ative o output
SET SERVEROUTPUT ON;
SET LINESIZE 200;
SET PAGESIZE 100;

-- =============================================================
-- PARTE 1: EXPLAIN PLAN basico
-- =============================================================

-- Gera o plano de execucao (nao executa a query)
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP';

-- Visualiza o plano
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- O que observar:
-- 1. TABLE ACCESS FULL = leu a tabela INTEIRA (sem indice)
-- 2. Cost = custo estimado pelo otimizador
-- 3. Rows = estimativa de linhas retornadas
-- 4. Bytes = estimativa de dados processados

-- =============================================================
-- PARTE 2: Comparando diferentes queries
-- =============================================================

-- Query 1: Busca por PK (tem indice)
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE id = 12345;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: INDEX UNIQUE SCAN + TABLE ACCESS BY INDEX ROWID

-- Query 2: Busca por campo sem indice
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE email = 'teste@gmail.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: TABLE ACCESS FULL (varredura completa)

-- =============================================================
-- PARTE 3: Estatisticas de execucao real
-- =============================================================

-- Habilita estatisticas de execucao
ALTER SESSION SET STATISTICS_LEVEL = ALL;

-- Executa a query
SELECT * FROM clientes WHERE estado = 'SP' AND ROWNUM <= 10;

-- Ve estatisticas REAIS da ultima query executada
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));

-- O que observar aqui:
-- A-Rows = linhas REAIS retornadas
-- A-Time = tempo REAL de execucao
-- Buffers = blocos lidos da memoria/disco

-- =============================================================
-- EXERCICIO PRATICO
-- =============================================================

-- Execute estas queries e anote o CUSTO de cada uma:

-- Query A: Todos os clientes de SP
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE estado = 'SP';
SELECT plan_table_output FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Query B: Cliente especifico por ID
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE id = 100;
SELECT plan_table_output FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Query C: Clientes por nome (LIKE no inicio)
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE nome LIKE 'Maria%';
SELECT plan_table_output FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Query D: Clientes por nome (LIKE no meio)
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE nome LIKE '%Silva%';
SELECT plan_table_output FROM TABLE(DBMS_XPLAN.DISPLAY);

-- PERGUNTA: Por que Query B e muito mais rapida que Query A?
-- PERGUNTA: Por que Query D nao consegue usar indice mesmo que voce crie um?
