-- =============================================================
-- ORACLE TUNING LAB - Coleta de Estatisticas
-- =============================================================
-- Coleta estatisticas para o otimizador funcionar corretamente
-- =============================================================

-- Conecta ao PDB
ALTER SESSION SET CONTAINER = FREEPDB1;

SET SERVEROUTPUT ON;

BEGIN
    DBMS_OUTPUT.PUT_LINE('Coletando estatisticas das tabelas...');

    DBMS_STATS.GATHER_TABLE_STATS(
        ownname => USER,
        tabname => 'CLIENTES',
        estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,
        method_opt => 'FOR ALL COLUMNS SIZE AUTO'
    );
    DBMS_OUTPUT.PUT_LINE('  CLIENTES: OK');

    DBMS_STATS.GATHER_TABLE_STATS(
        ownname => USER,
        tabname => 'PEDIDOS',
        estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,
        method_opt => 'FOR ALL COLUMNS SIZE AUTO'
    );
    DBMS_OUTPUT.PUT_LINE('  PEDIDOS: OK');

    DBMS_STATS.GATHER_TABLE_STATS(
        ownname => USER,
        tabname => 'ITENS_PEDIDO',
        estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,
        method_opt => 'FOR ALL COLUMNS SIZE AUTO'
    );
    DBMS_OUTPUT.PUT_LINE('  ITENS_PEDIDO: OK');

    DBMS_STATS.GATHER_TABLE_STATS(
        ownname => USER,
        tabname => 'LOGS_ACESSO',
        estimate_percent => DBMS_STATS.AUTO_SAMPLE_SIZE,
        method_opt => 'FOR ALL COLUMNS SIZE AUTO'
    );
    DBMS_OUTPUT.PUT_LINE('  LOGS_ACESSO: OK');

    DBMS_OUTPUT.PUT_LINE('Estatisticas coletadas com sucesso!');
END;
/
