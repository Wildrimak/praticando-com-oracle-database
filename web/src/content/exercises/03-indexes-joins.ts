import type { Exercise } from "@/types";

export const exercise: Exercise = {
  slug: "indexes-in-joins",
  icon: "GitMerge",
  difficulty: "intermediate",
  estimatedTime: 45,
  title: {
    "pt-BR": "Índices em JOINs",
    en: "Indexes in JOINs",
  },
  description: {
    "pt-BR":
      "Entenda como índices afetam operações de JOIN. Aprenda sobre índices em FKs, tipos de JOIN (NESTED LOOPS, HASH JOIN, MERGE JOIN) e quando usar cada um.",
    en: "Understand how indexes affect JOIN operations. Learn about FK indexes, JOIN types (NESTED LOOPS, HASH JOIN, MERGE JOIN) and when to use each.",
  },
  steps: [
    {
      id: "join-without-fk-index",
      title: {
        "pt-BR": "JOIN sem Índice na FK",
        en: "JOIN without FK Index",
      },
      content: {
        "pt-BR": `## JOIN sem Índice na Foreign Key

Quando fazemos um JOIN entre \`clientes\` e \`pedidos\`, o Oracle precisa encontrar os pedidos de cada cliente. Sem índice em \`pedidos.cliente_id\`, ele faz **Full Table Scan** nos 46M de pedidos!

### O problema

\`\`\`
clientes: INDEX UNIQUE SCAN (PK do id) → rápido ✓
pedidos:  TABLE ACCESS FULL (sem índice em cliente_id) → LENTO ✗
\`\`\`

O Oracle precisa ler **TODOS** os 46M de pedidos para achar os ~5 pedidos do cliente 12345.

### A solução

\`\`\`sql
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
\`\`\`

> **Regra:** Sempre crie índices nas colunas de Foreign Key! A melhoria é de ~100000 para ~10 no custo.`,
        en: `## JOIN without Foreign Key Index

When we JOIN \`clientes\` and \`pedidos\`, Oracle needs to find each customer's orders. Without an index on \`pedidos.cliente_id\`, it does a **Full Table Scan** on 46M orders!

### The problem

\`\`\`
clientes: INDEX UNIQUE SCAN (PK on id) → fast ✓
pedidos:  TABLE ACCESS FULL (no index on cliente_id) → SLOW ✗
\`\`\`

Oracle needs to read **ALL** 46M orders to find the ~5 orders for customer 12345.

### The solution

\`\`\`sql
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
\`\`\`

> **Rule:** Always create indexes on Foreign Key columns! The improvement is from ~100000 to ~10 in cost.`,
      },
      sql: `-- JOIN without FK index — observe the TABLE ACCESS FULL on pedidos
EXPLAIN PLAN FOR
SELECT c.nome, p.data_pedido, p.valor_total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE c.id = 12345;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "Observe que clientes usa INDEX UNIQUE SCAN (rápido), mas pedidos usa TABLE ACCESS FULL (lento). O índice na FK resolve isso.",
        en: "Notice clientes uses INDEX UNIQUE SCAN (fast), but pedidos uses TABLE ACCESS FULL (slow). An FK index fixes this.",
      },
    },
    {
      id: "join-with-date-filter",
      title: {
        "pt-BR": "JOIN com Filtro de Data",
        en: "JOIN with Date Filter",
      },
      content: {
        "pt-BR": `## JOIN com Filtro em Tabela Relacionada

Quando filtramos por data no JOIN, um índice na data pode ajudar — mas depende do **volume de dados**.

### Cuidado com ranges grandes

Com 46M pedidos em 730 dias ≈ **63K pedidos/dia**:
- 1 ano = ~23M pedidos (50% da tabela) → FTS pode ser melhor
- 1 mês = ~1.9M pedidos (~4%) → índice ajuda
- 1 dia = ~63K pedidos (0.1%) → índice ajuda muito!

> O otimizador é inteligente: para ranges muito grandes, ele pode decidir que Full Table Scan é mais eficiente que o índice.`,
        en: `## JOIN with Filter on Related Table

When we filter by date in a JOIN, a date index can help — but it depends on the **data volume**.

### Be careful with large ranges

With 46M orders over 730 days ≈ **63K orders/day**:
- 1 year = ~23M orders (50% of table) → FTS may be better
- 1 month = ~1.9M orders (~4%) → index helps
- 1 day = ~63K orders (0.1%) → index helps a lot!

> The optimizer is smart: for very large ranges, it may decide Full Table Scan is more efficient than the index.`,
      },
      sql: `-- JOIN with date filter
EXPLAIN PLAN FOR
SELECT DISTINCT c.nome, c.email
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE p.data_pedido >= DATE '2024-01-01'
  AND p.data_pedido < DATE '2025-01-01';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      challenge: {
        "pt-BR":
          "Reduza o range para 1 mês e compare o plano. O índice é usado agora?",
        en: "Reduce the range to 1 month and compare the plan. Is the index used now?",
      },
    },
    {
      id: "triple-join",
      title: {
        "pt-BR": "JOIN Triplo (3 Tabelas)",
        en: "Triple JOIN (3 Tables)",
      },
      content: {
        "pt-BR": `## JOIN com 3 Tabelas

Vamos buscar detalhes de um pedido com seus itens — envolvendo 3 tabelas:

\`\`\`
clientes → pedidos → itens_pedido
\`\`\`

Sem índice na FK de \`itens_pedido\`, o Oracle faz Full Table Scan na tabela de itens (65M registros!).

### Com índices nas FKs

Após criar índices, o JOIN triplo fica eficiente:
- **pedidos:** INDEX UNIQUE SCAN (PK)
- **clientes:** INDEX UNIQUE SCAN (PK via FK)
- **itens_pedido:** INDEX RANGE SCAN (idx_itens_pedido)

> Cada tabela é acessada de forma eficiente através dos índices.`,
        en: `## JOIN with 3 Tables

Let's fetch order details with items — involving 3 tables:

\`\`\`
clientes → pedidos → itens_pedido
\`\`\`

Without an index on \`itens_pedido\`'s FK, Oracle does a Full Table Scan on the items table (65M rows!).

### With FK indexes

After creating indexes, the triple JOIN becomes efficient:
- **pedidos:** INDEX UNIQUE SCAN (PK)
- **clientes:** INDEX UNIQUE SCAN (PK via FK)
- **itens_pedido:** INDEX RANGE SCAN (idx_itens_pedido)

> Each table is accessed efficiently through indexes.`,
      },
      sql: `-- Triple JOIN: order details with items
EXPLAIN PLAN FOR
SELECT c.nome, p.data_pedido, i.produto, i.quantidade, i.valor_unit
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
JOIN itens_pedido i ON i.pedido_id = p.id
WHERE p.id = 50000;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "Sem índice em itens_pedido.pedido_id, o Oracle faz FTS em 65M registros. Com índice, usa INDEX RANGE SCAN.",
        en: "Without index on itens_pedido.pedido_id, Oracle does FTS on 65M records. With index, uses INDEX RANGE SCAN.",
      },
    },
    {
      id: "join-algorithms",
      title: {
        "pt-BR": "Algoritmos de JOIN",
        en: "JOIN Algorithms",
      },
      content: {
        "pt-BR": `## Tipos de JOIN no Oracle

O Oracle escolhe automaticamente o algoritmo de JOIN:

### 1. NESTED LOOPS
- Bom para **poucos** registros
- Precisa de índice na tabela interna
- Para CADA registro da tabela externa, busca na interna via índice

### 2. HASH JOIN
- Bom para **muitos** registros
- Não precisa de índice
- Cria hash table de uma tabela, depois varre a outra

### 3. MERGE JOIN
- Bom quando dados já estão **ordenados**
- Ambas as tabelas são ordenadas e depois mescladas

> Podemos forçar o tipo de JOIN com *hints*: \`/*+ USE_NL(p) */\` para Nested Loops, \`/*+ USE_HASH(p) */\` para Hash Join.

Compare os custos dos dois tipos!`,
        en: `## JOIN Types in Oracle

Oracle automatically chooses the JOIN algorithm:

### 1. NESTED LOOPS
- Good for **few** records
- Needs index on inner table
- For EACH record in outer table, searches inner via index

### 2. HASH JOIN
- Good for **many** records
- Doesn't need index
- Creates hash table from one table, then scans the other

### 3. MERGE JOIN
- Good when data is already **sorted**
- Both tables are sorted then merged

> We can force the JOIN type with *hints*: \`/*+ USE_NL(p) */\` for Nested Loops, \`/*+ USE_HASH(p) */\` for Hash Join.

Compare the costs of both types!`,
      },
      sql: `-- Force NESTED LOOPS
EXPLAIN PLAN FOR
SELECT /*+ USE_NL(p) */ c.nome, p.valor_total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE c.estado = 'SP';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Force HASH JOIN
EXPLAIN PLAN FOR
SELECT /*+ USE_HASH(p) */ c.nome, p.valor_total
FROM clientes c
JOIN pedidos p ON p.cliente_id = c.id
WHERE c.estado = 'SP';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "HASH JOIN geralmente ganha quando ambas as tabelas retornam muitos registros. NESTED LOOPS é melhor para poucos registros com índice.",
        en: "HASH JOIN usually wins when both tables return many records. NESTED LOOPS is better for few records with an index.",
      },
    },
    {
      id: "subquery-vs-join",
      title: {
        "pt-BR": "Subquery vs JOIN",
        en: "Subquery vs JOIN",
      },
      content: {
        "pt-BR": `## Subquery Correlacionada vs LEFT JOIN

Duas formas de contar pedidos por cliente:

### Forma 1: Subquery correlacionada
\`\`\`sql
SELECT c.nome,
       (SELECT COUNT(*) FROM pedidos p WHERE p.cliente_id = c.id)
FROM clientes c WHERE c.estado = 'MG';
\`\`\`

### Forma 2: LEFT JOIN com agregação
\`\`\`sql
SELECT c.nome, COUNT(p.id)
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id
WHERE c.estado = 'MG'
GROUP BY c.id, c.nome;
\`\`\`

### Qual é mais eficiente?

Depende dos índices e volume:
- **Com índice** em \`pedidos(cliente_id)\`: a subquery pode ser eficiente
- **Sem índice**: o LEFT JOIN com HASH tende a ser melhor

> Compare os custos das duas abordagens!`,
        en: `## Correlated Subquery vs LEFT JOIN

Two ways to count orders per customer:

### Form 1: Correlated subquery
\`\`\`sql
SELECT c.nome,
       (SELECT COUNT(*) FROM pedidos p WHERE p.cliente_id = c.id)
FROM clientes c WHERE c.estado = 'MG';
\`\`\`

### Form 2: LEFT JOIN with aggregation
\`\`\`sql
SELECT c.nome, COUNT(p.id)
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id
WHERE c.estado = 'MG'
GROUP BY c.id, c.nome;
\`\`\`

### Which is more efficient?

It depends on indexes and volume:
- **With index** on \`pedidos(cliente_id)\`: subquery can be efficient
- **Without index**: LEFT JOIN with HASH tends to be better

> Compare the costs of both approaches!`,
      },
      sql: `-- Form 1: Correlated subquery
EXPLAIN PLAN FOR
SELECT c.nome,
       (SELECT COUNT(*) FROM pedidos p WHERE p.cliente_id = c.id) AS total_pedidos
FROM clientes c
WHERE c.estado = 'MG';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);

-- Form 2: LEFT JOIN with aggregation
EXPLAIN PLAN FOR
SELECT c.nome, COUNT(p.id) AS total_pedidos
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id
WHERE c.estado = 'MG'
GROUP BY c.id, c.nome;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      challenge: {
        "pt-BR":
          "Compare os custos. Depois crie um índice em pedidos(cliente_id) e compare novamente. Qual abordagem melhora mais?",
        en: "Compare the costs. Then create an index on pedidos(cliente_id) and compare again. Which approach improves more?",
      },
    },
  ],
};
