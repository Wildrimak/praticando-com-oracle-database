-- =============================================================
-- EXERCICIO 5: Diagnostico de Performance
-- =============================================================
-- Objetivo: Identificar e resolver problemas de performance
-- Pre-requisito: Exercicios 1-4 concluidos (limpe os indices antes)
-- =============================================================

SET TIMING ON;
SET LINESIZE 200;
SET SERVEROUTPUT ON;
ALTER SESSION SET STATISTICS_LEVEL = ALL;

-- =============================================================
-- FERRAMENTA 1: AUTOTRACE
-- =============================================================
-- Mostra plano + estatisticas de execucao em um unico comando.
-- Requer role PLUSTRACE (ja concedido ao tuning_lab).

SET AUTOTRACE ON;

SELECT COUNT(*) FROM clientes WHERE estado = 'SP';

SET AUTOTRACE OFF;

-- O que observar:
-- - consistent gets = leituras logicas (da buffer cache/memoria)
-- - physical reads = leituras de disco
-- - sorts (memory/disk) = ordenacoes realizadas
--
-- REGRA: "consistent gets" e a metrica mais importante.
-- Quanto MENOS, melhor. Indices reduzem consistent gets drasticamente.

-- =============================================================
-- FERRAMENTA 2: DBMS_XPLAN.DISPLAY_CURSOR
-- =============================================================
-- Mostra o plano REAL (com estatisticas de execucao).
-- Mais detalhado que AUTOTRACE.

-- Executa a query
SELECT * FROM clientes WHERE estado = 'RJ' AND ROWNUM <= 5;

-- Ve estatisticas reais
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));

-- Colunas importantes:
-- E-Rows = linhas ESTIMADAS pelo otimizador
-- A-Rows = linhas REAIS retornadas
-- A-Time = tempo REAL de execucao
-- Buffers = leituras logicas (consistent gets)
-- Reads = leituras fisicas de disco

-- =============================================================
-- FERRAMENTA 3: Top SQLs por tempo de execucao
-- =============================================================
-- Com permissoes DBA, voce pode ver os SQLs mais lentos do sistema.

SELECT sql_id, executions,
       ROUND(elapsed_time/1000000, 2) AS elapsed_sec,
       SUBSTR(sql_text, 1, 80) AS sql_preview
FROM v$sql
WHERE parsing_schema_name = USER
ORDER BY elapsed_time DESC
FETCH FIRST 10 ROWS ONLY;

-- Isso mostra os SQLs que mais consumiram tempo.
-- sql_id pode ser usado para investigar o plano:
-- SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR('sql_id_aqui'));

-- =============================================================
-- PROBLEMA 1: Estimativas erradas (E-Rows <> A-Rows)
-- =============================================================

-- Se E-Rows for muito diferente de A-Rows, o otimizador
-- esta tomando decisoes erradas. Causa: estatisticas desatualizadas.

-- Solucao: recoleta estatisticas
BEGIN
    DBMS_STATS.GATHER_TABLE_STATS(USER, 'CLIENTES');
END;
/

-- Verifique quando as estatisticas foram coletadas:
SELECT table_name, num_rows, last_analyzed
FROM user_tables
WHERE table_name IN ('CLIENTES', 'PEDIDOS', 'ITENS_PEDIDO', 'LOGS_ACESSO');

-- =============================================================
-- PROBLEMA 2: Full Table Scan desnecessario
-- =============================================================

-- Sintoma: TABLE ACCESS FULL em tabela grande com filtro seletivo
EXPLAIN PLAN FOR
SELECT * FROM logs_acesso WHERE cliente_id = 12345;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- TABLE ACCESS FULL em milhoes de registros para buscar ~4 rows!

-- Causa: Falta de indice
CREATE INDEX idx_logs_cliente ON logs_acesso(cliente_id);

-- Verifica melhoria
EXPLAIN PLAN FOR
SELECT * FROM logs_acesso WHERE cliente_id = 12345;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Agora: INDEX RANGE SCAN (custo drasticamente menor)

-- =============================================================
-- PROBLEMA 3: Indice nao usado - causas comuns
-- =============================================================

-- 3.1 Funcao na coluna "quebra" o indice
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE UPPER(nome) = 'MARIA';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- TABLE ACCESS FULL! Solucao: CREATE INDEX ... ON clientes(UPPER(nome))

-- 3.2 Conversao implicita de tipo
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE cpf = 12345678901;
-- cpf e VARCHAR2, mas o valor e NUMBER!
-- Oracle converte: TO_NUMBER(cpf) = 12345678901
-- Isso "quebra" qualquer indice no cpf.
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Solucao: use o tipo correto: WHERE cpf = '123456789-01'

-- 3.3 IS NULL / IS NOT NULL
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE cidade IS NOT NULL;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- B-Tree nao indexa NULLs por padrao. IS NOT NULL retorna quase toda
-- a tabela, entao FTS e mais eficiente de qualquer forma.

-- 3.4 LIKE com % no inicio
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE nome LIKE '%Silva%';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- IMPOSSIVEL usar indice B-Tree com curinga no inicio.
-- Alternativas: Oracle Text (full-text search) ou function-based index

-- 3.5 Baixa seletividade (Oracle acha que FTS e mais rapido)
-- Quando uma query retorna >5-15% da tabela com SELECT *,
-- o otimizador corretamente escolhe FTS em vez do indice.
-- Isso NAO e um problema - e uma OTIMIZACAO do Oracle!

-- =============================================================
-- PROBLEMA 4: Muitos indices (overhead de escrita)
-- =============================================================

-- Cada INSERT/UPDATE/DELETE precisa atualizar TODOS os indices!
-- Quanto mais indices, mais lento o DML.

-- Ver todos indices da tabela
SELECT index_name, index_type, uniqueness, status
FROM user_indexes
WHERE table_name = 'CLIENTES';

-- Ver colunas de cada indice
SELECT index_name, column_name, column_position
FROM user_ind_columns
WHERE table_name = 'CLIENTES'
ORDER BY index_name, column_position;

-- Identifique indices redundantes:
-- - Indice em (A) e indice em (A, B) -> o indice em (A) pode ser removido
-- - Indices com total_access_count = 0 sao candidatos a remocao

-- =============================================================
-- PROBLEMA 5: Fragmentacao de indice
-- =============================================================

-- Apos muitos DELETEs/UPDATEs, o indice pode ficar fragmentado.
SELECT
    index_name,
    blevel,           -- niveis da arvore B (ideal: 1-3)
    leaf_blocks,      -- blocos folha
    distinct_keys,
    avg_leaf_blocks_per_key,
    avg_data_blocks_per_key
FROM user_indexes
WHERE table_name = 'CLIENTES';

-- Se blevel > 3 ou fragmentacao alta, reconstrua:
-- ALTER INDEX idx_clientes_email REBUILD;
-- Cuidado: REBUILD bloqueia a tabela. Use REBUILD ONLINE em producao.

-- =============================================================
-- DIAGNOSTICO GERAL
-- =============================================================

-- Tabelas sem estatisticas atualizadas
SELECT table_name, num_rows, last_analyzed
FROM user_tables
WHERE last_analyzed IS NULL
   OR last_analyzed < SYSDATE - 30;

-- Indices nao usados (candidatos a remocao)
SELECT name, total_access_count, last_used
FROM dba_index_usage
WHERE owner = USER AND total_access_count = 0;

-- =============================================================
-- CHECKLIST DE TUNING
-- =============================================================

-- 1.  [ ] Estatisticas atualizadas? (last_analyzed recente)
-- 2.  [ ] Indices nas colunas do WHERE com alta seletividade?
-- 3.  [ ] Indices nas colunas de JOIN (FKs)?
-- 4.  [ ] Funcoes no WHERE quebrando indices?
-- 5.  [ ] Conversao implicita de tipos?
-- 6.  [ ] LIKE com % no inicio?
-- 7.  [ ] Muitos indices impactando escrita?
-- 8.  [ ] Indice composto na ordem correta?
-- 9.  [ ] E-Rows proximo de A-Rows? (estatisticas precisas)
-- 10. [ ] Excesso de SORT no plano? (indice pode eliminar sort)

-- =============================================================
-- LIMPEZA
-- =============================================================

-- DROP INDEX idx_logs_cliente;
