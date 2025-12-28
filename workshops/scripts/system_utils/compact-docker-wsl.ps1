# Script para compactar o Docker WSL
# Execute como Administrador

Write-Host "=== Compactação do Docker WSL ===" -ForegroundColor Cyan

# Parar o WSL
Write-Host "Parando o WSL..." -ForegroundColor Yellow
wsl --shutdown
Start-Sleep -Seconds 3

# Caminho do arquivo VHDX
$vhdxPath = "C:\Users\vinic\AppData\Local\Docker\wsl\disk\docker_data.vhdx"

if (-not (Test-Path $vhdxPath)) {
    Write-Host "Arquivo não encontrado: $vhdxPath" -ForegroundColor Red
    exit 1
}

# Verificar tamanho antes
$sizeBefore = (Get-Item $vhdxPath).Length
Write-Host "Tamanho antes: $([math]::Round($sizeBefore/1GB,2)) GB" -ForegroundColor Yellow

# Criar script do diskpart
$scriptPath = "$env:TEMP\compact_docker.txt"
$diskpartScript = @"
select vdisk file="$vhdxPath"
attach vdisk readonly
compact vdisk
detach vdisk
"@

$diskpartScript | Out-File -FilePath $scriptPath -Encoding ASCII -NoNewline

Write-Host "Executando compactação (isso pode levar alguns minutos)..." -ForegroundColor Yellow

# Executar diskpart
$result = diskpart /s $scriptPath 2>&1

# Remover script temporário
Remove-Item $scriptPath -ErrorAction SilentlyContinue

# Verificar tamanho depois
Start-Sleep -Seconds 3
$sizeAfter = (Get-Item $vhdxPath).Length
$spaceFreed = $sizeBefore - $sizeAfter

Write-Host "`n=== Resultado ===" -ForegroundColor Green
Write-Host "Tamanho antes: $([math]::Round($sizeBefore/1GB,2)) GB" -ForegroundColor White
Write-Host "Tamanho depois: $([math]::Round($sizeAfter/1GB,2)) GB" -ForegroundColor White
Write-Host "Espaço liberado: $([math]::Round($spaceFreed/1GB,2)) GB" -ForegroundColor Green

if ($spaceFreed -gt 0) {
    Write-Host "`nCompactação concluída com sucesso!" -ForegroundColor Green
} else {
    Write-Host "`nO arquivo pode já estar otimizado ou não foi possível compactar." -ForegroundColor Yellow
}

