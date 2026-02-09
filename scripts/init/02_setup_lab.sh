#!/bin/bash
# =============================================================
# ORACLE TUNING LAB - Setup Completo
# =============================================================
# Cria tabelas, popula dados e coleta estatisticas.
# Tudo roda como TUNING_LAB para que ele seja DONO das tabelas.
# =============================================================

SQL_DIR="/opt/oracle/scripts"
CONN="tuning_lab/${APP_USER_PASSWORD}@//localhost:1521/FREEPDB1"

echo "=== Oracle Tuning Lab - Setup ==="
echo "Inicio: $(date '+%Y-%m-%d %H:%M:%S')"

# Aguarda o banco estar completamente disponivel
sleep 5

echo ""
echo ">>> [1/3] Criando tabelas (como tuning_lab)..."
sqlplus -s ${CONN} @${SQL_DIR}/create_tables.sql

if [ $? -ne 0 ]; then
    echo ">>> ERRO na criacao das tabelas!"
    exit 1
fi
echo ">>> Tabelas criadas com sucesso!"

echo ""
echo ">>> [2/3] Populando dados (isso vai levar alguns minutos)..."
sqlplus -s ${CONN} @${SQL_DIR}/populate_data.sql

if [ $? -ne 0 ]; then
    echo ">>> ERRO na populacao de dados!"
    exit 1
fi
echo ">>> Dados populados com sucesso!"

echo ""
echo ">>> [3/3] Coletando estatisticas do otimizador..."
sqlplus -s ${CONN} @${SQL_DIR}/collect_stats.sql

if [ $? -ne 0 ]; then
    echo ">>> ERRO na coleta de estatisticas!"
    exit 1
fi
echo ">>> Estatisticas coletadas com sucesso!"

echo ""
echo "=== Setup Completo ==="
echo "Fim: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "Conexao: sqlplus tuning_lab/tuning123@//localhost:1521/FREEPDB1"
