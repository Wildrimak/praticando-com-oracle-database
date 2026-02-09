-- =============================================================
-- EXERCICIO 4: Tipos de Indices no Oracle
-- =============================================================
-- Objetivo: Conhecer diferentes tipos de indices e quando usar
-- Pre-requisito: Exercicios 1-3 concluidos
-- =============================================================

SET TIMING ON;
SET LINESIZE 200;

-- =============================================================
-- TIPO 1: B-Tree Index (Padrao)
-- =============================================================
-- Melhor para: colunas com ALTA seletividade (muitos valores distintos)
-- Exemplo: email, cpf, id
-- Operacoes suportadas: =, <, >, <=, >=, BETWEEN, LIKE 'abc%'

CREATE INDEX idx_clientes_cpf ON clientes(cpf);

EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE cpf = '123456789-01';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Resultado: INDEX RANGE SCAN (cpf tem alta seletividade)

-- =============================================================
-- TIPO 2: Bitmap Index
-- =============================================================
-- Melhor para: colunas com BAIXA seletividade (poucos valores distintos)
-- Exemplo: status (4 valores), estado (12 valores), sim/nao
-- CUIDADO: Pessimo para tabelas com muitos INSERTs/UPDATEs concorrentes!
-- Use apenas em tabelas predominantemente de leitura (data warehouse, logs)

CREATE BITMAP INDEX idx_clientes_status_bmp ON clientes(status);

-- Muito eficiente para COMBINACOES de filtros (AND/OR)
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes
WHERE status = 'ATIVO'
  AND estado IN ('SP', 'RJ', 'MG');
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: BITMAP CONVERSION, BITMAP AND/OR
-- O Oracle combina bitmaps de diferentes indices de forma muito eficiente

-- Para tabelas de LOG (somente INSERT, sem UPDATE), bitmap pode ser otimo
CREATE BITMAP INDEX idx_logs_acao_bmp ON logs_acesso(acao);

-- =============================================================
-- TIPO 3: Function-Based Index
-- =============================================================
-- Quando voce usa funcoes no WHERE, indices normais NAO funcionam.
-- O Oracle nao consegue fazer: UPPER('ana silva') -> posicao no indice.

-- Cria indice normal no nome
CREATE INDEX idx_clientes_nome ON clientes(nome);

-- Testa com funcao UPPER
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE UPPER(nome) = 'MARIA SILVA';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: TABLE ACCESS FULL!
-- A funcao UPPER() "quebra" o indice idx_clientes_nome.

-- Solucao: indice NA funcao
CREATE INDEX idx_clientes_nome_upper ON clientes(UPPER(nome));

EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE UPPER(nome) = 'MARIA SILVA';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Agora usa o indice! INDEX RANGE SCAN em idx_clientes_nome_upper

-- Outro exemplo: busca por ano (funcao EXTRACT)
CREATE INDEX idx_pedidos_ano ON pedidos(EXTRACT(YEAR FROM data_pedido));

EXPLAIN PLAN FOR
SELECT COUNT(*) FROM pedidos WHERE EXTRACT(YEAR FROM data_pedido) = 2024;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Usa o indice function-based em vez de varrer 46M registros

-- =============================================================
-- TIPO 4: Indice Unico (UNIQUE)
-- =============================================================
-- Garante unicidade + performance
-- INDEX UNIQUE SCAN em vez de INDEX RANGE SCAN (mais rapido)

CREATE UNIQUE INDEX idx_clientes_email_unq ON clientes(email);
-- Se tentar inserir um email duplicado, da erro.

EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE email = 'user1@email.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: INDEX UNIQUE SCAN (nao RANGE SCAN)

-- =============================================================
-- TIPO 5: Indice Reverso (Reverse Key)
-- =============================================================
-- Problema: IDs sequenciais (1, 2, 3, ...) causam "hot blocks" -
-- todos os INSERTs vao para o MESMO bloco folha do indice,
-- criando contencao em ambientes com muitas sessoes.
-- Solucao: Reverse Key inverte os bytes, distribuindo os inserts.

-- Util em:
-- - Ambientes RAC (multiplas instancias)
-- - Alto volume de inserts concorrentes
-- Desvantagem: Nao suporta range scan (BETWEEN, <, >)

CREATE INDEX idx_logs_id_rev ON logs_acesso(id) REVERSE;

-- =============================================================
-- TIPO 6: Indice Condicional (via Function-Based)
-- =============================================================
-- Oracle NAO suporta "CREATE INDEX ... WHERE condição" (isso é PostgreSQL).
-- Para indexar apenas um SUBCONJUNTO dos dados, use function-based index
-- com CASE para filtrar:

-- Exemplo: indexar APENAS clientes ativos (menor indice, mais rapido)
CREATE INDEX idx_clientes_ativos ON clientes(
    CASE WHEN status = 'ATIVO' THEN email ELSE NULL END
);
-- B-Tree nao indexa NULLs, entao so clientes ATIVOS entram no indice!

EXPLAIN PLAN FOR
SELECT * FROM clientes
WHERE CASE WHEN status = 'ATIVO' THEN email ELSE NULL END = 'user1@email.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Usa o indice parcial

-- NOTA: A query precisa usar a MESMA expressao CASE para acionar o indice.
-- Isso limita a usabilidade, mas e a forma Oracle-nativa de fazer indice parcial.

-- =============================================================
-- TIPO 7: Indice Invisivel
-- =============================================================
-- Permite testar um indice sem afetar os planos de execucao existentes.
-- O otimizador IGNORA indices invisiveis por padrao.
-- Util para testar impacto em producao sem risco.

CREATE INDEX idx_clientes_cidade ON clientes(cidade) INVISIBLE;

-- Otimizador nao ve o indice
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE cidade = 'Sao Paulo';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- TABLE ACCESS FULL (indice existe mas e invisivel)

-- Torna visivel quando estiver seguro
ALTER INDEX idx_clientes_cidade VISIBLE;

EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE cidade = 'Sao Paulo';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Agora o otimizador pode considerar o indice
-- (pode usar ou nao dependendo da seletividade de 'Sao Paulo')

-- =============================================================
-- MONITORAMENTO: Indices nao usados
-- =============================================================

-- No Oracle 23c, o monitoramento de uso de indices e AUTOMATICO.
-- Nao precisa mais de ALTER INDEX ... MONITORING USAGE.

-- Verifica se um indice foi usado (apos executar queries que o usem)
SELECT name, total_access_count, last_used
FROM dba_index_usage
WHERE owner = USER
AND name = 'IDX_CLIENTES_CPF';

-- Ver todos indices nao usados (candidatos a remocao)
SELECT name, total_access_count, last_used
FROM dba_index_usage
WHERE owner = USER
AND total_access_count = 0;

-- =============================================================
-- COMPARATIVO DE TAMANHOS
-- =============================================================

SELECT
    ui.index_name,
    ui.index_type,
    ROUND(us.bytes/1024/1024, 2) AS size_mb
FROM user_indexes ui
JOIN user_segments us ON us.segment_name = ui.index_name
WHERE ui.table_name = 'CLIENTES'
ORDER BY us.bytes DESC;

-- =============================================================
-- LIMPEZA (para refazer o exercicio)
-- =============================================================

-- DROP INDEX idx_clientes_cpf;
-- DROP INDEX idx_clientes_status_bmp;
-- DROP INDEX idx_logs_acao_bmp;
-- DROP INDEX idx_clientes_nome;
-- DROP INDEX idx_clientes_nome_upper;
-- DROP INDEX idx_pedidos_ano;
-- DROP INDEX idx_clientes_email_unq;
-- DROP INDEX idx_logs_id_rev;
-- DROP INDEX idx_clientes_ativos;
-- DROP INDEX idx_clientes_cidade;
