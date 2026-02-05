-- =============================================================
-- EXERCICIO 4: Tipos de Indices no Oracle
-- =============================================================
-- Objetivo: Conhecer diferentes tipos de indices e quando usar
-- =============================================================

SET TIMING ON;
SET LINESIZE 200;

-- =============================================================
-- TIPO 1: B-Tree Index (Padrao)
-- =============================================================
-- Melhor para: colunas com ALTA seletividade (muitos valores distintos)
-- Exemplo: email, cpf, id

CREATE INDEX idx_clientes_cpf ON clientes(cpf);

-- Funciona bem com: =, <, >, <=, >=, BETWEEN, LIKE 'abc%'
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE cpf = '123456789-01';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- =============================================================
-- TIPO 2: Bitmap Index
-- =============================================================
-- Melhor para: colunas com BAIXA seletividade (poucos valores distintos)
-- Exemplo: status, estado, sexo, sim/nao
-- CUIDADO: Pessimo para tabelas com muitos INSERTs/UPDATEs concorrentes!

CREATE BITMAP INDEX idx_clientes_status_bmp ON clientes(status);

-- Muito eficiente para combinacoes de filtros
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes
WHERE status = 'ATIVO'
  AND estado IN ('SP', 'RJ', 'MG');
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: BITMAP CONVERSION, BITMAP AND/OR

-- Para tabelas de LOG (somente INSERT), bitmap pode ser otimo
CREATE BITMAP INDEX idx_logs_acao_bmp ON logs_acesso(acao);

-- =============================================================
-- TIPO 3: Function-Based Index
-- =============================================================
-- Quando voce faz transformacoes na coluna no WHERE

-- Este indice NAO sera usado:
CREATE INDEX idx_clientes_nome ON clientes(nome);

EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE UPPER(nome) = 'MARIA SILVA';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: TABLE ACCESS FULL (funcao UPPER "quebra" o indice)

-- Solucao: indice na funcao
CREATE INDEX idx_clientes_nome_upper ON clientes(UPPER(nome));

EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE UPPER(nome) = 'MARIA SILVA';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Agora usa o indice!

-- Outro exemplo: busca por ano
CREATE INDEX idx_pedidos_ano ON pedidos(EXTRACT(YEAR FROM data_pedido));

EXPLAIN PLAN FOR
SELECT COUNT(*) FROM pedidos WHERE EXTRACT(YEAR FROM data_pedido) = 2024;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- =============================================================
-- TIPO 4: Indice Unico (UNIQUE)
-- =============================================================
-- Garante unicidade + performance

CREATE UNIQUE INDEX idx_clientes_email_unq ON clientes(email);
-- Erro se tentar inserir email duplicado

-- =============================================================
-- TIPO 5: Indice Reverso (Reverse Key)
-- =============================================================
-- Evita "hot blocks" quando inserindo sequencias (IDs)
-- Util em ambientes RAC ou alto volume de inserts

-- CREATE INDEX idx_logs_id_rev ON logs_acesso(id) REVERSE;

-- =============================================================
-- TIPO 6: Indice Parcial (com WHERE)
-- =============================================================
-- Indexa apenas parte dos dados - Oracle 12c+

-- So indexa clientes ativos (menor e mais rapido)
-- CREATE INDEX idx_clientes_ativos ON clientes(email) WHERE status = 'ATIVO';

-- =============================================================
-- TIPO 7: Indice Invisivel
-- =============================================================
-- Testa impacto sem afetar producao

CREATE INDEX idx_clientes_cidade ON clientes(cidade) INVISIBLE;

-- Optimizer nao ve o indice
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE cidade = 'Sao Paulo';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Torna visivel
ALTER INDEX idx_clientes_cidade VISIBLE;

EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE cidade = 'Sao Paulo';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- =============================================================
-- DIAGNOSTICO: Indices nao usados
-- =============================================================

-- Habilita monitoramento
ALTER INDEX idx_clientes_cpf MONITORING USAGE;

-- Apos um tempo, verifica se foi usado
SELECT index_name, monitoring, used
FROM v$object_usage
WHERE index_name = 'IDX_CLIENTES_CPF';

-- =============================================================
-- COMPARATIVO DE TAMANHOS
-- =============================================================

SELECT
    index_name,
    index_type,
    ROUND(bytes/1024/1024, 2) AS size_mb
FROM user_indexes ui
JOIN user_segments us ON us.segment_name = ui.index_name
WHERE ui.table_name = 'CLIENTES'
ORDER BY bytes DESC;

-- =============================================================
-- LIMPEZA
-- =============================================================

-- DROP INDEX idx_clientes_cpf;
-- DROP INDEX idx_clientes_status_bmp;
-- DROP INDEX idx_logs_acao_bmp;
-- DROP INDEX idx_clientes_nome;
-- DROP INDEX idx_clientes_nome_upper;
-- DROP INDEX idx_pedidos_ano;
-- DROP INDEX idx_clientes_email_unq;
-- DROP INDEX idx_clientes_cidade;
