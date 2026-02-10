-- =============================================================
-- ORACLE TUNING LAB - Carga Inicial (Seed)
-- =============================================================
-- Insere ~2.1M registros para o lab ficar usavel imediatamente.
-- O crescimento ate o volume final (~57M) e feito em background
-- pelo DBMS_SCHEDULER (setup_growth_job.sql).
-- =============================================================

SET SERVEROUTPUT ON

-- Desabilita logging para acelerar inserts massivos
ALTER TABLE clientes NOLOGGING;
ALTER TABLE pedidos NOLOGGING;
ALTER TABLE itens_pedido NOLOGGING;
ALTER TABLE logs_acesso NOLOGGING;

DECLARE
    v_start TIMESTAMP := SYSTIMESTAMP;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== INICIANDO SEED DE DADOS ===');
    DBMS_OUTPUT.PUT_LINE('Inicio: ' || TO_CHAR(SYSDATE, 'HH24:MI:SS'));

    -- =========================================================
    -- CLIENTES: 100.000 registros (seed)
    -- =========================================================
    DBMS_OUTPUT.PUT_LINE('Inserindo 100.000 clientes...');

    INSERT /*+ APPEND */ INTO clientes (id, nome, email, cpf, estado, cidade, data_cadastro, status, valor_limite)
    SELECT
        ROWNUM,
        DECODE(MOD(ROWNUM, 12),
            1, 'Ana', 2, 'Carlos', 3, 'Maria', 4, 'Jose',
            5, 'Pedro', 6, 'Julia', 7, 'Lucas', 8, 'Mariana',
            9, 'Rafael', 10, 'Fernanda', 11, 'Bruno', 0, 'Camila')
        || ' ' ||
        DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 10)), 10),
            0, 'Silva', 1, 'Santos', 2, 'Oliveira', 3, 'Souza',
            4, 'Rodrigues', 5, 'Ferreira', 6, 'Alves', 7, 'Pereira',
            8, 'Lima', 9, 'Gomes'),
        'user' || ROWNUM || '@email.com',
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
    CONNECT BY LEVEL <= 100000;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('  Clientes: OK (100.000)');

    -- =========================================================
    -- PEDIDOS: 500.000 registros (seed)
    -- =========================================================
    DBMS_OUTPUT.PUT_LINE('Inserindo 500.000 pedidos...');

    INSERT /*+ APPEND */ INTO pedidos (id, cliente_id, data_pedido, valor_total, status)
    SELECT
        ROWNUM,
        TRUNC(DBMS_RANDOM.VALUE(1, 100001)),
        SYSDATE - TRUNC(DBMS_RANDOM.VALUE(0, 730)),
        ROUND(DBMS_RANDOM.VALUE(50, 5000), 2),
        DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 5)), 5),
            0, 'PENDENTE', 1, 'PROCESSANDO', 2, 'ENVIADO',
            3, 'ENTREGUE', 4, 'CANCELADO')
    FROM dual
    CONNECT BY LEVEL <= 500000;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('  Pedidos: OK (500.000)');

    -- =========================================================
    -- ITENS PEDIDO: 1.000.000 registros (seed)
    -- =========================================================
    DBMS_OUTPUT.PUT_LINE('Inserindo 1.000.000 itens de pedido...');

    INSERT /*+ APPEND */ INTO itens_pedido (id, pedido_id, produto, quantidade, valor_unit)
    SELECT
        ROWNUM,
        TRUNC(DBMS_RANDOM.VALUE(1, 500001)),
        'Produto ' || TRUNC(DBMS_RANDOM.VALUE(1, 10000)),
        TRUNC(DBMS_RANDOM.VALUE(1, 10)),
        ROUND(DBMS_RANDOM.VALUE(10, 500), 2)
    FROM dual
    CONNECT BY LEVEL <= 1000000;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('  Itens pedido: OK (1.000.000)');

    -- =========================================================
    -- LOGS: 500.000 registros (seed)
    -- =========================================================
    DBMS_OUTPUT.PUT_LINE('Inserindo 500.000 logs de acesso...');

    INSERT /*+ APPEND */ INTO logs_acesso (id, cliente_id, data_acesso, ip_address, acao, detalhes)
    SELECT
        ROWNUM,
        TRUNC(DBMS_RANDOM.VALUE(1, 100001)),
        SYSTIMESTAMP - NUMTODSINTERVAL(DBMS_RANDOM.VALUE(0, 525600), 'MINUTE'),
        TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' || TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' ||
        TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' || TRUNC(DBMS_RANDOM.VALUE(1, 255)),
        DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 6)), 6),
            0, 'LOGIN', 1, 'LOGOUT', 2, 'VISUALIZACAO',
            3, 'COMPRA', 4, 'PESQUISA', 5, 'ATUALIZACAO'),
        'Detalhes da acao ' || ROWNUM
    FROM dual
    CONNECT BY LEVEL <= 500000;

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('  Logs: OK (500.000)');

    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=== SEED CONCLUIDO ===');
    DBMS_OUTPUT.PUT_LINE('Total: ~2.100.000 registros');
    DBMS_OUTPUT.PUT_LINE('Tempo: ' || EXTRACT(SECOND FROM (SYSTIMESTAMP - v_start)) || 's');
    DBMS_OUTPUT.PUT_LINE('Dados crescerao em background via DBMS_SCHEDULER.');
END;
/

-- Reabilita logging
ALTER TABLE clientes LOGGING;
ALTER TABLE pedidos LOGGING;
ALTER TABLE itens_pedido LOGGING;
ALTER TABLE logs_acesso LOGGING;
