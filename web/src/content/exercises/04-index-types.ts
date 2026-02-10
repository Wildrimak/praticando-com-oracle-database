/** @description Exercise 4: Oracle index types — B-Tree, Bitmap, Function-Based, Unique, Reverse Key, Conditional, and Invisible. */
import type { Exercise } from "@/types";

export const exercise: Exercise = {
  slug: "index-types",
  icon: "Layers",
  difficulty: "intermediate",
  estimatedTime: 50,
  title: {
    "pt-BR": "Tipos de Índices no Oracle",
    en: "Index Types in Oracle",
  },
  description: {
    "pt-BR":
      "Conheça os 7 tipos de índices do Oracle: B-Tree, Bitmap, Function-Based, Unique, Reverse Key, Condicional e Invisível. Saiba quando usar cada um.",
    en: "Learn about Oracle's 7 index types: B-Tree, Bitmap, Function-Based, Unique, Reverse Key, Conditional, and Invisible. Know when to use each.",
  },
  steps: [
    {
      id: "btree",
      title: {
        "pt-BR": "Tipo 1: B-Tree (Padrão)",
        en: "Type 1: B-Tree (Default)",
      },
      content: {
        "pt-BR": `## B-Tree Index — O Padrão

É o tipo de índice **padrão** do Oracle. Funciona como uma árvore balanceada.

### Quando usar
- Colunas com **alta seletividade** (muitos valores distintos)
- Exemplos: email, CPF, id

### Operações suportadas
\`=\`, \`<\`, \`>\`, \`<=\`, \`>=\`, \`BETWEEN\`, \`LIKE 'abc%'\`

### Como funciona

\`\`\`
          [M]
         /   \\
      [D,H]   [R,V]
      / | \\   / | \\
    [A-C][E-G][I-L] ...
\`\`\`

O Oracle navega pela árvore até encontrar o valor desejado. A busca é O(log n).`,
        en: `## B-Tree Index — The Default

This is Oracle's **default** index type. It works as a balanced tree.

### When to use
- Columns with **high selectivity** (many distinct values)
- Examples: email, CPF, id

### Supported operations
\`=\`, \`<\`, \`>\`, \`<=\`, \`>=\`, \`BETWEEN\`, \`LIKE 'abc%'\`

### How it works

\`\`\`
          [M]
         /   \\
      [D,H]   [R,V]
      / | \\   / | \\
    [A-C][E-G][I-L] ...
\`\`\`

Oracle navigates the tree to find the desired value. Search is O(log n).`,
      },
      sql: `-- B-Tree index on high-selectivity column
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE cpf = '123456789-01';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "O CPF tem alta seletividade (quase único), perfeito para B-Tree. Espere INDEX RANGE SCAN.",
        en: "CPF has high selectivity (nearly unique), perfect for B-Tree. Expect INDEX RANGE SCAN.",
      },
    },
    {
      id: "bitmap",
      title: {
        "pt-BR": "Tipo 2: Bitmap Index",
        en: "Type 2: Bitmap Index",
      },
      content: {
        "pt-BR": `## Bitmap Index

Melhor para colunas com **baixa seletividade** (poucos valores distintos).

### Quando usar
- status (4 valores), estado (12 valores), sim/não
- Tabelas predominantemente de **leitura** (data warehouse, logs)

### CUIDADO!
Péssimo para tabelas com muitos **INSERT/UPDATE concorrentes**! O bitmap trava em nível de bloco, causando contenção.

### Vantagem especial
Muito eficiente para **combinações** de filtros (AND/OR). O Oracle combina bitmaps de diferentes índices de forma muito eficiente.

\`\`\`
BITMAP CONVERSION → BITMAP AND/OR
\`\`\``,
        en: `## Bitmap Index

Best for columns with **low selectivity** (few distinct values).

### When to use
- status (4 values), estado (12 values), yes/no
- Tables that are predominantly **read** (data warehouse, logs)

### CAUTION!
Terrible for tables with many **concurrent INSERT/UPDATE**! Bitmap locks at block level, causing contention.

### Special advantage
Very efficient for **combinations** of filters (AND/OR). Oracle combines bitmaps from different indexes very efficiently.

\`\`\`
BITMAP CONVERSION → BITMAP AND/OR
\`\`\``,
      },
      sql: `-- Bitmap index: efficient for low-selectivity + AND/OR combinations
EXPLAIN PLAN FOR
SELECT COUNT(*) FROM clientes
WHERE status = 'ATIVO'
  AND estado IN ('SP', 'RJ', 'MG');
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "Observe BITMAP CONVERSION e BITMAP AND/OR no plano. O Oracle combina os bitmaps de forma eficiente.",
        en: "Notice BITMAP CONVERSION and BITMAP AND/OR in the plan. Oracle combines bitmaps efficiently.",
      },
    },
    {
      id: "function-based",
      title: {
        "pt-BR": "Tipo 3: Function-Based Index",
        en: "Type 3: Function-Based Index",
      },
      content: {
        "pt-BR": `## Function-Based Index

Quando você usa funções no \`WHERE\`, índices normais **não funcionam**.

### O problema

\`\`\`sql
-- Índice em nome NÃO ajuda aqui:
SELECT * FROM clientes WHERE UPPER(nome) = 'MARIA SILVA';
-- Oracle não consegue: UPPER('valor') → posição no índice
\`\`\`

### A solução

\`\`\`sql
-- Índice NA função:
CREATE INDEX idx_nome_upper ON clientes(UPPER(nome));
\`\`\`

Agora o Oracle pode usar o índice quando a query usa \`UPPER(nome)\`.

### Outro exemplo: busca por ano

\`\`\`sql
CREATE INDEX idx_pedidos_ano ON pedidos(EXTRACT(YEAR FROM data_pedido));
\`\`\`

Permite buscar por ano sem varrer todos os 46M registros.`,
        en: `## Function-Based Index

When you use functions in \`WHERE\`, regular indexes **don't work**.

### The problem

\`\`\`sql
-- Index on nome does NOT help here:
SELECT * FROM clientes WHERE UPPER(nome) = 'MARIA SILVA';
-- Oracle can't: UPPER('value') → position in index
\`\`\`

### The solution

\`\`\`sql
-- Index ON the function:
CREATE INDEX idx_nome_upper ON clientes(UPPER(nome));
\`\`\`

Now Oracle can use the index when the query uses \`UPPER(nome)\`.

### Another example: search by year

\`\`\`sql
CREATE INDEX idx_pedidos_ano ON pedidos(EXTRACT(YEAR FROM data_pedido));
\`\`\`

Allows searching by year without scanning all 46M records.`,
      },
      sql: `-- Function UPPER breaks the regular index
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE UPPER(nome) = 'MARIA SILVA';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      challenge: {
        "pt-BR":
          "Crie um function-based index em UPPER(nome) e veja o plano mudar de TABLE ACCESS FULL para INDEX RANGE SCAN.",
        en: "Create a function-based index on UPPER(nome) and see the plan change from TABLE ACCESS FULL to INDEX RANGE SCAN.",
      },
    },
    {
      id: "unique-index",
      title: {
        "pt-BR": "Tipo 4: Índice Único",
        en: "Type 4: Unique Index",
      },
      content: {
        "pt-BR": `## Unique Index

Garante **unicidade** + **performance**. Usa **INDEX UNIQUE SCAN** em vez de INDEX RANGE SCAN (mais rápido, pois para no primeiro resultado).

\`\`\`sql
CREATE UNIQUE INDEX idx_email_unq ON clientes(email);
-- Se tentar inserir um email duplicado, dá erro!
\`\`\`

### Diferença no plano

| Tipo | Operação | Comportamento |
|------|----------|---------------|
| Regular | INDEX RANGE SCAN | Pode retornar múltiplos resultados |
| Unique | INDEX UNIQUE SCAN | Para no primeiro (e único) resultado |`,
        en: `## Unique Index

Guarantees **uniqueness** + **performance**. Uses **INDEX UNIQUE SCAN** instead of INDEX RANGE SCAN (faster, since it stops at the first result).

\`\`\`sql
CREATE UNIQUE INDEX idx_email_unq ON clientes(email);
-- If you try to insert a duplicate email, it errors!
\`\`\`

### Plan difference

| Type | Operation | Behavior |
|------|-----------|----------|
| Regular | INDEX RANGE SCAN | Can return multiple results |
| Unique | INDEX UNIQUE SCAN | Stops at first (and only) result |`,
      },
      sql: `-- Unique index: INDEX UNIQUE SCAN (faster than RANGE SCAN)
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE email = 'user1@email.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "Observe INDEX UNIQUE SCAN — o Oracle sabe que há no máximo 1 resultado, então para imediatamente.",
        en: "Notice INDEX UNIQUE SCAN — Oracle knows there's at most 1 result, so it stops immediately.",
      },
    },
    {
      id: "reverse-key",
      title: {
        "pt-BR": "Tipo 5: Reverse Key Index",
        en: "Type 5: Reverse Key Index",
      },
      content: {
        "pt-BR": `## Reverse Key Index

### O problema: Hot Blocks

IDs sequenciais (1, 2, 3, ...) causam **"hot blocks"** — todos os INSERTs vão para o **mesmo bloco folha** do índice, criando contenção.

### A solução

\`\`\`sql
CREATE INDEX idx_logs_id_rev ON logs_acesso(id) REVERSE;
\`\`\`

O Reverse Key **inverte os bytes** do valor, distribuindo os inserts uniformemente.

### Quando usar
- Ambientes **RAC** (múltiplas instâncias)
- Alto volume de **inserts concorrentes**

### Desvantagem
**Não suporta range scan** (BETWEEN, <, >). Só funciona para buscas de igualdade (\`=\`).`,
        en: `## Reverse Key Index

### The problem: Hot Blocks

Sequential IDs (1, 2, 3, ...) cause **"hot blocks"** — all INSERTs go to the **same leaf block** of the index, creating contention.

### The solution

\`\`\`sql
CREATE INDEX idx_logs_id_rev ON logs_acesso(id) REVERSE;
\`\`\`

Reverse Key **reverses the bytes** of the value, distributing inserts uniformly.

### When to use
- **RAC** environments (multiple instances)
- High volume of **concurrent inserts**

### Disadvantage
**Does not support range scan** (BETWEEN, <, >). Only works for equality searches (\`=\`).`,
      },
      sql: `-- Reverse key index: distributes inserts to avoid hot blocks
-- Useful for sequential IDs in high-concurrency environments
SELECT index_name, index_type, uniqueness
FROM user_indexes
WHERE table_name = 'LOGS_ACESSO';`,
      editable: true,
    },
    {
      id: "conditional-index",
      title: {
        "pt-BR": "Tipo 6: Índice Condicional",
        en: "Type 6: Conditional Index",
      },
      content: {
        "pt-BR": `## Índice Condicional (via Function-Based)

Oracle **NÃO** suporta \`CREATE INDEX ... WHERE condição\` (isso é PostgreSQL).

Para indexar apenas um **subconjunto** dos dados, use function-based index com \`CASE\`:

\`\`\`sql
CREATE INDEX idx_clientes_ativos ON clientes(
    CASE WHEN status = 'ATIVO' THEN email ELSE NULL END
);
\`\`\`

### Como funciona

B-Tree **não indexa NULLs**. Então só clientes **ATIVOS** entram no índice! O índice fica menor e mais rápido.

### Limitação

A query precisa usar a **mesma expressão CASE** para acionar o índice:

\`\`\`sql
WHERE CASE WHEN status = 'ATIVO' THEN email ELSE NULL END = 'user@email.com'
\`\`\``,
        en: `## Conditional Index (via Function-Based)

Oracle does **NOT** support \`CREATE INDEX ... WHERE condition\` (that's PostgreSQL).

To index only a **subset** of the data, use a function-based index with \`CASE\`:

\`\`\`sql
CREATE INDEX idx_clientes_ativos ON clientes(
    CASE WHEN status = 'ATIVO' THEN email ELSE NULL END
);
\`\`\`

### How it works

B-Tree **doesn't index NULLs**. So only **ACTIVE** customers enter the index! The index is smaller and faster.

### Limitation

The query must use the **same CASE expression** to trigger the index:

\`\`\`sql
WHERE CASE WHEN status = 'ATIVO' THEN email ELSE NULL END = 'user@email.com'
\`\`\``,
      },
      sql: `-- Conditional index: only ACTIVE customers are indexed
EXPLAIN PLAN FOR
SELECT * FROM clientes
WHERE CASE WHEN status = 'ATIVO' THEN email ELSE NULL END = 'user1@email.com';
SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);`,
      editable: true,
      hint: {
        "pt-BR":
          "A query precisa usar a MESMA expressão CASE do índice. É a forma Oracle-nativa de fazer índice parcial.",
        en: "The query must use the SAME CASE expression as the index. This is Oracle's native way of doing partial indexes.",
      },
    },
    {
      id: "invisible-index",
      title: {
        "pt-BR": "Tipo 7: Índice Invisível",
        en: "Type 7: Invisible Index",
      },
      content: {
        "pt-BR": `## Índice Invisível

Permite **testar** um índice sem afetar os planos de execução existentes.

O otimizador **ignora** índices invisíveis por padrão.

### Fluxo de uso

1. Crie o índice como INVISIBLE
2. Teste com \`ALTER SESSION SET OPTIMIZER_USE_INVISIBLE_INDEXES = TRUE\`
3. Se funcionar bem, torne visível: \`ALTER INDEX ... VISIBLE\`
4. Se não ajudar, remova sem risco

### Monitoramento de uso

No Oracle 23c, o monitoramento é **automático**:

\`\`\`sql
SELECT name, total_access_count, last_used
FROM dba_index_usage
WHERE owner = USER;
\`\`\``,
        en: `## Invisible Index

Allows **testing** an index without affecting existing execution plans.

The optimizer **ignores** invisible indexes by default.

### Usage flow

1. Create the index as INVISIBLE
2. Test with \`ALTER SESSION SET OPTIMIZER_USE_INVISIBLE_INDEXES = TRUE\`
3. If it works well, make visible: \`ALTER INDEX ... VISIBLE\`
4. If it doesn't help, remove without risk

### Usage monitoring

In Oracle 23c, monitoring is **automatic**:

\`\`\`sql
SELECT name, total_access_count, last_used
FROM dba_index_usage
WHERE owner = USER;
\`\`\``,
      },
      sql: `-- Compare index sizes across all types
SELECT
    ui.index_name,
    ui.index_type,
    ROUND(us.bytes/1024/1024, 2) AS size_mb
FROM user_indexes ui
JOIN user_segments us ON us.segment_name = ui.index_name
WHERE ui.table_name = 'CLIENTES'
ORDER BY us.bytes DESC;`,
      editable: true,
      hint: {
        "pt-BR":
          "Índices invisíveis são ótimos para testar em produção sem risco. O otimizador só os usa se explicitamente habilitado na sessão.",
        en: "Invisible indexes are great for testing in production without risk. The optimizer only uses them if explicitly enabled in the session.",
      },
    },
  ],
};
