-- =============================================================
-- ORACLE TUNING LAB - Configuracao do Usuario
-- =============================================================
-- Roda como SYS. Concede permissoes DBA completas ao tuning_lab
-- para que ele tenha liberdade total como ambiente de estudos.
-- =============================================================

ALTER SESSION SET CONTAINER = FREEPDB1;

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
