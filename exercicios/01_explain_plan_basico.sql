-- =============================================================
-- EXERCICIO 1: Entendendo o Plano de Execucao
-- =============================================================
-- Objetivo: Aprender a ler e interpretar planos de execucao
-- =============================================================

-- Ative o output
-- NOTA: Comandos SET sao especificos do SQL*Plus/SQLcl.
-- Se usar outro cliente (DBeaver, SQL Developer), pode ignorar estes comandos.
SET SERVEROUTPUT ON;
SET LINESIZE 200;
SET PAGESIZE 100;

-- =============================================================
-- PARTE 1: EXPLAIN PLAN basico
-- =============================================================

-- Gera o plano de execucao (NAO executa a query, so estima)
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP';

-- Visualiza o plano
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- O que observar:
-- 1. TABLE ACCESS FULL = leu a tabela INTEIRA (sem indice util)
-- 2. Cost = custo estimado pelo otimizador (quanto MENOR, melhor)
-- 3. Rows = estimativa de linhas retornadas (~792K para SP)
-- 4. Bytes = estimativa de dados processados

-- =============================================================
-- PARTE 2: Comparando diferentes queries
-- =============================================================

-- Query 1: Busca por PK (tem indice automatico)
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE id = 12345;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: INDEX UNIQUE SCAN + TABLE ACCESS BY INDEX ROWID
-- Cost: ~3 (milhares de vezes menor que o FTS!)

-- Query 2: Busca por campo sem indice
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE email = 'teste@gmail.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: TABLE ACCESS FULL (varredura completa)
-- Cost: ~37000 (precisa ler a tabela inteira para achar 1 email)

-- COMPARE: PK (cost ~3) vs Email sem indice (cost ~37000)
-- Por que tanta diferenca? A PK tem indice criado automaticamente.
-- O email nao tem indice, entao o Oracle precisa ler TODOS os 9.5M registros.

-- =============================================================
-- PARTE 3: Estatisticas de execucao REAL
-- =============================================================

-- EXPLAIN PLAN so ESTIMA. Para ver o que REALMENTE aconteceu:

-- Habilita coleta de estatisticas reais
ALTER SESSION SET STATISTICS_LEVEL = ALL;

-- Executa a query (precisa executar de verdade)
SELECT * FROM clientes WHERE estado = 'SP' AND ROWNUM <= 10;

-- Ve estatisticas REAIS da ultima query executada
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));

-- O que observar aqui:
-- E-Rows = linhas ESTIMADAS pelo otimizador
-- A-Rows = linhas REAIS retornadas (o que aconteceu de verdade)
-- A-Time = tempo REAL de execucao
-- Buffers = blocos lidos da memoria (logical reads)
-- Reads = blocos lidos do disco (physical reads)
--
-- Se E-Rows for MUITO diferente de A-Rows, as estatisticas estao desatualizadas!
-- Solucao: EXEC DBMS_STATS.GATHER_TABLE_STATS(USER, 'CLIENTES');

-- =============================================================
-- EXERCICIO PRATICO
-- =============================================================

-- Execute estas queries e compare o CUSTO de cada uma:

-- Query A: Full Table Scan (estado sem indice util)
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE estado = 'SP';
SELECT plan_table_output FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: cost ~37000, rows ~792K

-- Query B: Index Unique Scan (PK)
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE id = 100;
SELECT plan_table_output FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: cost ~2, rows 1

-- Query C: LIKE com prefixo (poderia usar indice se existisse)
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE nome LIKE 'Maria%';
SELECT plan_table_output FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Query D: LIKE com curinga no inicio (NUNCA usa indice B-Tree)
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE nome LIKE '%Silva%';
SELECT plan_table_output FROM TABLE(DBMS_XPLAN.DISPLAY);

-- =============================================================
-- PERGUNTAS PARA REFLEXAO
-- =============================================================

-- 1. Por que Query B e milhares de vezes mais rapida que Query A?
--    R: Porque id tem indice (PK). O Oracle vai direto no registro.
--
-- 2. Por que Queries C e D tem custo parecido mesmo sendo LIKE diferentes?
--    R: Porque nenhuma tem indice no campo 'nome' ainda.
--    Mas se voce criar um indice em 'nome', Query C (LIKE 'Maria%')
--    PODERIA usar o indice, pois o prefixo e fixo.
--    Query D (LIKE '%Silva%') NUNCA usa indice B-Tree, pois o curinga
--    no inicio impede a busca ordenada na arvore.
--    (Voce vai testar isso no Exercicio 4 com function-based index)
