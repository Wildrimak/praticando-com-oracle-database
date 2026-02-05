-- =============================================================
-- EXERCICIO 2: Criando e Analisando Indices
-- =============================================================
-- Objetivo: Entender quando e como criar indices
-- =============================================================

SET TIMING ON;
SET SERVEROUTPUT ON;
SET LINESIZE 200;

-- =============================================================
-- CENARIO 1: Indice Simples (B-Tree)
-- =============================================================

-- ANTES: Veja o plano sem indice
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Resultado esperado: TABLE ACCESS FULL

-- Execute e veja o tempo
SELECT COUNT(*) FROM clientes WHERE estado = 'SP';
-- Anote o tempo: _______ segundos

-- Cria o indice
CREATE INDEX idx_clientes_estado ON clientes(estado);

-- DEPOIS: Veja o plano com indice
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Execute novamente
SELECT COUNT(*) FROM clientes WHERE estado = 'SP';
-- Anote o tempo: _______ segundos

-- PERGUNTA: O indice melhorou? Por que pode nao ter melhorado tanto?
-- DICA: Quantos % dos clientes sao de SP? (baixa seletividade)

-- =============================================================
-- CENARIO 2: Indice com Alta Seletividade
-- =============================================================

-- Email e unico, entao tem ALTA seletividade
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE email = 'ana.silva1@gmail.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Cria indice no email
CREATE INDEX idx_clientes_email ON clientes(email);

-- Agora ve o plano
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE email = 'ana.silva1@gmail.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Resultado esperado: INDEX RANGE SCAN

-- =============================================================
-- CENARIO 3: Indice Composto
-- =============================================================

-- Query com dois filtros
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP' AND status = 'ATIVO';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Indice composto
CREATE INDEX idx_clientes_estado_status ON clientes(estado, status);

-- Ve o plano agora
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP' AND status = 'ATIVO';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- IMPORTANTE: A ordem das colunas no indice importa!
-- Este indice funciona bem para:
--   WHERE estado = 'SP' AND status = 'ATIVO'  (usa indice)
--   WHERE estado = 'SP'                        (usa indice)
-- Mas NAO funciona bem para:
--   WHERE status = 'ATIVO'                     (nao usa indice!)

-- Teste voce mesmo:
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE status = 'ATIVO';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: TABLE ACCESS FULL (indice nao usado!)

-- =============================================================
-- CENARIO 4: Indice para ORDER BY
-- =============================================================

-- Query com ordenacao
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'RJ' ORDER BY data_cadastro;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: Tem um SORT ORDER BY (caro!)

-- Indice que cobre filtro + ordenacao
CREATE INDEX idx_clientes_estado_data ON clientes(estado, data_cadastro);

EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'RJ' ORDER BY data_cadastro;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Se o otimizador escolher, pode eliminar o SORT

-- =============================================================
-- CENARIO 5: Covering Index (Index-Only Scan)
-- =============================================================

-- Query que so precisa de algumas colunas
EXPLAIN PLAN FOR
SELECT estado, COUNT(*) FROM clientes GROUP BY estado;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Se o indice contem TODAS as colunas da query,
-- o Oracle nao precisa ir na tabela!
-- (idx_clientes_estado ja existe e contem a coluna estado)

-- Ve se fez INDEX FAST FULL SCAN (le so o indice)

-- =============================================================
-- VISUALIZAR INDICES EXISTENTES
-- =============================================================

SELECT index_name, column_name, column_position
FROM user_ind_columns
WHERE table_name = 'CLIENTES'
ORDER BY index_name, column_position;

-- Ver tamanho dos indices
SELECT segment_name, bytes/1024/1024 AS size_mb
FROM user_segments
WHERE segment_type = 'INDEX'
ORDER BY bytes DESC;

-- =============================================================
-- LIMPEZA (para refazer o exercicio)
-- =============================================================

-- DROP INDEX idx_clientes_estado;
-- DROP INDEX idx_clientes_email;
-- DROP INDEX idx_clientes_estado_status;
-- DROP INDEX idx_clientes_estado_data;
