-- =============================================================
-- EXERCICIO 5: Diagnostico de Performance
-- =============================================================
-- Objetivo: Identificar e resolver problemas de performance
-- =============================================================

SET TIMING ON;
SET LINESIZE 200;
SET SERVEROUTPUT ON;
ALTER SESSION SET STATISTICS_LEVEL = ALL;

-- =============================================================
-- FERRAMENTA 1: AUTOTRACE
-- =============================================================

-- Habilita autotrace (mostra plano + estatisticas)
SET AUTOTRACE ON;

SELECT COUNT(*) FROM clientes WHERE estado = 'SP';

SET AUTOTRACE OFF;

-- O que observar:
-- - consistent gets = leituras logicas (memoria)
-- - physical reads = leituras de disco
-- - sorts (memory/disk) = ordenacoes

-- =============================================================
-- FERRAMENTA 2: DBMS_XPLAN.DISPLAY_CURSOR
-- =============================================================

-- Executa a query
SELECT * FROM clientes WHERE estado = 'RJ' AND ROWNUM <= 5;

-- Ve estatisticas reais
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));

-- Colunas importantes:
-- E-Rows = linhas estimadas
-- A-Rows = linhas reais
-- A-Time = tempo real
-- Buffers = blocos lidos
-- Reads = leituras de disco

-- =============================================================
-- PROBLEMA 1: Estimativas erradas
-- =============================================================

-- Se E-Rows e muito diferente de A-Rows, estatisticas desatualizadas!
-- Solucao:
BEGIN
    DBMS_STATS.GATHER_TABLE_STATS(USER, 'CLIENTES');
END;
/

-- =============================================================
-- PROBLEMA 2: Full Table Scan desnecessario
-- =============================================================

-- Sintoma: TABLE ACCESS FULL em tabela grande com filtro seletivo
EXPLAIN PLAN FOR
SELECT * FROM logs_acesso WHERE cliente_id = 12345;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Causa: Falta de indice
CREATE INDEX idx_logs_cliente ON logs_acesso(cliente_id);

-- Verifica melhoria
EXPLAIN PLAN FOR
SELECT * FROM logs_acesso WHERE cliente_id = 12345;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- =============================================================
-- PROBLEMA 3: Indice nao usado
-- =============================================================

-- Motivos comuns:

-- 3.1 Funcao na coluna
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE UPPER(nome) = 'MARIA';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Solucao: CREATE INDEX ... ON clientes(UPPER(nome))

-- 3.2 Conversao implicita de tipo
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE cpf = 12345678901; -- numero, coluna e VARCHAR
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Solucao: usar tipo correto: WHERE cpf = '123456789-01'

-- 3.3 IS NULL ou IS NOT NULL
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE cidade IS NOT NULL;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- B-Tree nao indexa NULLs por padrao

-- 3.4 LIKE com % no inicio
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE nome LIKE '%Silva%';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Nao tem como usar indice B-Tree

-- 3.5 Baixa seletividade (Oracle acha que FTS e mais rapido)
-- Quando uma query retorna >5-15% da tabela, FTS pode ser melhor

-- =============================================================
-- PROBLEMA 4: Muitos indices (overhead de escrita)
-- =============================================================

-- Ver todos indices da tabela
SELECT index_name, index_type, uniqueness, status
FROM user_indexes
WHERE table_name = 'CLIENTES';

-- Ver colunas de cada indice
SELECT index_name, column_name, column_position
FROM user_ind_columns
WHERE table_name = 'CLIENTES'
ORDER BY index_name, column_position;

-- Cada INSERT/UPDATE precisa atualizar TODOS os indices!
-- Remova indices nao utilizados

-- =============================================================
-- PROBLEMA 5: Fragmentacao de indice
-- =============================================================

-- Analisa fragmentacao
SELECT
    index_name,
    blevel,           -- niveis da arvore B
    leaf_blocks,      -- blocos folha
    distinct_keys,
    avg_leaf_blocks_per_key,
    avg_data_blocks_per_key
FROM user_indexes
WHERE table_name = 'CLIENTES';

-- Se blevel > 3 ou muita fragmentacao, reconstrua:
-- ALTER INDEX idx_clientes_email REBUILD;

-- =============================================================
-- QUERIES PARA IDENTIFICAR PROBLEMAS
-- =============================================================

-- Top SQLs por tempo de execucao (precisa de privilegios)
/*
SELECT sql_id, executions, elapsed_time/1000000 AS elapsed_sec,
       SUBSTR(sql_text, 1, 100) AS sql_preview
FROM v$sql
WHERE parsing_schema_name = USER
ORDER BY elapsed_time DESC
FETCH FIRST 10 ROWS ONLY;
*/

-- Tabelas sem estatisticas
SELECT table_name, last_analyzed
FROM user_tables
WHERE last_analyzed IS NULL
   OR last_analyzed < SYSDATE - 30;

-- Indices nao usados (se monitoramento habilitado)
SELECT * FROM v$object_usage WHERE used = 'NO';

-- =============================================================
-- CHECKLIST DE TUNING
-- =============================================================

/*
1. [ ] Estatisticas atualizadas?
2. [ ] Indices nas colunas do WHERE?
3. [ ] Indices nas colunas de JOIN (FKs)?
4. [ ] Funcoes no WHERE quebrando indices?
5. [ ] Conversao implicita de tipos?
6. [ ] LIKE com % no inicio?
7. [ ] Muitos indices impactando escrita?
8. [ ] Indice composto na ordem correta?
9. [ ] E-Rows proximo de A-Rows?
10.[ ] Excesso de SORT no plano?
*/
