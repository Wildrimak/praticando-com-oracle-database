# Oracle Tuning Lab

Laboratório prático para estudo de **índices** e **planos de execução** no Oracle Database.

## Quick Start

```bash
docker compose up -d
```

Aguarde o banco inicializar (~3-5 minutos na primeira vez). O container executa automaticamente:
1. Cria as tabelas
2. Popula com **~1.1 milhão de registros**
3. Coleta estatísticas

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

## Estrutura do Banco

| Tabela | Registros | Descrição |
|--------|-----------|-----------|
| clientes | 100.000 | Tabela principal para estudo |
| pedidos | 200.000 | Para exercícios de JOIN |
| itens_pedido | 500.000 | Relacionamento N:N |
| logs_acesso | 300.000 | Tabela de alto volume |

## Exercícios

Os exercícios estão na pasta `exercicios/` e devem ser feitos em ordem:

### 1. [Explain Plan Básico](exercicios/01_explain_plan_basico.sql)
- Entender o que é um plano de execução
- Ler e interpretar EXPLAIN PLAN
- Diferença entre estimativa e realidade

### 2. [Criando Índices](exercicios/02_criando_indices.sql)
- Índice simples (B-Tree)
- Índice composto
- Quando índice ajuda vs. não ajuda
- Covering index

### 3. [Índices em JOINs](exercicios/03_indices_joins.sql)
- Importância de índices em FKs
- Tipos de JOIN (Nested Loops, Hash, Merge)
- Otimização de queries com múltiplas tabelas

### 4. [Tipos de Índices](exercicios/04_tipos_indices.sql)
- B-Tree vs Bitmap
- Function-based index
- Índice invisível
- Quando usar cada tipo

### 5. [Diagnóstico de Performance](exercicios/05_diagnostico_performance.sql)
- AUTOTRACE
- Identificar problemas comuns
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
- FTS pode ser melhor quando query retorna >10-15% da tabela

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
- Baixa seletividade
- Tabela muito pequena

## Arquivos

```
oracle-tuning-lab/
├── docker-compose.yaml      # Configuração do container
├── scripts/
│   ├── 01_create_tables.sql # Criação das tabelas
│   ├── 02_populate_data.sql # Carga de dados (6.5M registros)
│   └── 03_collect_stats.sql # Coleta de estatísticas
├── exercicios/
│   ├── 01_explain_plan_basico.sql
│   ├── 02_criando_indices.sql
│   ├── 03_indices_joins.sql
│   ├── 04_tipos_indices.sql
│   └── 05_diagnostico_performance.sql
├── reset_lab.ps1            # Script de reset (Windows)
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

### Pouca memória
A imagem oracle-free precisa de pelo menos 2GB de RAM disponível.
