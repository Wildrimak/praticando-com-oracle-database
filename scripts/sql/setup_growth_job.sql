-- =============================================================
-- ORACLE TUNING LAB - Crescimento Gradual (Background)
-- =============================================================
-- Cria procedure + job DBMS_SCHEDULER que adiciona dados
-- gradualmente ate atingir os volumes alvo.
-- Roda a cada 3 minutos e se auto-desabilita ao terminar.
--
-- Alvos finais:
--   clientes:     4.000.000
--   pedidos:      16.000.000
--   itens_pedido: 25.000.000
--   logs_acesso:  12.000.000
--   TOTAL:        ~57.000.000 (~5.2 GB)
-- =============================================================

SET SERVEROUTPUT ON

-- =============================================================
-- PROCEDURE: GROW_LAB_DATA
-- =============================================================
CREATE OR REPLACE PROCEDURE grow_lab_data IS
    v_count       NUMBER;
    v_max_id      NUMBER;
    v_batch       NUMBER;
    v_max_cli     NUMBER;
    v_max_ped     NUMBER;
    v_all_done    BOOLEAN := TRUE;
    v_exec_count  NUMBER := 0;

    -- Alvos
    c_target_cli  CONSTANT NUMBER := 4000000;
    c_target_ped  CONSTANT NUMBER := 16000000;
    c_target_ite  CONSTANT NUMBER := 25000000;
    c_target_log  CONSTANT NUMBER := 12000000;

    -- Batches por execucao
    c_batch_cli   CONSTANT NUMBER := 100000;
    c_batch_ped   CONSTANT NUMBER := 500000;
    c_batch_ite   CONSTANT NUMBER := 800000;
    c_batch_log   CONSTANT NUMBER := 400000;
BEGIN
    -- Conta execucoes do job para decidir quando recolectar stats
    BEGIN
        SELECT NVL(run_count, 0) INTO v_exec_count
        FROM user_scheduler_jobs
        WHERE job_name = 'GROW_DATA_JOB';
    EXCEPTION
        WHEN NO_DATA_FOUND THEN v_exec_count := 0;
    END;

    -- =========================================================
    -- CLIENTES
    -- =========================================================
    SELECT COUNT(*), NVL(MAX(id), 0) INTO v_count, v_max_id FROM clientes;

    IF v_count < c_target_cli THEN
        v_all_done := FALSE;
        v_batch := LEAST(c_batch_cli, c_target_cli - v_count);

        INSERT /*+ APPEND */ INTO clientes (id, nome, email, cpf, estado, cidade, data_cadastro, status, valor_limite)
        SELECT
            v_max_id + ROWNUM,
            DECODE(MOD(ROWNUM, 12),
                1, 'Ana', 2, 'Carlos', 3, 'Maria', 4, 'Jose',
                5, 'Pedro', 6, 'Julia', 7, 'Lucas', 8, 'Mariana',
                9, 'Rafael', 10, 'Fernanda', 11, 'Bruno', 0, 'Camila')
            || ' ' ||
            DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 10)), 10),
                0, 'Silva', 1, 'Santos', 2, 'Oliveira', 3, 'Souza',
                4, 'Rodrigues', 5, 'Ferreira', 6, 'Alves', 7, 'Pereira',
                8, 'Lima', 9, 'Gomes'),
            'user' || (v_max_id + ROWNUM) || '@email.com',
            LPAD(TRUNC(DBMS_RANDOM.VALUE(100000000, 999999999)), 9, '0') || '-' ||
            LPAD(TRUNC(DBMS_RANDOM.VALUE(10, 99)), 2, '0'),
            DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 12)), 12),
                0, 'SP', 1, 'RJ', 2, 'MG', 3, 'RS', 4, 'PR', 5, 'SC',
                6, 'BA', 7, 'PE', 8, 'CE', 9, 'GO', 10, 'PA', 11, 'MA'),
            DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 10)), 10),
                0, 'Sao Paulo', 1, 'Rio de Janeiro', 2, 'Belo Horizonte',
                3, 'Porto Alegre', 4, 'Curitiba', 5, 'Salvador',
                6, 'Recife', 7, 'Fortaleza', 8, 'Brasilia', 9, 'Manaus'),
            SYSDATE - TRUNC(DBMS_RANDOM.VALUE(0, 1825)),
            DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 4)), 4),
                0, 'ATIVO', 1, 'INATIVO', 2, 'PENDENTE', 3, 'BLOQUEADO'),
            ROUND(DBMS_RANDOM.VALUE(500, 50000), 2)
        FROM dual
        CONNECT BY LEVEL <= v_batch;

        COMMIT;
    END IF;

    -- Pega max_id atualizado de clientes para usar como FK
    SELECT NVL(MAX(id), 1) INTO v_max_cli FROM clientes;

    -- =========================================================
    -- PEDIDOS
    -- =========================================================
    SELECT COUNT(*), NVL(MAX(id), 0) INTO v_count, v_max_id FROM pedidos;

    IF v_count < c_target_ped THEN
        v_all_done := FALSE;
        v_batch := LEAST(c_batch_ped, c_target_ped - v_count);

        INSERT /*+ APPEND */ INTO pedidos (id, cliente_id, data_pedido, valor_total, status)
        SELECT
            v_max_id + ROWNUM,
            TRUNC(DBMS_RANDOM.VALUE(1, v_max_cli + 1)),
            SYSDATE - TRUNC(DBMS_RANDOM.VALUE(0, 730)),
            ROUND(DBMS_RANDOM.VALUE(50, 5000), 2),
            DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 5)), 5),
                0, 'PENDENTE', 1, 'PROCESSANDO', 2, 'ENVIADO',
                3, 'ENTREGUE', 4, 'CANCELADO')
        FROM dual
        CONNECT BY LEVEL <= v_batch;

        COMMIT;
    END IF;

    -- Pega max_id atualizado de pedidos para usar como FK
    SELECT NVL(MAX(id), 1) INTO v_max_ped FROM pedidos;

    -- =========================================================
    -- ITENS PEDIDO
    -- =========================================================
    SELECT COUNT(*), NVL(MAX(id), 0) INTO v_count, v_max_id FROM itens_pedido;

    IF v_count < c_target_ite THEN
        v_all_done := FALSE;
        v_batch := LEAST(c_batch_ite, c_target_ite - v_count);

        INSERT /*+ APPEND */ INTO itens_pedido (id, pedido_id, produto, quantidade, valor_unit)
        SELECT
            v_max_id + ROWNUM,
            TRUNC(DBMS_RANDOM.VALUE(1, v_max_ped + 1)),
            'Produto ' || TRUNC(DBMS_RANDOM.VALUE(1, 10000)),
            TRUNC(DBMS_RANDOM.VALUE(1, 10)),
            ROUND(DBMS_RANDOM.VALUE(10, 500), 2)
        FROM dual
        CONNECT BY LEVEL <= v_batch;

        COMMIT;
    END IF;

    -- =========================================================
    -- LOGS ACESSO
    -- =========================================================
    SELECT COUNT(*), NVL(MAX(id), 0) INTO v_count, v_max_id FROM logs_acesso;

    IF v_count < c_target_log THEN
        v_all_done := FALSE;
        v_batch := LEAST(c_batch_log, c_target_log - v_count);

        INSERT /*+ APPEND */ INTO logs_acesso (id, cliente_id, data_acesso, ip_address, acao, detalhes)
        SELECT
            v_max_id + ROWNUM,
            TRUNC(DBMS_RANDOM.VALUE(1, v_max_cli + 1)),
            SYSTIMESTAMP - NUMTODSINTERVAL(DBMS_RANDOM.VALUE(0, 525600), 'MINUTE'),
            TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' || TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' ||
            TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' || TRUNC(DBMS_RANDOM.VALUE(1, 255)),
            DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 6)), 6),
                0, 'LOGIN', 1, 'LOGOUT', 2, 'VISUALIZACAO',
                3, 'COMPRA', 4, 'PESQUISA', 5, 'ATUALIZACAO'),
            'Detalhes da acao ' || (v_max_id + ROWNUM)
        FROM dual
        CONNECT BY LEVEL <= v_batch;

        COMMIT;
    END IF;

    -- =========================================================
    -- RECOLETA ESTATISTICAS a cada 10 execucoes
    -- =========================================================
    IF MOD(v_exec_count + 1, 10) = 0 THEN
        DBMS_STATS.GATHER_TABLE_STATS(USER, 'CLIENTES', estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE);
        DBMS_STATS.GATHER_TABLE_STATS(USER, 'PEDIDOS', estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE);
        DBMS_STATS.GATHER_TABLE_STATS(USER, 'ITENS_PEDIDO', estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE);
        DBMS_STATS.GATHER_TABLE_STATS(USER, 'LOGS_ACESSO', estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE);
    END IF;

    -- =========================================================
    -- AUTO-DESABILITA quando todas as tabelas atingirem o alvo
    -- =========================================================
    IF v_all_done THEN
        -- Coleta final de estatisticas
        DBMS_STATS.GATHER_TABLE_STATS(USER, 'CLIENTES', estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE);
        DBMS_STATS.GATHER_TABLE_STATS(USER, 'PEDIDOS', estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE);
        DBMS_STATS.GATHER_TABLE_STATS(USER, 'ITENS_PEDIDO', estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE);
        DBMS_STATS.GATHER_TABLE_STATS(USER, 'LOGS_ACESSO', estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE);

        DBMS_SCHEDULER.DISABLE('GROW_DATA_JOB');
    END IF;

END;
/

-- =============================================================
-- JOB: GROW_DATA_JOB (a cada 3 minutos)
-- =============================================================
BEGIN
    -- Remove job anterior se existir
    BEGIN
        DBMS_SCHEDULER.DROP_JOB('GROW_DATA_JOB', force => TRUE);
    EXCEPTION
        WHEN OTHERS THEN NULL;
    END;

    DBMS_SCHEDULER.CREATE_JOB(
        job_name        => 'GROW_DATA_JOB',
        job_type        => 'STORED_PROCEDURE',
        job_action      => 'GROW_LAB_DATA',
        repeat_interval => 'FREQ=MINUTELY;INTERVAL=3',
        start_date      => SYSTIMESTAMP + INTERVAL '1' MINUTE,
        enabled         => TRUE,
        comments        => 'Crescimento gradual de dados do Tuning Lab ate ~57M registros'
    );
END;
/

DECLARE
    v_cli NUMBER;
    v_ped NUMBER;
    v_ite NUMBER;
    v_log NUMBER;
BEGIN
    SELECT COUNT(*) INTO v_cli FROM clientes;
    SELECT COUNT(*) INTO v_ped FROM pedidos;
    SELECT COUNT(*) INTO v_ite FROM itens_pedido;
    SELECT COUNT(*) INTO v_log FROM logs_acesso;

    DBMS_OUTPUT.PUT_LINE('=== GROWTH JOB CONFIGURADO ===');
    DBMS_OUTPUT.PUT_LINE('Volume atual:');
    DBMS_OUTPUT.PUT_LINE('  clientes:     ' || TO_CHAR(v_cli, '99,999,999') || ' -> alvo: 4.000.000');
    DBMS_OUTPUT.PUT_LINE('  pedidos:      ' || TO_CHAR(v_ped, '99,999,999') || ' -> alvo: 16.000.000');
    DBMS_OUTPUT.PUT_LINE('  itens_pedido: ' || TO_CHAR(v_ite, '99,999,999') || ' -> alvo: 25.000.000');
    DBMS_OUTPUT.PUT_LINE('  logs_acesso:  ' || TO_CHAR(v_log, '99,999,999') || ' -> alvo: 12.000.000');
    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('Job GROW_DATA_JOB roda a cada 3 minutos.');
    DBMS_OUTPUT.PUT_LINE('Tempo estimado ate o alvo: ~2 horas.');
    DBMS_OUTPUT.PUT_LINE('Monitore com: SELECT job_name, state, run_count FROM user_scheduler_jobs;');
END;
/
