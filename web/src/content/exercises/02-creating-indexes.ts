/** @description Exercise 2: Creating and analyzing indexes — selectivity, composite indexes, covering indexes, and ORDER BY optimization. */
import type { Exercise } from "@/types";

export const exercise: Exercise = {
  slug: "creating-indexes",
  icon: "ListPlus",
  difficulty: "beginner",
  estimatedTime: 40,
  title: {
    "pt-BR": "Criando e Analisando Índices",
    en: "Creating and Analyzing Indexes",
  },
  description: {
    "pt-BR":
      "Entenda quando e como criar índices. Aprenda sobre seletividade, índices compostos, covering indexes e como verificar se o Oracle realmente usa o índice.",
    en: "Understand when and how to create indexes. Learn about selectivity, composite indexes, covering indexes, and how to verify Oracle actually uses the index.",
  },
  steps: [
    {
      id: "low-selectivity",
      title: {
        "pt-BR": "Cenário 1: Baixa Seletividade",
        en: "Scenario 1: Low Selectivity",
      },
      content: {
        "pt-BR": `## Índice em Coluna com Baixa Seletividade

A coluna \`estado\` tem apenas **12 valores distintos** em 9.5M registros. Cada estado tem ~792K registros (**8.3%** da tabela).

### O que vai acontecer?

Vamos criar um índice e ver se o Oracle o utiliza.

**Spoiler:** para \`SELECT *\`, o Oracle provavelmente **ignora** o índice! Por quê?

Para retornar 792K registros via índice, o Oracle precisaria:
1. Ler o índice (Index Range Scan)
2. Para cada entrada, acessar a tabela por ROWID (acesso aleatório)

Isso é **mais caro** do que simplesmente ler a tabela sequencialmente (Full Table Scan).

> **Regra:** Se a query retorna mais de ~5-15% da tabela com \`SELECT *\`, o Oracle geralmente prefere Full Table Scan.

Mas para \`COUNT(*)\`, o Oracle **usa** o índice porque só precisa contar — não precisa acessar a tabela!`,
        en: `## Index on Column with Low Selectivity

The \`estado\` column has only **12 distinct values** across 9.5M records. Each state has ~792K records (**8.3%** of the table).

### What will happen?

Let's create an index and see if Oracle uses it.

**Spoiler:** for \`SELECT *\`, Oracle probably **ignores** the index! Why?

To return 792K records via index, Oracle would need to:
1. Read the index (Index Range Scan)
2. For each entry, access the table by ROWID (random access)

This is **more expensive** than simply reading the table sequentially (Full Table Scan).

> **Rule:** If a query returns more than ~5-15% of the table with \`SELECT *\`, Oracle usually prefers Full Table Scan.

But for \`COUNT(*)\`, Oracle **uses** the index because it only needs to count — no need to access the table!`,
      },
      sql: `-- BEFORE: Plan without index
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Now check COUNT(*) — does the optimizer use the index for count?
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE estado = 'SP';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "Para SELECT *, espere TABLE ACCESS FULL. Para COUNT(*), o índice pode ser utilizado pois não precisa acessar a tabela.",
        en: "For SELECT *, expect TABLE ACCESS FULL. For COUNT(*), the index may be used since it doesn't need table access.",
      },
    },
    {
      id: "high-selectivity",
      title: {
        "pt-BR": "Cenário 2: Alta Seletividade",
        en: "Scenario 2: High Selectivity",
      },
      content: {
        "pt-BR": `## Índice com Alta Seletividade

O campo \`email\` é quase único: **9.5M valores distintos** em 9.5M registros. Uma busca retorna 1 registro = **0.00001%** da tabela.

Este é o cenário **perfeito** para um índice!

### Antes vs Depois

| Métrica | Sem índice | Com índice |
|---------|-----------|-----------|
| Operação | TABLE ACCESS FULL | INDEX RANGE SCAN |
| Custo | ~37000 | ~4 |
| Melhoria | — | **~9000x** |

Execute os comandos para ver a diferença dramática.

> Note que o primeiro EXPLAIN PLAN mostra o plano **antes** de criar o índice. O segundo mostra **depois**.`,
        en: `## Index with High Selectivity

The \`email\` field is nearly unique: **9.5M distinct values** across 9.5M records. A search returns 1 record = **0.00001%** of the table.

This is the **perfect** scenario for an index!

### Before vs After

| Metric | Without index | With index |
|--------|-------------|-----------|
| Operation | TABLE ACCESS FULL | INDEX RANGE SCAN |
| Cost | ~37000 | ~4 |
| Improvement | — | **~9000x** |

Execute the commands to see the dramatic difference.

> Note that the first EXPLAIN PLAN shows the plan **before** creating the index. The second shows **after**.`,
      },
      sql: `-- BEFORE: no index on email
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE email = 'user1@email.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "Sem índice: TABLE ACCESS FULL (cost ~37000). Com índice: INDEX RANGE SCAN (cost ~4). Melhoria de ~9000x!",
        en: "Without index: TABLE ACCESS FULL (cost ~37000). With index: INDEX RANGE SCAN (cost ~4). ~9000x improvement!",
      },
    },
    {
      id: "composite-index",
      title: {
        "pt-BR": "Cenário 3: Índice Composto",
        en: "Scenario 3: Composite Index",
      },
      content: {
        "pt-BR": `## Índice Composto (Multi-coluna)

Combinando dois filtros de **baixa seletividade** para criar **alta seletividade**:

- \`estado = 'SP'\` → 8.3% da tabela
- \`status = 'ATIVO'\` → 25% da tabela
- **Combinados** → ~2% da tabela

### A ordem das colunas IMPORTA!

Um índice \`(estado, status)\` funciona para:
- \`WHERE estado = 'SP' AND status = 'ATIVO'\` — usa o índice
- \`WHERE estado = 'SP'\` — usa o índice (prefixo)

**Mas NÃO funciona para:**
- \`WHERE status = 'ATIVO'\` — a primeira coluna está ausente!

> Pense no índice como uma lista telefônica ordenada por sobrenome e depois por nome. Você pode buscar por sobrenome, ou por sobrenome + nome, mas não pode buscar **só** por nome de forma eficiente.`,
        en: `## Composite Index (Multi-column)

Combining two **low selectivity** filters to create **high selectivity**:

- \`estado = 'SP'\` → 8.3% of table
- \`status = 'ATIVO'\` → 25% of table
- **Combined** → ~2% of table

### Column order MATTERS!

An index \`(estado, status)\` works for:
- \`WHERE estado = 'SP' AND status = 'ATIVO'\` — uses the index
- \`WHERE estado = 'SP'\` — uses the index (prefix)

**But does NOT work for:**
- \`WHERE status = 'ATIVO'\` — the first column is missing!

> Think of the index like a phone book sorted by last name then first name. You can search by last name, or last name + first name, but you can't efficiently search **only** by first name.`,
      },
      sql: `-- Query with two filters
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE estado = 'SP' AND status = 'ATIVO';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Test: does the index work when the FIRST column is missing?
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE status = 'ATIVO';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      challenge: {
        "pt-BR":
          "Crie um índice (estado, status) e veja se o plano muda. Depois teste buscando só por status — o índice é usado?",
        en: "Create an index on (estado, status) and see if the plan changes. Then test searching only by status — is the index used?",
      },
    },
    {
      id: "order-by-index",
      title: {
        "pt-BR": "Cenário 4: Índice para ORDER BY",
        en: "Scenario 4: Index for ORDER BY",
      },
      content: {
        "pt-BR": `## Eliminando SORT com Índice

Quando uma query tem \`ORDER BY\`, o Oracle precisa ordenar os resultados. Isso aparece no plano como **SORT ORDER BY**, que pode ser caro.

Se o índice já cobre o filtro **e** a ordenação, o SORT desaparece!

### Exemplo

\`\`\`sql
-- Índice que cobre filtro + ordenação
CREATE INDEX idx_clientes_estado_data ON clientes(estado, data_cadastro);
\`\`\`

Com este índice, uma query \`WHERE estado = 'RJ' ORDER BY data_cadastro\` não precisa de SORT — o índice já entrega os dados na ordem correta.`,
        en: `## Eliminating SORT with Index

When a query has \`ORDER BY\`, Oracle needs to sort the results. This appears in the plan as **SORT ORDER BY**, which can be expensive.

If the index covers both the filter **and** the sorting, the SORT disappears!

### Example

\`\`\`sql
-- Index covering filter + sort
CREATE INDEX idx_clientes_estado_data ON clientes(estado, data_cadastro);
\`\`\`

With this index, a query \`WHERE estado = 'RJ' ORDER BY data_cadastro\` doesn't need SORT — the index already delivers data in the correct order.`,
      },
      sql: `-- Query with ORDER BY — observe the SORT ORDER BY operation
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'RJ' ORDER BY data_cadastro;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "Observe o SORT ORDER BY no plano. Após criar um índice em (estado, data_cadastro), o SORT pode desaparecer.",
        en: "Notice the SORT ORDER BY in the plan. After creating an index on (estado, data_cadastro), the SORT may disappear.",
      },
    },
    {
      id: "covering-index",
      title: {
        "pt-BR": "Cenário 5: Covering Index",
        en: "Scenario 5: Covering Index",
      },
      content: {
        "pt-BR": `## Index-Only Scan (Covering Index)

Quando o índice contém **todas as colunas** que a query precisa, o Oracle não precisa acessar a tabela — só lê o índice!

Isso aparece como **INDEX FAST FULL SCAN** ou **INDEX FULL SCAN** no plano.

### Exemplo

\`\`\`sql
SELECT estado, COUNT(*) FROM clientes GROUP BY estado;
\`\`\`

Se existe um índice em \`estado\`, o Oracle pode responder usando **apenas o índice**, sem tocar na tabela.

### Visualizando índices existentes

Use as queries de monitoramento para ver quais índices existem e seus tamanhos.`,
        en: `## Index-Only Scan (Covering Index)

When the index contains **all columns** the query needs, Oracle doesn't need to access the table — it only reads the index!

This appears as **INDEX FAST FULL SCAN** or **INDEX FULL SCAN** in the plan.

### Example

\`\`\`sql
SELECT estado, COUNT(*) FROM clientes GROUP BY estado;
\`\`\`

If an index on \`estado\` exists, Oracle can answer using **only the index**, without touching the table.

### Viewing existing indexes

Use the monitoring queries to see which indexes exist and their sizes.`,
      },
      sql: `-- Covering index: Oracle only reads the index
EXPLAIN PLAN FOR
SELECT estado, COUNT(*) FROM clientes GROUP BY estado;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- View all indexes you created
SELECT index_name, column_name, column_position
FROM user_ind_columns
WHERE table_name = 'CLIENTES'
ORDER BY index_name, column_position;

-- View index sizes
SELECT segment_name, ROUND(bytes/1024/1024, 2) AS size_mb
FROM user_segments
WHERE segment_type = 'INDEX'
ORDER BY bytes DESC;`,
      editable: true,
      hint: {
        "pt-BR":
          "Se aparecer INDEX FAST FULL SCAN, o Oracle está usando apenas o índice (sem acessar a tabela).",
        en: "If you see INDEX FAST FULL SCAN, Oracle is using only the index (no table access).",
      },
    },
  ],
};
