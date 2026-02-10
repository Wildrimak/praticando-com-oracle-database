/** @description Exercise 5: Performance diagnostics — AUTOTRACE, DISPLAY_CURSOR, finding slow SQLs, and common tuning problems. */
import type { Exercise } from "@/types";

export const exercise: Exercise = {
  slug: "performance-diagnostics",
  icon: "Stethoscope",
  difficulty: "advanced",
  estimatedTime: 60,
  title: {
    "pt-BR": "Diagnóstico de Performance",
    en: "Performance Diagnostics",
  },
  description: {
    "pt-BR":
      "Identifique e resolva problemas de performance. Aprenda a usar AUTOTRACE, DISPLAY_CURSOR, encontrar SQLs lentos e diagnosticar problemas comuns.",
    en: "Identify and solve performance problems. Learn to use AUTOTRACE, DISPLAY_CURSOR, find slow SQLs, and diagnose common issues.",
  },
  steps: [
    {
      id: "autotrace",
      title: {
        "pt-BR": "Ferramenta 1: AUTOTRACE",
        en: "Tool 1: AUTOTRACE",
      },
      content: {
        "pt-BR": `## AUTOTRACE

Mostra o plano de execução **+ estatísticas** em um único comando.

### Como usar

\`\`\`sql
SET AUTOTRACE ON;
SELECT COUNT(*) FROM clientes WHERE estado = 'SP';
SET AUTOTRACE OFF;
\`\`\`

### O que observar

| Métrica | Significado |
|---------|-------------|
| **consistent gets** | Leituras lógicas (da buffer cache/memória) |
| **physical reads** | Leituras de disco |
| **sorts (memory/disk)** | Ordenações realizadas |

> **Regra:** \`consistent gets\` é a métrica mais importante. Quanto **MENOS**, melhor. Índices reduzem consistent gets drasticamente.`,
        en: `## AUTOTRACE

Shows the execution plan **+ statistics** in a single command.

### How to use

\`\`\`sql
SET AUTOTRACE ON;
SELECT COUNT(*) FROM clientes WHERE estado = 'SP';
SET AUTOTRACE OFF;
\`\`\`

### What to observe

| Metric | Meaning |
|--------|---------|
| **consistent gets** | Logical reads (from buffer cache/memory) |
| **physical reads** | Disk reads |
| **sorts (memory/disk)** | Sorts performed |

> **Rule:** \`consistent gets\` is the most important metric. The **FEWER**, the better. Indexes reduce consistent gets drastically.`,
      },
      sql: `SET AUTOTRACE ON;

SELECT COUNT(*) FROM clientes WHERE estado = 'SP';

SET AUTOTRACE OFF;`,
      editable: false,
      hint: {
        "pt-BR":
          "Foque nos consistent gets — essa é a métrica que mais indica eficiência da query.",
        en: "Focus on consistent gets — this is the metric that best indicates query efficiency.",
      },
    },
    {
      id: "display-cursor",
      title: {
        "pt-BR": "Ferramenta 2: DISPLAY_CURSOR",
        en: "Tool 2: DISPLAY_CURSOR",
      },
      content: {
        "pt-BR": `## DBMS_XPLAN.DISPLAY_CURSOR

Mostra o plano **REAL** com estatísticas de execução. Mais detalhado que AUTOTRACE.

### Colunas importantes

| Coluna | Significado |
|--------|-------------|
| **E-Rows** | Linhas ESTIMADAS pelo otimizador |
| **A-Rows** | Linhas REAIS retornadas |
| **A-Time** | Tempo REAL de execução |
| **Buffers** | Leituras lógicas (consistent gets) |
| **Reads** | Leituras físicas de disco |

### Fluxo

1. Execute a query normalmente
2. Imediatamente após, execute \`DISPLAY_CURSOR\`
3. Compare E-Rows com A-Rows`,
        en: `## DBMS_XPLAN.DISPLAY_CURSOR

Shows the **REAL** plan with execution statistics. More detailed than AUTOTRACE.

### Important columns

| Column | Meaning |
|--------|---------|
| **E-Rows** | Rows ESTIMATED by optimizer |
| **A-Rows** | ACTUAL rows returned |
| **A-Time** | ACTUAL execution time |
| **Buffers** | Logical reads (consistent gets) |
| **Reads** | Physical disk reads |

### Flow

1. Execute the query normally
2. Immediately after, execute \`DISPLAY_CURSOR\`
3. Compare E-Rows with A-Rows`,
      },
      sql: `-- Execute the query
SELECT * FROM clientes WHERE estado = 'RJ' AND ROWNUM <= 5;

-- View real statistics
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));`,
      editable: true,
      hint: {
        "pt-BR":
          "Se E-Rows for muito diferente de A-Rows, as estatísticas estão desatualizadas.",
        en: "If E-Rows is very different from A-Rows, statistics are outdated.",
      },
    },
    {
      id: "top-sqls",
      title: {
        "pt-BR": "Ferramenta 3: Top SQLs Lentos",
        en: "Tool 3: Top Slow SQLs",
      },
      content: {
        "pt-BR": `## Top SQLs por Tempo de Execução

Com permissões DBA, você pode ver os SQLs que mais consumiram tempo no sistema.

### A query

\`\`\`sql
SELECT sql_id, executions,
       ROUND(elapsed_time/1000000, 2) AS elapsed_sec,
       SUBSTR(sql_text, 1, 80) AS sql_preview
FROM v$sql
WHERE parsing_schema_name = USER
ORDER BY elapsed_time DESC
FETCH FIRST 10 ROWS ONLY;
\`\`\`

### Próximo passo

O \`sql_id\` pode ser usado para investigar o plano detalhado:

\`\`\`sql
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR('sql_id_aqui'));
\`\`\``,
        en: `## Top SQLs by Execution Time

With DBA permissions, you can see the SQLs that consumed the most time in the system.

### The query

\`\`\`sql
SELECT sql_id, executions,
       ROUND(elapsed_time/1000000, 2) AS elapsed_sec,
       SUBSTR(sql_text, 1, 80) AS sql_preview
FROM v$sql
WHERE parsing_schema_name = USER
ORDER BY elapsed_time DESC
FETCH FIRST 10 ROWS ONLY;
\`\`\`

### Next step

The \`sql_id\` can be used to investigate the detailed plan:

\`\`\`sql
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR('sql_id_aqui'));
\`\`\``,
      },
      sql: `-- Top 10 SQLs by execution time
SELECT sql_id, executions,
       ROUND(elapsed_time/1000000, 2) AS elapsed_sec,
       SUBSTR(sql_text, 1, 80) AS sql_preview
FROM v$sql
WHERE parsing_schema_name = USER
ORDER BY elapsed_time DESC
FETCH FIRST 10 ROWS ONLY;`,
      editable: true,
    },
    {
      id: "wrong-estimates",
      title: {
        "pt-BR": "Problema 1: Estimativas Erradas",
        en: "Problem 1: Wrong Estimates",
      },
      content: {
        "pt-BR": `## E-Rows ≠ A-Rows

Se \`E-Rows\` (estimado) for muito diferente de \`A-Rows\` (real), o otimizador está tomando decisões erradas.

### Causa

Estatísticas desatualizadas. O Oracle usa estatísticas para estimar quantas linhas cada operação retornará.

### Solução

Recoleta as estatísticas:

\`\`\`sql
BEGIN
    DBMS_STATS.GATHER_TABLE_STATS(USER, 'CLIENTES');
END;
/
\`\`\`

### Verificação

\`\`\`sql
SELECT table_name, num_rows, last_analyzed
FROM user_tables
WHERE table_name IN ('CLIENTES', 'PEDIDOS', 'ITENS_PEDIDO', 'LOGS_ACESSO');
\`\`\``,
        en: `## E-Rows ≠ A-Rows

If \`E-Rows\` (estimated) is very different from \`A-Rows\` (actual), the optimizer is making wrong decisions.

### Cause

Outdated statistics. Oracle uses statistics to estimate how many rows each operation will return.

### Solution

Regather statistics:

\`\`\`sql
BEGIN
    DBMS_STATS.GATHER_TABLE_STATS(USER, 'CLIENTES');
END;
/
\`\`\`

### Verification

\`\`\`sql
SELECT table_name, num_rows, last_analyzed
FROM user_tables
WHERE table_name IN ('CLIENTES', 'PEDIDOS', 'ITENS_PEDIDO', 'LOGS_ACESSO');
\`\`\``,
      },
      sql: `-- Check when statistics were last collected
SELECT table_name, num_rows, last_analyzed
FROM user_tables
WHERE table_name IN ('CLIENTES', 'PEDIDOS', 'ITENS_PEDIDO', 'LOGS_ACESSO');`,
      editable: true,
      hint: {
        "pt-BR":
          "Se last_analyzed é NULL ou muito antigo, as estatísticas precisam ser atualizadas.",
        en: "If last_analyzed is NULL or very old, statistics need to be updated.",
      },
    },
    {
      id: "unnecessary-fts",
      title: {
        "pt-BR": "Problema 2: Full Table Scan Desnecessário",
        en: "Problem 2: Unnecessary Full Table Scan",
      },
      content: {
        "pt-BR": `## Full Table Scan em Tabela Grande com Filtro Seletivo

### Sintoma

TABLE ACCESS FULL em tabela de milhões de registros para buscar ~4 rows.

### Exemplo

\`\`\`sql
SELECT * FROM logs_acesso WHERE cliente_id = 12345;
-- TABLE ACCESS FULL em 46M registros para 4 rows!
\`\`\`

### Causa

Falta de índice na coluna filtrada.

### Solução

\`\`\`sql
CREATE INDEX idx_logs_cliente ON logs_acesso(cliente_id);
\`\`\`

> Após criar o índice: INDEX RANGE SCAN com custo drasticamente menor.`,
        en: `## Full Table Scan on Large Table with Selective Filter

### Symptom

TABLE ACCESS FULL on a table with millions of records to fetch ~4 rows.

### Example

\`\`\`sql
SELECT * FROM logs_acesso WHERE cliente_id = 12345;
-- TABLE ACCESS FULL on 46M records for 4 rows!
\`\`\`

### Cause

Missing index on the filtered column.

### Solution

\`\`\`sql
CREATE INDEX idx_logs_cliente ON logs_acesso(cliente_id);
\`\`\`

> After creating the index: INDEX RANGE SCAN with drastically lower cost.`,
      },
      sql: `-- Before: FTS on millions of records for a few rows
EXPLAIN PLAN FOR
SELECT * FROM logs_acesso WHERE cliente_id = 12345;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      challenge: {
        "pt-BR":
          "Observe o custo com TABLE ACCESS FULL. Depois de criar o índice, compare o custo com INDEX RANGE SCAN.",
        en: "Note the cost with TABLE ACCESS FULL. After creating the index, compare the cost with INDEX RANGE SCAN.",
      },
    },
    {
      id: "index-not-used",
      title: {
        "pt-BR": "Problema 3: Índice Não Usado",
        en: "Problem 3: Index Not Used",
      },
      content: {
        "pt-BR": `## 5 Causas Comuns de Índices Não Serem Usados

### 3.1 Função na coluna "quebra" o índice
\`\`\`sql
WHERE UPPER(nome) = 'MARIA'  -- FTS! Solução: índice em UPPER(nome)
\`\`\`

### 3.2 Conversão implícita de tipo
\`\`\`sql
WHERE cpf = 12345678901  -- cpf é VARCHAR2, valor é NUMBER!
-- Oracle converte: TO_NUMBER(cpf) = 12345678901
-- Isso "quebra" qualquer índice no cpf
-- Solução: WHERE cpf = '123456789-01'
\`\`\`

### 3.3 IS NULL / IS NOT NULL
B-Tree não indexa NULLs por padrão.

### 3.4 LIKE com % no início
\`\`\`sql
WHERE nome LIKE '%Silva%'  -- IMPOSSÍVEL usar índice B-Tree
\`\`\`

### 3.5 Baixa seletividade
Quando >5-15% da tabela é retornado com \`SELECT *\`, o Oracle **corretamente** escolhe FTS. Isso é uma **otimização**, não um problema!`,
        en: `## 5 Common Causes of Indexes Not Being Used

### 3.1 Function on column "breaks" the index
\`\`\`sql
WHERE UPPER(nome) = 'MARIA'  -- FTS! Solution: index on UPPER(nome)
\`\`\`

### 3.2 Implicit type conversion
\`\`\`sql
WHERE cpf = 12345678901  -- cpf is VARCHAR2, value is NUMBER!
-- Oracle converts: TO_NUMBER(cpf) = 12345678901
-- This "breaks" any index on cpf
-- Solution: WHERE cpf = '123456789-01'
\`\`\`

### 3.3 IS NULL / IS NOT NULL
B-Tree doesn't index NULLs by default.

### 3.4 LIKE with leading %
\`\`\`sql
WHERE nome LIKE '%Silva%'  -- IMPOSSIBLE to use B-Tree index
\`\`\`

### 3.5 Low selectivity
When >5-15% of the table is returned with \`SELECT *\`, Oracle **correctly** chooses FTS. This is an **optimization**, not a problem!`,
      },
      sql: `-- 3.1 Function breaks index
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE UPPER(nome) = 'MARIA';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- 3.4 LIKE with leading wildcard — can NEVER use B-Tree index
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE nome LIKE '%Silva%';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "Ambas as queries resultam em TABLE ACCESS FULL. A primeira pode ser resolvida com function-based index. A segunda não pode usar B-Tree.",
        en: "Both queries result in TABLE ACCESS FULL. The first can be solved with function-based index. The second cannot use B-Tree.",
      },
    },
    {
      id: "too-many-indexes",
      title: {
        "pt-BR": "Problema 4: Muitos Índices",
        en: "Problem 4: Too Many Indexes",
      },
      content: {
        "pt-BR": `## Overhead de Índices em Escrita

Cada INSERT/UPDATE/DELETE precisa atualizar **TODOS** os índices da tabela. Quanto mais índices, mais lento o DML.

### Identificando problemas

Veja todos os índices e suas colunas:

\`\`\`sql
SELECT index_name, column_name, column_position
FROM user_ind_columns
WHERE table_name = 'CLIENTES'
ORDER BY index_name, column_position;
\`\`\`

### Índices redundantes

- Índice em \`(A)\` + índice em \`(A, B)\` → o índice em \`(A)\` pode ser removido
- Índices com \`total_access_count = 0\` são candidatos a remoção`,
        en: `## Index Overhead on Writes

Each INSERT/UPDATE/DELETE needs to update **ALL** indexes on the table. More indexes means slower DML.

### Identifying problems

See all indexes and their columns:

\`\`\`sql
SELECT index_name, column_name, column_position
FROM user_ind_columns
WHERE table_name = 'CLIENTES'
ORDER BY index_name, column_position;
\`\`\`

### Redundant indexes

- Index on \`(A)\` + index on \`(A, B)\` → index on \`(A)\` can be removed
- Indexes with \`total_access_count = 0\` are removal candidates`,
      },
      sql: `-- View all indexes on the table
SELECT index_name, index_type, uniqueness, status
FROM user_indexes
WHERE table_name = 'CLIENTES';

-- View columns of each index
SELECT index_name, column_name, column_position
FROM user_ind_columns
WHERE table_name = 'CLIENTES'
ORDER BY index_name, column_position;`,
      editable: true,
    },
    {
      id: "tuning-checklist",
      title: {
        "pt-BR": "Checklist de Tuning",
        en: "Tuning Checklist",
      },
      content: {
        "pt-BR": `## Checklist de Tuning — 10 Pontos

Use este checklist ao diagnosticar problemas de performance:

1. Estatísticas atualizadas? (\`last_analyzed\` recente)
2. Índices nas colunas do \`WHERE\` com alta seletividade?
3. Índices nas colunas de JOIN (FKs)?
4. Funções no \`WHERE\` quebrando índices?
5. Conversão implícita de tipos?
6. \`LIKE\` com \`%\` no início?
7. Muitos índices impactando escrita?
8. Índice composto na ordem correta?
9. E-Rows próximo de A-Rows? (estatísticas precisas)
10. Excesso de SORT no plano? (índice pode eliminar sort)

### Diagnóstico geral

Execute as queries de diagnóstico para verificar tabelas sem estatísticas e índices não usados.`,
        en: `## Tuning Checklist — 10 Points

Use this checklist when diagnosing performance problems:

1. Statistics up to date? (\`last_analyzed\` recent)
2. Indexes on \`WHERE\` columns with high selectivity?
3. Indexes on JOIN columns (FKs)?
4. Functions in \`WHERE\` breaking indexes?
5. Implicit type conversion?
6. \`LIKE\` with leading \`%\`?
7. Too many indexes impacting writes?
8. Composite index in correct column order?
9. E-Rows close to A-Rows? (accurate statistics)
10. Excess SORT in plan? (index can eliminate sort)

### General diagnostics

Execute the diagnostic queries to check tables without statistics and unused indexes.`,
      },
      sql: `-- Tables without up-to-date statistics
SELECT table_name, num_rows, last_analyzed
FROM user_tables
WHERE last_analyzed IS NULL
   OR last_analyzed < SYSDATE - 30;

-- Index fragmentation analysis
SELECT
    index_name,
    blevel,
    leaf_blocks,
    distinct_keys,
    avg_leaf_blocks_per_key,
    avg_data_blocks_per_key
FROM user_indexes
WHERE table_name = 'CLIENTES';`,
      editable: true,
      hint: {
        "pt-BR":
          "Se blevel > 3, considere REBUILD do índice. Em produção, use REBUILD ONLINE.",
        en: "If blevel > 3, consider REBUILD of the index. In production, use REBUILD ONLINE.",
      },
    },
  ],
};
