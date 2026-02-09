Write-Host "=== ORACLE TUNING LAB - RESET ===" -ForegroundColor Cyan

# 1. Para containers
Write-Host "`n1. Parando containers..." -ForegroundColor Yellow
docker compose down -v

# 2. Sobe novamente
Write-Host "`n2. Iniciando banco de dados..." -ForegroundColor Yellow
docker compose up -d

# 3. Aguarda healthcheck
Write-Host "`n3. Aguardando banco ficar saudavel (pode levar alguns minutos)..." -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 0

do {
    Start-Sleep -Seconds 10
    $attempt++
    $status = docker inspect --format='{{.State.Health.Status}}' oracle-tuning-lab 2>$null

    if ($status -eq "healthy") {
        Write-Host "   Status: HEALTHY" -ForegroundColor Green
        break
    }
    elseif ($status -eq "unhealthy") {
        Write-Host "   Status: UNHEALTHY - Verificando logs..." -ForegroundColor Red
        docker logs oracle-tuning-lab --tail 30
        exit 1
    }
    else {
        Write-Host "   Tentativa $attempt/$maxAttempts - Status: $status" -ForegroundColor Gray
    }
} while ($attempt -lt $maxAttempts)

if ($status -ne "healthy") {
    Write-Host "Timeout aguardando banco. Verifique os logs:" -ForegroundColor Red
    docker logs oracle-tuning-lab --tail 50
    exit 1
}

# 4. Verifica se scripts foram executados
Write-Host "`n4. Verificando execucao dos scripts de inicializacao..." -ForegroundColor Yellow
docker logs oracle-tuning-lab 2>&1 | Select-String -Pattern "CARGA CONCLUIDA|01_setup_user|Setup Completo"

Write-Host "`n=== LAB PRONTO ===" -ForegroundColor Green
Write-Host "Conecte-se usando:" -ForegroundColor Cyan
Write-Host "  Host: localhost"
Write-Host "  Port: 1521"
Write-Host "  Service: FREEPDB1"
Write-Host "  User: tuning_lab"
Write-Host "  Password: tuning123"
Write-Host ""
Write-Host "Ou via SQLcl/SQL*Plus:" -ForegroundColor Cyan
Write-Host '  docker exec -it oracle-tuning-lab sqlplus tuning_lab/tuning123@//localhost:1521/FREEPDB1'
