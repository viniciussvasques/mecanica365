# Script para parar Docker e WSL completamente
# Execute como Administrador

Write-Host "=== Parando Docker e WSL ===" -ForegroundColor Cyan

# Parar Docker Desktop
Write-Host "Parando Docker Desktop..." -ForegroundColor Yellow
Stop-Process -Name "Docker Desktop" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "com.docker.backend" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "com.docker.proxy" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "vpnkit" -Force -ErrorAction SilentlyContinue

# Parar WSL
Write-Host "Parando WSL..." -ForegroundColor Yellow
wsl --shutdown

# Aguardar alguns segundos
Start-Sleep -Seconds 5

# Verificar processos Docker
Write-Host "`nVerificando processos Docker restantes..." -ForegroundColor Yellow
$dockerProcesses = Get-Process | Where-Object { $_.ProcessName -like "*docker*" -or $_.ProcessName -like "*com.docker*" }
if ($dockerProcesses) {
    Write-Host "Processos Docker ainda rodando:" -ForegroundColor Red
    $dockerProcesses | ForEach-Object { Write-Host "  - $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Red }
    Write-Host "`nTentando forçar parada..." -ForegroundColor Yellow
    $dockerProcesses | Stop-Process -Force
    Start-Sleep -Seconds 3
} else {
    Write-Host "Nenhum processo Docker encontrado." -ForegroundColor Green
}

# Verificar se o arquivo está em uso
Write-Host "`nVerificando se o arquivo está em uso..." -ForegroundColor Yellow
$vhdxPath = "C:\Users\vinic\AppData\Local\Docker\wsl\disk\docker_data.vhdx"
if (Test-Path $vhdxPath) {
    try {
        $file = [System.IO.File]::Open($vhdxPath, 'Open', 'ReadWrite', 'None')
        $file.Close()
        Write-Host "Arquivo está livre para uso." -ForegroundColor Green
    } catch {
        Write-Host "Arquivo ainda está em uso: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "`nTente:" -ForegroundColor Yellow
        Write-Host "1. Fechar o Docker Desktop completamente (verificar na bandeja do sistema)" -ForegroundColor White
        Write-Host "2. Reiniciar o computador" -ForegroundColor White
        Write-Host "3. Executar este script novamente" -ForegroundColor White
    }
}

Write-Host "`n=== Concluído ===" -ForegroundColor Cyan
Write-Host "Agora você pode executar o diskpart novamente." -ForegroundColor Green

