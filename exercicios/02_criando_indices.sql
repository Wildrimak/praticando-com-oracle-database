-- =============================================================
-- EXERCICIO 2: Criando e Analisando Indices
-- =============================================================
-- Objetivo: Entender quando e como criar indices
-- Pre-requisito: Exercicio 1 concluido
-- =============================================================

SET TIMING ON;
SET SERVEROUTPUT ON;
SET LINESIZE 200;

-- =============================================================
-- VOLUME DE DADOS (verifique antes de comecar)
-- =============================================================
-- Os dados crescem em background via DBMS_SCHEDULER.
-- Os exercicios usam PERCENTUAIS e raciocinio relativo,
-- entao funcionam com qualquer volume.

SELECT table_name, num_rows, TO_CHAR(last_analyzed, 'DD/MM HH24:MI') AS stats_date
FROM user_tables
WHERE table_name IN ('CLIENTES', 'PEDIDOS', 'ITENS_PEDIDO', 'LOGS_ACESSO')
ORDER BY table_name;

-- =============================================================
-- CENARIO 1: Indice em coluna com BAIXA seletividade
-- =============================================================
-- estado tem apenas 12 valores distintos.
-- Cada estado tem ~8.3% da tabela (1/12 dos registros).

-- ANTES: Veja o plano sem indice
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Resultado esperado: TABLE ACCESS FULL (cost alto)

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

-- SURPRESA! O Oracle provavelmente IGNORA o indice e continua com TABLE ACCESS FULL!
-- Por que? Para SELECT *, retornar ~8.3% da tabela via indice
-- seria MAIS CARO do que ler a tabela sequencialmente, porque:
-- 1. Index Range Scan: le o indice + acessa a tabela por ROWID (acesso aleatorio)
-- 2. Full Table Scan: le a tabela sequencialmente (acesso sequencial, mais rapido)
--
-- REGRA: Se a query retorna mais de ~5-15% da tabela com SELECT *,
-- o Oracle geralmente prefere Full Table Scan.
--
-- Mas veja o que acontece com COUNT(*):

EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE estado = 'SP';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Agora SIM usa o indice! (INDEX RANGE SCAN, cost muito menor)
-- Porque COUNT(*) so precisa do indice, nao precisa acessar a tabela.

-- =============================================================
-- CENARIO 2: Indice com ALTA seletividade
-- =============================================================
-- Email e quase unico: cada valor retorna 1 registro = ~0.00001% da tabela.
-- Indice PERFEITO.

-- ANTES
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE email = 'user1@email.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Resultado: TABLE ACCESS FULL (cost alto!)

-- Cria indice no email
CREATE INDEX idx_clientes_email ON clientes(email);

-- DEPOIS
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE email = 'user1@email.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Resultado esperado: INDEX RANGE SCAN (cost ~4)
-- Melhoria de milhares de vezes no custo!

-- =============================================================
-- CENARIO 3: Indice Composto
-- =============================================================
-- Combinando dois filtros de baixa seletividade para
-- criar ALTA seletividade juntos.

-- Query com dois filtros
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP' AND status = 'ATIVO';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- estado='SP' = ~8.3%, status='ATIVO' = ~25%, combinados = ~2%

-- Indice composto
CREATE INDEX idx_clientes_estado_status ON clientes(estado, status);

-- Ve o plano agora
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP' AND status = 'ATIVO';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- NOTA: Para SELECT *, o Oracle PODE ainda preferir FTS se ~2% da tabela
-- ainda for muitos rows. Mas para COUNT(*), com certeza usa o indice:
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE estado = 'SP' AND status = 'ATIVO';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- INDEX RANGE SCAN! (cost muito menor que FTS)

-- IMPORTANTE: A ORDEM das colunas no indice IMPORTA!
-- idx(estado, status) funciona para:
--   WHERE estado = 'SP' AND status = 'ATIVO'  --> usa indice
--   WHERE estado = 'SP'                        --> usa indice (prefixo)
-- Mas NAO funciona para:
--   WHERE status = 'ATIVO'  --> NAO usa indice (primeira coluna ausente!)

-- Teste voce mesmo:
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE status = 'ATIVO';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: Provavelmente TABLE ACCESS FULL ou INDEX SKIP SCAN.
-- O indice (estado, status) nao ajuda diretamente
-- quando a PRIMEIRA coluna nao esta no filtro.

-- =============================================================
-- CENARIO 4: Indice para ORDER BY
-- =============================================================

-- Query com ordenacao
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'RJ' ORDER BY data_cadastro;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Observe: SORT ORDER BY (caro! precisa ordenar ~8.3% dos registros)

-- Indice que cobre filtro + ordenacao
CREATE INDEX idx_clientes_estado_data ON clientes(estado, data_cadastro);

EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'RJ' ORDER BY data_cadastro;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
-- Se o otimizador escolher o indice, o SORT desaparece!
-- O indice ja entrega os dados na ordem correta.

-- =============================================================
-- CENARIO 5: Covering Index (Index-Only Scan)
-- =============================================================

-- Quando o indice contem TODAS as colunas que a query precisa,
-- o Oracle nao precisa acessar a tabela. So le o indice!

EXPLAIN PLAN FOR
SELECT estado, COUNT(*) FROM clientes GROUP BY estado;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Se aparecer INDEX FAST FULL SCAN, parabens!
-- O indice idx_clientes_estado contem tudo que a query precisa.
-- Se aparecer TABLE ACCESS FULL, e porque o otimizador calculou
-- que ler a tabela toda e mais eficiente (pode acontecer).

-- =============================================================
-- VISUALIZAR INDICES EXISTENTES
-- =============================================================

-- Ver todos os indices que voce criou
SELECT index_name, column_name, column_position
FROM user_ind_columns
WHERE table_name = 'CLIENTES'
ORDER BY index_name, column_position;

-- Ver tamanho dos indices
SELECT segment_name, ROUND(bytes/1024/1024, 2) AS size_mb
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
