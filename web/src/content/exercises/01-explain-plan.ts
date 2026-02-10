/** @description Exercise 1: Introduction to EXPLAIN PLAN, execution plan reading, and key metrics (Cost, Rows, Operations). */
import type { Exercise } from "@/types";

export const exercise: Exercise = {
  slug: "explain-plan-basics",
  icon: "Search",
  difficulty: "beginner",
  estimatedTime: 30,
  title: {
    "pt-BR": "Entendendo o Plano de Execução",
    en: "Understanding Execution Plans",
  },
  description: {
    "pt-BR":
      "Aprenda a ler e interpretar planos de execução do Oracle. Entenda o que é Full Table Scan, Index Scan, custo e como comparar diferentes queries.",
    en: "Learn to read and interpret Oracle execution plans. Understand Full Table Scan, Index Scan, cost, and how to compare different queries.",
  },
  steps: [
    {
      id: "intro",
      title: {
        "pt-BR": "O que é um Plano de Execução?",
        en: "What is an Execution Plan?",
      },
      content: {
        "pt-BR": `## O que é um Plano de Execução?

Quando você executa um SQL, o Oracle não apenas "roda" a query — ele primeiro cria um **plano de execução**, que é o caminho que ele vai seguir para buscar os dados.

Pense assim: se você precisa encontrar um livro numa biblioteca, você pode:
1. **Olhar livro por livro** (Full Table Scan) — funciona, mas é lento
2. **Consultar o catálogo** (Index Scan) — vai direto ao livro

O comando \`EXPLAIN PLAN\` mostra qual caminho o Oracle escolheu, **sem executar a query**.

### Métricas importantes

| Métrica | Significado |
|---------|-------------|
| **Cost** | Custo estimado (quanto MENOR, melhor) |
| **Rows** | Estimativa de linhas retornadas |
| **Bytes** | Volume de dados estimado |
| **Operation** | Operação que o Oracle vai usar |

### Operações comuns

- **TABLE ACCESS FULL** — Lê a tabela inteira (sem índice)
- **INDEX UNIQUE SCAN** — Busca exata no índice (1 resultado)
- **INDEX RANGE SCAN** — Busca um intervalo no índice
- **TABLE ACCESS BY INDEX ROWID** — Acessa a tabela via ponteiro do índice`,
        en: `## What is an Execution Plan?

When you execute SQL, Oracle doesn't just "run" the query — it first creates an **execution plan**, which is the path it will follow to fetch the data.

Think of it this way: if you need to find a book in a library, you can:
1. **Look at every book** (Full Table Scan) — works, but it's slow
2. **Check the catalog** (Index Scan) — goes straight to the book

The \`EXPLAIN PLAN\` command shows which path Oracle chose, **without executing the query**.

### Important metrics

| Metric | Meaning |
|--------|---------|
| **Cost** | Estimated cost (LOWER is better) |
| **Rows** | Estimated rows returned |
| **Bytes** | Estimated data volume |
| **Operation** | Operation Oracle will use |

### Common operations

- **TABLE ACCESS FULL** — Reads the entire table (no index)
- **INDEX UNIQUE SCAN** — Exact index lookup (1 result)
- **INDEX RANGE SCAN** — Scans a range in the index
- **TABLE ACCESS BY INDEX ROWID** — Accesses table via index pointer`,
      },
      sql: `-- Generate the execution plan (does NOT execute the query, only estimates)
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP';

-- View the plan
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: false,
      hint: {
        "pt-BR":
          "Observe a operação TABLE ACCESS FULL — isso significa que o Oracle leu a tabela inteira. O custo é ~37000.",
        en: "Notice the TABLE ACCESS FULL operation — this means Oracle read the entire table. The cost is ~37000.",
      },
    },
    {
      id: "compare-pk-vs-no-index",
      title: {
        "pt-BR": "PK vs Campo sem Índice",
        en: "PK vs Column without Index",
      },
      content: {
        "pt-BR": `## Comparando: PK vs Campo sem Índice

Vamos comparar duas buscas na tabela \`clientes\` (9.5M registros):

1. **Busca por PK (id)** — tem índice automático
2. **Busca por email** — sem índice

### Por que a diferença?

A **Primary Key** cria um índice automaticamente. Quando você busca por \`id = 12345\`, o Oracle usa o índice e vai **direto** ao registro.

Sem índice, o Oracle precisa ler **TODOS** os 9.5M registros para encontrar 1 email.

> A diferença de custo é de ~3 vs ~37000 — uma melhoria de **mais de 10.000x**!

Execute as queries abaixo e compare os planos.`,
        en: `## Comparing: PK vs Column without Index

Let's compare two searches on the \`clientes\` table (9.5M rows):

1. **Search by PK (id)** — has automatic index
2. **Search by email** — no index

### Why the difference?

The **Primary Key** creates an index automatically. When you search for \`id = 12345\`, Oracle uses the index and goes **directly** to the record.

Without an index, Oracle needs to read **ALL** 9.5M records to find 1 email.

> The cost difference is ~3 vs ~37000 — an improvement of **over 10,000x**!

Execute the queries below and compare the plans.`,
      },
      sql: `-- Query 1: Search by PK (has automatic index)
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE id = 12345;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Query 2: Search by field without index
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE email = 'teste@gmail.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "PK usa INDEX UNIQUE SCAN (cost ~3). Email usa TABLE ACCESS FULL (cost ~37000).",
        en: "PK uses INDEX UNIQUE SCAN (cost ~3). Email uses TABLE ACCESS FULL (cost ~37000).",
      },
    },
    {
      id: "real-statistics",
      title: {
        "pt-BR": "Estatísticas de Execução Real",
        en: "Real Execution Statistics",
      },
      content: {
        "pt-BR": `## Estatísticas Reais vs Estimativas

O \`EXPLAIN PLAN\` só **estima**. Para ver o que **realmente aconteceu**, usamos \`DBMS_XPLAN.DISPLAY_CURSOR\`.

### Colunas importantes

| Coluna | Significado |
|--------|-------------|
| **E-Rows** | Linhas ESTIMADAS pelo otimizador |
| **A-Rows** | Linhas REAIS retornadas |
| **A-Time** | Tempo REAL de execução |
| **Buffers** | Blocos lidos da memória (logical reads) |
| **Reads** | Blocos lidos do disco (physical reads) |

> Se **E-Rows** for muito diferente de **A-Rows**, as estatísticas estão desatualizadas! Solução: \`EXEC DBMS_STATS.GATHER_TABLE_STATS(USER, 'CLIENTES');\`

Execute a query abaixo para ver estatísticas reais.`,
        en: `## Real Statistics vs Estimates

\`EXPLAIN PLAN\` only **estimates**. To see what **actually happened**, we use \`DBMS_XPLAN.DISPLAY_CURSOR\`.

### Important columns

| Column | Meaning |
|--------|---------|
| **E-Rows** | Rows ESTIMATED by the optimizer |
| **A-Rows** | ACTUAL rows returned |
| **A-Time** | ACTUAL execution time |
| **Buffers** | Blocks read from memory (logical reads) |
| **Reads** | Blocks read from disk (physical reads) |

> If **E-Rows** is very different from **A-Rows**, statistics are outdated! Solution: \`EXEC DBMS_STATS.GATHER_TABLE_STATS(USER, 'CLIENTES');\`

Execute the query below to see real statistics.`,
      },
      sql: `-- Enable real statistics collection
ALTER SESSION SET STATISTICS_LEVEL = ALL;

-- Execute the query (must actually run it)
SELECT * FROM clientes WHERE estado = 'SP' AND ROWNUM <= 10;

-- View REAL statistics of the last executed query
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));`,
      editable: false,
      hint: {
        "pt-BR":
          "Compare E-Rows com A-Rows. Se forem muito diferentes, as estatísticas precisam ser atualizadas.",
        en: "Compare E-Rows with A-Rows. If they're very different, statistics need updating.",
      },
    },
    {
      id: "practical-exercise",
      title: {
        "pt-BR": "Exercício Prático: Compare 4 Queries",
        en: "Practical Exercise: Compare 4 Queries",
      },
      content: {
        "pt-BR": `## Compare o Custo de 4 Queries

Execute cada query e anote o custo no plano de execução:

| Query | Filtro | Custo esperado |
|-------|--------|---------------|
| A | \`estado = 'SP'\` | ~37000 |
| B | \`id = 100\` | ~2 |
| C | \`nome LIKE 'Maria%'\` | ~37000 |
| D | \`nome LIKE '%Silva%'\` | ~37000 |

### Perguntas para reflexão

1. Por que Query B é milhares de vezes mais rápida que Query A?
2. Por que Queries C e D têm custo parecido mesmo sendo LIKE diferentes?

> **Query B** tem índice (PK). As outras não têm índice, então o Oracle precisa ler todos os registros.
>
> **Query C** (\`LIKE 'Maria%'\`) *poderia* usar um índice se existisse, pois o prefixo é fixo. **Query D** (\`LIKE '%Silva%'\`) *nunca* usa índice B-Tree porque o curinga no início impede a busca ordenada.`,
        en: `## Compare the Cost of 4 Queries

Execute each query and note the cost in the execution plan:

| Query | Filter | Expected cost |
|-------|--------|--------------|
| A | \`estado = 'SP'\` | ~37000 |
| B | \`id = 100\` | ~2 |
| C | \`nome LIKE 'Maria%'\` | ~37000 |
| D | \`nome LIKE '%Silva%'\` | ~37000 |

### Questions for reflection

1. Why is Query B thousands of times faster than Query A?
2. Why do Queries C and D have similar cost even with different LIKE patterns?

> **Query B** has an index (PK). The others don't have indexes, so Oracle needs to read all records.
>
> **Query C** (\`LIKE 'Maria%'\`) *could* use an index if one existed, since the prefix is fixed. **Query D** (\`LIKE '%Silva%'\`) *never* uses a B-Tree index because the leading wildcard prevents ordered search.`,
      },
      sql: `-- Query A: Full Table Scan
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE estado = 'SP';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Query B: Index Unique Scan (PK)
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE id = 100;
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Query C: LIKE with prefix
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE nome LIKE 'Maria%';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Query D: LIKE with leading wildcard (NEVER uses B-Tree index)
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes WHERE nome LIKE '%Silva%';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      challenge: {
        "pt-BR":
          "Modifique a Query A para buscar por email. O que muda no custo? E se buscar por id?",
        en: "Modify Query A to search by email. What changes in cost? What about searching by id?",
      },
    },
  ],
};
