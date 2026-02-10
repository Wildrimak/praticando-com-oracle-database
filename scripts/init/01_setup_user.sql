-- =============================================================
-- ORACLE TUNING LAB - Configuracao do Usuario
-- =============================================================
-- Roda como SYS. Concede permissoes DBA completas ao tuning_lab
-- para que ele tenha liberdade total como ambiente de estudos.
-- =============================================================

ALTER SESSION SET CONTAINER = FREEPDB1;

-- =============================================================
-- PROTECAO DE TABLESPACE (limites de datafile)
-- =============================================================
-- Oracle Free tem limite de 12GB. Definimos MAXSIZE para evitar
-- que a carga de dados estoure o limite e torne o PDB inacessivel.

DECLARE
    v_file VARCHAR2(500);
BEGIN
    -- UNDO: max 2GB
    SELECT file_name INTO v_file FROM dba_data_files
    WHERE tablespace_name = 'UNDOTBS1' AND ROWNUM = 1;
    EXECUTE IMMEDIATE 'ALTER DATABASE DATAFILE ''' || v_file || ''' AUTOEXTEND ON MAXSIZE 2G';

    -- USERS: max 8GB (dados + indices)
    SELECT file_name INTO v_file FROM dba_data_files
    WHERE tablespace_name = 'USERS' AND ROWNUM = 1;
    EXECUTE IMMEDIATE 'ALTER DATABASE DATAFILE ''' || v_file || ''' AUTOEXTEND ON MAXSIZE 8G';

    -- TEMP: max 1GB
    SELECT file_name INTO v_file FROM dba_temp_files
    WHERE tablespace_name = 'TEMP' AND ROWNUM = 1;
    EXECUTE IMMEDIATE 'ALTER DATABASE TEMPFILE ''' || v_file || ''' AUTOEXTEND ON MAXSIZE 1G';
END;
/

-- Reduz UNDO_RETENTION para liberar espaco mais rapido
ALTER SYSTEM SET UNDO_RETENTION = 300 SCOPE = BOTH;

-- =============================================================
-- PERMISSOES DBA SUPREMAS
-- =============================================================

-- Role DBA (inclui a maioria dos privilegios do sistema)
GRANT DBA TO tuning_lab;

-- Acesso total ao dicionario de dados (V$, DBA_*, etc.)
GRANT SELECT ANY DICTIONARY TO tuning_lab;
GRANT SELECT_CATALOG_ROLE TO tuning_lab;

-- Tablespace ilimitado
GRANT UNLIMITED TABLESPACE TO tuning_lab;

-- DBMS_SCHEDULER (para crescimento gradual de dados)
GRANT CREATE JOB TO tuning_lab;

-- Tuning Advisor (para diagnosticos avancados)
GRANT ADVISOR TO tuning_lab;

-- Garante ALTER SESSION para STATISTICS_LEVEL, optimizer params, etc.
GRANT ALTER SESSION TO tuning_lab;

-- DBMS_STATS para coleta de estatisticas
GRANT EXECUTE ON DBMS_STATS TO tuning_lab;

-- =============================================================
-- PLUSTRACE (necessario para SET AUTOTRACE ON no SQL*Plus)
-- =============================================================
BEGIN
  EXECUTE IMMEDIATE 'CREATE ROLE plustrace';
EXCEPTION
  WHEN OTHERS THEN NULL;
END;
/

GRANT SELECT ON V_$SESSTAT TO plustrace;
GRANT SELECT ON V_$STATNAME TO plustrace;
GRANT SELECT ON V_$MYSTAT TO plustrace;
GRANT PLUSTRACE TO tuning_lab;

-- =============================================================
-- GRANTS EXPLICITOS EM V$ VIEWS
-- (redundante com DBA, mas garante acesso direto)
-- =============================================================
GRANT SELECT ON V_$SESSION TO tuning_lab;
GRANT SELECT ON V_$SQL TO tuning_lab;
GRANT SELECT ON V_$SQL_PLAN TO tuning_lab;
GRANT SELECT ON V_$SQL_PLAN_STATISTICS_ALL TO tuning_lab;
GRANT SELECT ON V_$SESSTAT TO tuning_lab;
GRANT SELECT ON V_$STATNAME TO tuning_lab;
GRANT SELECT ON V_$MYSTAT TO tuning_lab;
