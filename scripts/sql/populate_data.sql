-- =============================================================
-- ORACLE TUNING LAB - Populacao de Dados (Otimizado)
-- =============================================================
-- Usa INSERT em lotes via SELECT para performance.
-- Row-by-row e inviavel para milhoes de registros.
-- =============================================================

SET SERVEROUTPUT ON

-- Desabilita logging para acelerar inserts massivos
ALTER TABLE clientes NOLOGGING;
ALTER TABLE pedidos NOLOGGING;
ALTER TABLE itens_pedido NOLOGGING;
ALTER TABLE logs_acesso NOLOGGING;

DECLARE
    v_batch_size   NUMBER := 500000;
    v_total        NUMBER;
    v_offset       NUMBER;
    v_remaining    NUMBER;
    v_current      NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== INICIANDO CARGA DE DADOS ===');
    DBMS_OUTPUT.PUT_LINE('Inicio: ' || TO_CHAR(SYSDATE, 'HH24:MI:SS'));

    -- =========================================================
    -- CLIENTES: 9.500.000 registros (~1GB)
    -- =========================================================
    v_total := 9500000;
    v_offset := 0;
    DBMS_OUTPUT.PUT_LINE('Inserindo ' || v_total || ' clientes...');

    WHILE v_offset < v_total LOOP
        v_remaining := v_total - v_offset;
        v_current := LEAST(v_batch_size, v_remaining);

        INSERT /*+ APPEND_VALUES */ INTO clientes (id, nome, email, cpf, estado, cidade, data_cadastro, status, valor_limite)
        SELECT
            v_offset + ROWNUM,
            DECODE(MOD(ROWNUM, 12),
                1, 'Ana', 2, 'Carlos', 3, 'Maria', 4, 'Jose',
                5, 'Pedro', 6, 'Julia', 7, 'Lucas', 8, 'Mariana',
                9, 'Rafael', 10, 'Fernanda', 11, 'Bruno', 0, 'Camila')
            || ' ' ||
            DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 10)), 10),
                0, 'Silva', 1, 'Santos', 2, 'Oliveira', 3, 'Souza',
                4, 'Rodrigues', 5, 'Ferreira', 6, 'Alves', 7, 'Pereira',
                8, 'Lima', 9, 'Gomes'),
            'user' || (v_offset + ROWNUM) || '@email.com',
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
        CONNECT BY LEVEL <= v_current;

        COMMIT;
        v_offset := v_offset + v_current;
        DBMS_OUTPUT.PUT_LINE('  ' || v_offset || ' clientes inseridos...');
    END LOOP;
    DBMS_OUTPUT.PUT_LINE('Clientes: OK');

    -- =========================================================
    -- PEDIDOS: 46.000.000 registros (~2GB)
    -- =========================================================
    v_total := 46000000;
    v_offset := 0;
    DBMS_OUTPUT.PUT_LINE('Inserindo ' || v_total || ' pedidos...');

    WHILE v_offset < v_total LOOP
        v_remaining := v_total - v_offset;
        v_current := LEAST(v_batch_size, v_remaining);

        INSERT /*+ APPEND_VALUES */ INTO pedidos (id, cliente_id, data_pedido, valor_total, status)
        SELECT
            v_offset + ROWNUM,
            TRUNC(DBMS_RANDOM.VALUE(1, 9500001)),
            SYSDATE - TRUNC(DBMS_RANDOM.VALUE(0, 730)),
            ROUND(DBMS_RANDOM.VALUE(50, 5000), 2),
            DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 5)), 5),
                0, 'PENDENTE', 1, 'PROCESSANDO', 2, 'ENVIADO',
                3, 'ENTREGUE', 4, 'CANCELADO')
        FROM dual
        CONNECT BY LEVEL <= v_current;

        COMMIT;
        v_offset := v_offset + v_current;
        IF MOD(v_offset, 2000000) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('  ' || v_offset || ' pedidos inseridos...');
        END IF;
    END LOOP;
    DBMS_OUTPUT.PUT_LINE('Pedidos: OK');

    -- =========================================================
    -- ITENS PEDIDO: 128.000.000 registros (~5GB)
    -- =========================================================
    v_total := 128000000;
    v_offset := 0;
    DBMS_OUTPUT.PUT_LINE('Inserindo ' || v_total || ' itens de pedido...');

    WHILE v_offset < v_total LOOP
        v_remaining := v_total - v_offset;
        v_current := LEAST(v_batch_size, v_remaining);

        INSERT /*+ APPEND_VALUES */ INTO itens_pedido (id, pedido_id, produto, quantidade, valor_unit)
        SELECT
            v_offset + ROWNUM,
            TRUNC(DBMS_RANDOM.VALUE(1, 46000001)),
            'Produto ' || TRUNC(DBMS_RANDOM.VALUE(1, 10000)),
            TRUNC(DBMS_RANDOM.VALUE(1, 10)),
            ROUND(DBMS_RANDOM.VALUE(10, 500), 2)
        FROM dual
        CONNECT BY LEVEL <= v_current;

        COMMIT;
        v_offset := v_offset + v_current;
        IF MOD(v_offset, 5000000) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('  ' || v_offset || ' itens inseridos...');
        END IF;
    END LOOP;
    DBMS_OUTPUT.PUT_LINE('Itens pedido: OK');

    -- =========================================================
    -- LOGS: 38.500.000 registros (~3GB)
    -- =========================================================
    v_total := 38500000;
    v_offset := 0;
    DBMS_OUTPUT.PUT_LINE('Inserindo ' || v_total || ' logs de acesso...');

    WHILE v_offset < v_total LOOP
        v_remaining := v_total - v_offset;
        v_current := LEAST(v_batch_size, v_remaining);

        INSERT /*+ APPEND_VALUES */ INTO logs_acesso (id, cliente_id, data_acesso, ip_address, acao, detalhes)
        SELECT
            v_offset + ROWNUM,
            TRUNC(DBMS_RANDOM.VALUE(1, 9500001)),
            SYSTIMESTAMP - NUMTODSINTERVAL(DBMS_RANDOM.VALUE(0, 525600), 'MINUTE'),
            TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' || TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' ||
            TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' || TRUNC(DBMS_RANDOM.VALUE(1, 255)),
            DECODE(MOD(TRUNC(DBMS_RANDOM.VALUE(0, 6)), 6),
                0, 'LOGIN', 1, 'LOGOUT', 2, 'VISUALIZACAO',
                3, 'COMPRA', 4, 'PESQUISA', 5, 'ATUALIZACAO'),
            'Detalhes da acao ' || (v_offset + ROWNUM)
        FROM dual
        CONNECT BY LEVEL <= v_current;

        COMMIT;
        v_offset := v_offset + v_current;
        IF MOD(v_offset, 2000000) = 0 THEN
            DBMS_OUTPUT.PUT_LINE('  ' || v_offset || ' logs inseridos...');
        END IF;
    END LOOP;
    DBMS_OUTPUT.PUT_LINE('Logs: OK');

    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=== CARGA CONCLUIDA ===');
    DBMS_OUTPUT.PUT_LINE('Termino: ' || TO_CHAR(SYSDATE, 'HH24:MI:SS'));
END;
/

-- Reabilita logging
ALTER TABLE clientes LOGGING;
ALTER TABLE pedidos LOGGING;
ALTER TABLE itens_pedido LOGGING;
ALTER TABLE logs_acesso LOGGING;
