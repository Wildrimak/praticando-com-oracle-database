#!/bin/bash
# =============================================================
# ORACLE TUNING LAB - Script de Inicializacao
# =============================================================
# Executa a populacao de dados e coleta de estatisticas
# Garante execucao completa antes de finalizar
# =============================================================

SCRIPT_DIR="$(dirname "$0")/sql"

echo "=== Oracle Tuning Lab - Inicializacao ==="
echo "Inicio: $(date '+%Y-%m-%d %H:%M:%S')"

# Aguarda o banco estar completamente disponivel
sleep 5

echo ""
echo ">>> Populando dados (isso pode levar alguns minutos)..."
sqlplus -s sys/${ORACLE_PASSWORD}@FREEPDB1 as sysdba @${SCRIPT_DIR}/populate_data.sql

if [ $? -eq 0 ]; then
    echo ">>> Populacao concluida com sucesso!"
else
    echo ">>> ERRO na populacao de dados!"
    exit 1
fi

echo ""
echo ">>> Coletando estatisticas..."
sqlplus -s sys/${ORACLE_PASSWORD}@FREEPDB1 as sysdba @${SCRIPT_DIR}/collect_stats.sql

if [ $? -eq 0 ]; then
    echo ">>> Estatisticas coletadas com sucesso!"
else
    echo ">>> ERRO na coleta de estatisticas!"
    exit 1
fi

echo ""
echo "=== Inicializacao Completa ==="
echo "Fim: $(date '+%Y-%m-%d %H:%M:%S')"
