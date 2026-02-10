# Oracle Tuning Lab

Laboratório prático para estudo de **índices** e **planos de execução** no Oracle Database.

## Quick Start

```bash
docker compose up -d
```

Aguarde o container ficar healthy (~1-2 minutos). O lab fica **pronto para uso imediatamente** com ~2M registros. Os dados crescem automaticamente em background até ~57M registros (~2 horas).

O container executa automaticamente:
1. Concede permissões DBA ao usuário de estudo
2. Cria as tabelas (no schema do tuning_lab)
3. Popula o seed inicial (~2.1M registros)
4. Coleta estatísticas do otimizador
5. Configura crescimento gradual via DBMS_SCHEDULER

## Conexão

| Parâmetro | Valor |
|-----------|-------|
| Host | localhost |
| Port | 1521 |
| Service | FREEPDB1 |
| User | tuning_lab |
| Password | tuning123 |

**Via terminal:**
```bash
docker exec -it oracle-tuning-lab sqlplus tuning_lab/tuning123@//localhost:1521/FREEPDB1
```

O usuário `tuning_lab` tem permissões **DBA completas**: pode criar/dropar índices, alterar sessão, ver V$ views, usar AUTOTRACE, consultar dicionário de dados, etc.

## Estrutura do Banco

| Tabela | Seed Inicial | Alvo Final | Descrição |
|--------|-------------|------------|-----------|
| clientes | 100.000 | 4.000.000 | Tabela principal para estudo |
| pedidos | 500.000 | 16.000.000 | Para exercícios de JOIN |
| itens_pedido | 1.000.000 | 25.000.000 | Relacionamento N:N |
| logs_acesso | 500.000 | 12.000.000 | Tabela de alto volume |
| **Total** | **2.100.000** | **57.000.000** | **~5.2 GB** |

Os exercícios usam **percentuais e raciocínio relativo**, então funcionam com qualquer volume de dados.

## Crescimento em Background

Os dados crescem automaticamente via `DBMS_SCHEDULER`:
- Job `GROW_DATA_JOB` roda a cada **3 minutos**
- Adiciona ~1.8M registros por execução
- Se auto-desabilita ao atingir os volumes alvo
- Recoleta estatísticas automaticamente a cada 10 execuções
- Tempo estimado até o alvo: **~2 horas**

### Monitoramento

```sql
-- Status do job
SELECT job_name, state, run_count, last_start_date
FROM user_scheduler_jobs
WHERE job_name = 'GROW_DATA_JOB';

-- Volume atual das tabelas
SELECT table_name, num_rows
FROM user_tables
WHERE table_name IN ('CLIENTES', 'PEDIDOS', 'ITENS_PEDIDO', 'LOGS_ACESSO')
ORDER BY table_name;

-- Espaço usado
SELECT tablespace_name,
       ROUND(SUM(bytes)/1024/1024/1024, 2) AS used_gb
FROM dba_segments
WHERE owner = 'TUNING_LAB'
GROUP BY tablespace_name;
```

## Exercícios

Os exercícios estão na pasta `exercicios/` e devem ser feitos em ordem:

### 1. [Explain Plan Básico](exercicios/01_explain_plan_basico.sql)
- Entender o que é um plano de execução
- Ler e interpretar EXPLAIN PLAN
- Diferença entre estimativa (E-Rows) e realidade (A-Rows)
- DISPLAY_CURSOR com estatísticas reais

### 2. [Criando Índices](exercicios/02_criando_indices.sql)
- Índice simples (B-Tree) e seletividade
- Por que o Oracle ignora índices em baixa seletividade
- Índice composto e ordem das colunas
- Covering index (index-only scan)

### 3. [Índices em JOINs](exercicios/03_indices_joins.sql)
- Importância de índices em FKs
- Tipos de JOIN (Nested Loops, Hash, Merge)
- Otimização de queries com múltiplas tabelas
- Subquery vs JOIN

### 4. [Tipos de Índices](exercicios/04_tipos_indices.sql)
- B-Tree vs Bitmap
- Function-based index
- Índice único, reverso e invisível
- Monitoramento de uso (DBA_INDEX_USAGE)

### 5. [Diagnóstico de Performance](exercicios/05_diagnostico_performance.sql)
- AUTOTRACE e DISPLAY_CURSOR
- Top SQLs por tempo (V$SQL)
- Problemas comuns: índice ignorado, conversão implícita, LIKE
- Checklist de tuning

## Comandos Úteis

### Ver plano de execução
```sql
EXPLAIN PLAN FOR
SELECT * FROM clientes WHERE estado = 'SP';

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY);
```

### Ver estatísticas reais
```sql
ALTER SESSION SET STATISTICS_LEVEL = ALL;

SELECT * FROM clientes WHERE estado = 'SP' AND ROWNUM <= 10;

SELECT * FROM TABLE(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));
```

### Listar índices
```sql
SELECT index_name, column_name
FROM user_ind_columns
WHERE table_name = 'CLIENTES'
ORDER BY index_name, column_position;
```

### Atualizar estatísticas
```sql
EXEC DBMS_STATS.GATHER_TABLE_STATS(USER, 'CLIENTES');
```

## Reset do Ambiente

Para resetar completamente o lab:

**Windows (PowerShell):**
```powershell
.\reset_lab.ps1
```

**Ou manualmente:**
```bash
docker compose down -v
docker compose up -d
```

## Conceitos Chave

### Full Table Scan vs Index Scan
- **Full Table Scan**: Lê TODA a tabela, bloco por bloco
- **Index Range Scan**: Usa índice para ir direto nos registros
- FTS pode ser melhor quando query retorna >5-15% da tabela

### Seletividade
- **Alta seletividade**: poucos registros retornados (bom para índice)
- **Baixa seletividade**: muitos registros retornados (índice pode não ajudar)

### Ordem das colunas no índice composto
```sql
CREATE INDEX idx ON tabela(col1, col2, col3);
```
- Funciona para: `WHERE col1 = ?`
- Funciona para: `WHERE col1 = ? AND col2 = ?`
- NÃO funciona para: `WHERE col2 = ?` (primeira coluna não está no filtro)

### Quando índice NÃO é usado
- Função na coluna: `WHERE UPPER(nome) = 'MARIA'`
- LIKE com % no início: `WHERE nome LIKE '%Silva'`
- Conversão implícita de tipo
- Baixa seletividade (e o Oracle está CERTO em ignorar)
- Tabela muito pequena

## Arquivos

```
oracle-tuning-lab/
├── docker-compose.yaml           # Configuração do container
├── scripts/
│   ├── init/                     # Auto-executados na inicialização
│   │   ├── 01_setup_user.sql     # Permissões DBA + limites de tablespace
│   │   └── 02_setup_lab.sh       # Cria tabelas + seed + stats + growth job
│   └── sql/                      # Scripts SQL (chamados pelo bash)
│       ├── create_tables.sql     # DDL das tabelas
│       ├── populate_data.sql     # Seed inicial (~2.1M registros)
│       ├── collect_stats.sql     # Coleta de estatísticas
│       └── setup_growth_job.sql  # Crescimento gradual via DBMS_SCHEDULER
├── exercicios/
│   ├── 01_explain_plan_basico.sql
│   ├── 02_criando_indices.sql
│   ├── 03_indices_joins.sql
│   ├── 04_tipos_indices.sql
│   └── 05_diagnostico_performance.sql
├── reset_lab.ps1                 # Script de reset (Windows)
└── README.md
```

## Troubleshooting

### Container não inicia
```bash
docker logs oracle-tuning-lab
```

### Erro de conexão
Verifique se o container está healthy:
```bash
docker ps
```

### Scripts não executaram
Os scripts só executam na **primeira inicialização**. Para re-executar:
```bash
docker compose down -v  # -v remove o volume
docker compose up -d
```

### Plano de execução mostra Rows = 1 ou 0
Estatísticas desatualizadas (ou dados ainda crescendo). Recolete:
```sql
EXEC DBMS_STATS.GATHER_TABLE_STATS(USER, 'CLIENTES');
EXEC DBMS_STATS.GATHER_TABLE_STATS(USER, 'PEDIDOS');
```

### Job de crescimento parou
```sql
-- Verificar status
SELECT job_name, state, run_count FROM user_scheduler_jobs WHERE job_name = 'GROW_DATA_JOB';

-- Se state = 'DISABLED', o job ja atingiu o alvo. Caso contrario:
EXEC DBMS_SCHEDULER.ENABLE('GROW_DATA_JOB');
```

### Pouca memória
A imagem oracle-free precisa de pelo menos 2GB de RAM disponível.
