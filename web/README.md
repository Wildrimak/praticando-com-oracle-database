# Oracle Tuning Lab

Interactive web application for learning Oracle Database Tuning hands-on. Execute SQL directly in the browser against a real Oracle database running in Docker.

## Architecture

```
Browser                    Next.js Server                Docker
  |                             |                          |
  |  POST /api/execute          |                          |
  |  { sql: "SELECT..." }      |                          |
  |  =========================> |                          |
  |                             |  sanitizeSql(sql)        |
  |                             |  (blocklist/allowlist)   |
  |                             |                          |
  |                             |  docker exec -i          |
  |                             |  sqlplus -S tuning_lab/  |
  |                             |  tuning123@FREEPDB1      |
  |                             |  ======================> |
  |                             |                          |  Oracle Free 23ai
  |                             |  stdout (SQL*Plus output)|  (gvenzl/oracle-free)
  |                             |  <====================== |
  |                             |                          |
  |  { output, success, time }  |                          |
  |  <========================= |                          |
  |                             |                          |
  |  Render as <table> or <pre> |                          |
```

## Folder Structure

```
web/
  src/
    app/
      api/
        execute/route.ts     # SQL execution endpoint (POST)
        health/route.ts      # Health check endpoint (GET)
      [locale]/
        page.tsx             # Landing page
        exercises/
          page.tsx           # Exercise listing
          [slug]/page.tsx    # Exercise workspace
      layout.tsx             # Root layout
      globals.css            # Theme, CodeMirror overrides, result tables
    components/
      common/
        ConnectionStatus.tsx # Oracle connection indicator
        LanguageSwitcher.tsx # pt-BR / en toggle
        ProgressBar.tsx      # Animated progress bar
      editor/
        SqlEditor.tsx        # CodeMirror SQL editor
        SqlTerminal.tsx      # Output panel (tables + plan highlighting)
      exercise/
        ExerciseWorkspace.tsx# Split panel: content | editor + terminal
        StepContent.tsx      # Markdown renderer for step content
        StepNavigator.tsx    # Step navigation bar
        PlanVisualizer.tsx   # Execution plan visualizer
        ComparisonView.tsx   # Before/after comparison
        ExerciseCard.tsx     # Exercise card for listing
      layout/
        Header.tsx           # Top navigation bar
        Sidebar.tsx          # Exercise sidebar
        Footer.tsx           # Footer
    content/
      exercises/
        index.ts             # Exercise registry
        01-explain-plan.ts   # Exercise 1: Execution Plans
        02-creating-indexes.ts # Exercise 2: Creating Indexes
        03-indexes-joins.ts  # Exercise 3: Indexes in JOINs
        04-index-types.ts    # Exercise 4: Index Types
        05-diagnostics.ts    # Exercise 5: Performance Diagnostics
    hooks/
      useSqlExecution.ts     # SQL execution hook
      useExerciseProgress.ts # Progress tracking (localStorage)
    lib/
      docker.ts              # Docker exec + health check
      sql-sanitizer.ts       # SQL blocklist/allowlist validation
      sql-output-parser.ts   # SQL*Plus output -> structured tables
      utils.ts               # Tailwind cn() utility
    types/
      index.ts               # TypeScript type definitions
    i18n/
      routing.ts             # Locale routing config
      request.ts             # Server-side i18n config
    middleware.ts             # i18n middleware
  messages/
    pt-BR.json               # Portuguese translations
    en.json                   # English translations
```

## Tech Stack

- **Next.js 15** with App Router
- **React 19**
- **TypeScript 5.7**
- **TailwindCSS 4** with custom oracle-orange theme
- **CodeMirror** (@uiw/react-codemirror) for SQL editing
- **next-intl** for internationalization (pt-BR, en)
- **react-markdown** for exercise content rendering
- **lucide-react** for icons

## Prerequisites

- **Node.js** >= 18
- **Docker** with the Oracle container running:

```bash
# From the project root (parent directory)
docker compose up -d
```

The application expects a container named `oracle-tuning-lab` with:
- Oracle Free 23ai (gvenzl/oracle-free image)
- User: `tuning_lab` / Password: `tuning123`
- Service: `FREEPDB1` on port `1521`

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How SQL Execution Works

1. User writes SQL in the CodeMirror editor and presses Ctrl+Enter
2. Frontend sends `POST /api/execute` with the SQL string
3. Server-side **rate limiter** checks 1 request/second per IP
4. **SQL sanitizer** validates against blocklist (DDL, DML writes, OS commands) and allowlist (SELECT, EXPLAIN PLAN, DBMS_XPLAN, etc.)
5. If safe, the SQL is piped to `docker exec -i oracle-tuning-lab sqlplus -S` via stdin
6. SQL*Plus output is captured (30s timeout, 100KB limit)
7. Response includes the raw output, success flag, and execution time
8. Frontend parses the output:
   - **EXPLAIN PLAN / errors**: Rendered as `<pre>` with color-coded highlighting (red = Full Table Scan, green = Index Scan, yellow = Hash Join)
   - **Tabular data**: Parsed into structured data and rendered as HTML `<table>` with zebra striping

## Security

- **SQL Sanitizer**: Blocks DDL (DROP, TRUNCATE, ALTER TABLE), DML writes (INSERT, UPDATE, DELETE), OS commands (HOST), and dangerous PL/SQL (EXECUTE IMMEDIATE, UTL_FILE, DBMS_SCHEDULER). Only allows SELECT, EXPLAIN PLAN, SET AUTOTRACE, and safe ALTER SESSION commands.
- **Rate Limiting**: 1 request per second per IP address (in-memory)
- **Read-Only Database User**: The `tuning_lab` user has limited privileges
- **Output Limits**: 100KB max output, 30s timeout
- **Input Limits**: 10,000 character max SQL length

## Internationalization

The application supports two locales:

| Locale | Language |
|--------|----------|
| `pt-BR` | Portuguese (Brazil) - default |
| `en` | English |

Translation files are in `messages/pt-BR.json` and `messages/en.json`. The language can be toggled via the header button.

## Exercises

| # | Title | Difficulty | Topics |
|---|-------|-----------|--------|
| 1 | Execution Plans | Beginner | EXPLAIN PLAN, Cost, Rows, TABLE ACCESS FULL, INDEX SCAN |
| 2 | Creating Indexes | Beginner | Selectivity, composite indexes, covering indexes, ORDER BY |
| 3 | Indexes in JOINs | Intermediate | FK indexes, Nested Loops, Hash Join, Merge Join, subquery vs JOIN |
| 4 | Index Types | Intermediate | B-Tree, Bitmap, Function-Based, Unique, Reverse Key, Conditional, Invisible |
| 5 | Performance Diagnostics | Advanced | AUTOTRACE, DISPLAY_CURSOR, slow SQL detection, tuning checklist |

## Data Architecture

The Oracle database uses a two-phase data loading strategy:

- **Phase 1 (Seed)**: ~2.1M rows inserted at container startup (< 1 minute)
  - 100K clientes, 500K pedidos, 1M itens_pedido, 500K logs_acesso
- **Phase 2 (Growth)**: DBMS_SCHEDULER job runs every 3 minutes, growing to ~57M rows total
  - Targets: 4M clientes, 16M pedidos, 25M itens_pedido, 12M logs_acesso
