-- =============================================================
-- ORACLE TUNING LAB - Populacao de Dados
-- =============================================================
-- Gera dados massivos para estudo de performance de indices
-- =============================================================

-- Conecta ao PDB
ALTER SESSION SET CONTAINER = FREEPDB1;

SET SERVEROUTPUT ON;

DECLARE
    TYPE t_varchar IS TABLE OF VARCHAR2(100) INDEX BY PLS_INTEGER;

    arr_estados t_varchar;
    arr_cidades t_varchar;
    arr_nomes t_varchar;
    arr_sobrenomes t_varchar;
    arr_status t_varchar;
    arr_status_pedido t_varchar;
    arr_acoes t_varchar;

    v_nome VARCHAR2(255);
    v_idx PLS_INTEGER;

BEGIN
    -- Inicializa arrays
    arr_estados(1) := 'SP'; arr_estados(2) := 'RJ'; arr_estados(3) := 'MG';
    arr_estados(4) := 'RS'; arr_estados(5) := 'PR'; arr_estados(6) := 'SC';
    arr_estados(7) := 'BA'; arr_estados(8) := 'PE'; arr_estados(9) := 'CE';
    arr_estados(10) := 'GO'; arr_estados(11) := 'PA'; arr_estados(12) := 'MA';

    arr_cidades(1) := 'Sao Paulo'; arr_cidades(2) := 'Rio de Janeiro';
    arr_cidades(3) := 'Belo Horizonte'; arr_cidades(4) := 'Porto Alegre';
    arr_cidades(5) := 'Curitiba'; arr_cidades(6) := 'Salvador';
    arr_cidades(7) := 'Recife'; arr_cidades(8) := 'Fortaleza';
    arr_cidades(9) := 'Brasilia'; arr_cidades(10) := 'Manaus';

    arr_nomes(1) := 'Ana'; arr_nomes(2) := 'Carlos'; arr_nomes(3) := 'Maria';
    arr_nomes(4) := 'Jose'; arr_nomes(5) := 'Pedro'; arr_nomes(6) := 'Julia';
    arr_nomes(7) := 'Lucas'; arr_nomes(8) := 'Mariana'; arr_nomes(9) := 'Rafael';
    arr_nomes(10) := 'Fernanda'; arr_nomes(11) := 'Bruno'; arr_nomes(12) := 'Camila';

    arr_sobrenomes(1) := 'Silva'; arr_sobrenomes(2) := 'Santos';
    arr_sobrenomes(3) := 'Oliveira'; arr_sobrenomes(4) := 'Souza';
    arr_sobrenomes(5) := 'Rodrigues'; arr_sobrenomes(6) := 'Ferreira';
    arr_sobrenomes(7) := 'Alves'; arr_sobrenomes(8) := 'Pereira';
    arr_sobrenomes(9) := 'Lima'; arr_sobrenomes(10) := 'Gomes';

    arr_status(1) := 'ATIVO'; arr_status(2) := 'INATIVO';
    arr_status(3) := 'PENDENTE'; arr_status(4) := 'BLOQUEADO';

    arr_status_pedido(1) := 'PENDENTE'; arr_status_pedido(2) := 'PROCESSANDO';
    arr_status_pedido(3) := 'ENVIADO'; arr_status_pedido(4) := 'ENTREGUE';
    arr_status_pedido(5) := 'CANCELADO';

    arr_acoes(1) := 'LOGIN'; arr_acoes(2) := 'LOGOUT';
    arr_acoes(3) := 'VISUALIZACAO'; arr_acoes(4) := 'COMPRA';
    arr_acoes(5) := 'PESQUISA'; arr_acoes(6) := 'ATUALIZACAO';

    DBMS_OUTPUT.PUT_LINE('=== INICIANDO CARGA DE DADOS ===');
    DBMS_OUTPUT.PUT_LINE('Tempo de inicio: ' || TO_CHAR(SYSDATE, 'HH24:MI:SS'));

    -- CLIENTES: 9.500.000 registros (~1GB)
    DBMS_OUTPUT.PUT_LINE('Inserindo 9.500.000 clientes...');

    FOR i IN 1..9500000 LOOP
        v_nome := arr_nomes(TRUNC(DBMS_RANDOM.VALUE(1, 13))) || ' ' || arr_sobrenomes(TRUNC(DBMS_RANDOM.VALUE(1, 11)));

        INSERT INTO clientes (id, nome, email, cpf, estado, cidade, data_cadastro, status, valor_limite)
        VALUES (
            i,
            v_nome,
            LOWER(REPLACE(v_nome, ' ', '.')) || i || '@email.com',
            LPAD(TRUNC(DBMS_RANDOM.VALUE(100000000, 999999999)), 9, '0') || '-' || LPAD(TRUNC(DBMS_RANDOM.VALUE(10, 99)), 2, '0'),
            arr_estados(TRUNC(DBMS_RANDOM.VALUE(1, 13))),
            arr_cidades(TRUNC(DBMS_RANDOM.VALUE(1, 11))),
            SYSDATE - TRUNC(DBMS_RANDOM.VALUE(0, 1825)),
            arr_status(TRUNC(DBMS_RANDOM.VALUE(1, 5))),
            ROUND(DBMS_RANDOM.VALUE(500, 50000), 2)
        );

        IF MOD(i, 250000) = 0 THEN
            COMMIT;
            DBMS_OUTPUT.PUT_LINE('  ' || i || ' clientes inseridos...');
        END IF;
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Clientes: OK');

    -- PEDIDOS: 46.000.000 registros (~2GB)
    DBMS_OUTPUT.PUT_LINE('Inserindo 46.000.000 pedidos...');

    FOR i IN 1..46000000 LOOP
        INSERT INTO pedidos (id, cliente_id, data_pedido, valor_total, status)
        VALUES (
            i,
            TRUNC(DBMS_RANDOM.VALUE(1, 9500001)),
            SYSDATE - TRUNC(DBMS_RANDOM.VALUE(0, 730)),
            ROUND(DBMS_RANDOM.VALUE(50, 5000), 2),
            arr_status_pedido(TRUNC(DBMS_RANDOM.VALUE(1, 6)))
        );

        IF MOD(i, 500000) = 0 THEN
            COMMIT;
            DBMS_OUTPUT.PUT_LINE('  ' || i || ' pedidos inseridos...');
        END IF;
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Pedidos: OK');

    -- ITENS PEDIDO: 128.000.000 registros (~5GB)
    DBMS_OUTPUT.PUT_LINE('Inserindo 128.000.000 itens de pedido...');

    FOR i IN 1..128000000 LOOP
        INSERT INTO itens_pedido (id, pedido_id, produto, quantidade, valor_unit)
        VALUES (
            i,
            TRUNC(DBMS_RANDOM.VALUE(1, 46000001)),
            'Produto ' || TRUNC(DBMS_RANDOM.VALUE(1, 10000)),
            TRUNC(DBMS_RANDOM.VALUE(1, 10)),
            ROUND(DBMS_RANDOM.VALUE(10, 500), 2)
        );

        IF MOD(i, 1000000) = 0 THEN
            COMMIT;
            DBMS_OUTPUT.PUT_LINE('  ' || i || ' itens inseridos...');
        END IF;
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Itens pedido: OK');

    -- LOGS: 38.500.000 registros (~3GB)
    DBMS_OUTPUT.PUT_LINE('Inserindo 38.500.000 logs de acesso...');

    FOR i IN 1..38500000 LOOP
        INSERT INTO logs_acesso (id, cliente_id, data_acesso, ip_address, acao, detalhes)
        VALUES (
            i,
            TRUNC(DBMS_RANDOM.VALUE(1, 9500001)),
            SYSTIMESTAMP - NUMTODSINTERVAL(DBMS_RANDOM.VALUE(0, 525600), 'MINUTE'),
            TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' || TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' ||
            TRUNC(DBMS_RANDOM.VALUE(1, 255)) || '.' || TRUNC(DBMS_RANDOM.VALUE(1, 255)),
            arr_acoes(TRUNC(DBMS_RANDOM.VALUE(1, 7))),
            'Detalhes da acao ' || i
        );

        IF MOD(i, 500000) = 0 THEN
            COMMIT;
            DBMS_OUTPUT.PUT_LINE('  ' || i || ' logs inseridos...');
        END IF;
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Logs: OK');

    DBMS_OUTPUT.PUT_LINE('');
    DBMS_OUTPUT.PUT_LINE('=== CARGA CONCLUIDA ===');
    DBMS_OUTPUT.PUT_LINE('Tempo de termino: ' || TO_CHAR(SYSDATE, 'HH24:MI:SS'));
END;
/
