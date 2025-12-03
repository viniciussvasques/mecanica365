# Script para varredura e correcao automatica de problemas SonarQube
# Windows PowerShell

param(
    [string]$Token = "",
    [switch]$AutoFix = $true,
    [switch]$RunTests = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SonarQube - Varredura e Correcao" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o token foi fornecido
if ([string]::IsNullOrEmpty($Token)) {
    $envToken = $env:SONAR_TOKEN
    if ([string]::IsNullOrEmpty($envToken)) {
        Write-Host "Token nao fornecido!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Uso:" -ForegroundColor Yellow
        Write-Host "  .\scripts\fix-sonar-issues.ps1 -Token 'seu-token-aqui'" -ForegroundColor White
        Write-Host "  .\scripts\fix-sonar-issues.ps1 -Token 'seu-token' -AutoFix" -ForegroundColor White
        Write-Host "  .\scripts\fix-sonar-issues.ps1 -Token 'seu-token' -RunTests" -ForegroundColor White
        Write-Host ""
        Write-Host "Ou configure a variavel de ambiente:" -ForegroundColor Yellow
        Write-Host "  `$env:SONAR_TOKEN='seu-token-aqui'" -ForegroundColor White
        Write-Host ""
        exit 1
    } else {
        $Token = $envToken
        Write-Host "Usando token da variavel de ambiente SONAR_TOKEN" -ForegroundColor Green
    }
}

# ETAPA 1: Correcoes automaticas com ESLint e Prettier
if ($AutoFix) {
    Write-Host ""
    Write-Host "ETAPA 1: Correcoes automaticas (ESLint + Prettier)" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Write-Host "Executando ESLint --fix..." -ForegroundColor Yellow
    npm run lint -- --fix
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ESLint encontrou problemas que nao podem ser corrigidos automaticamente" -ForegroundColor Yellow
    } else {
        Write-Host "ESLint: Correcoes aplicadas" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Aplicando formatacao automatica (Prettier)..." -ForegroundColor Yellow
    npm run format
    Write-Host "Formatacao aplicada" -ForegroundColor Green
}

# ETAPA 2: Verificar build TypeScript
Write-Host ""
Write-Host "ETAPA 2: Verificando compilacao TypeScript" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Executando build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Build TypeScript falhou!" -ForegroundColor Red
    Write-Host "Corrija os erros antes de continuar" -ForegroundColor Yellow
    exit 1
}
Write-Host "Build TypeScript: OK" -ForegroundColor Green

# ETAPA 3: Executar testes (opcional)
if ($RunTests) {
    Write-Host ""
    Write-Host "ETAPA 3: Executando testes" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    Write-Host "Executando testes com cobertura..." -ForegroundColor Yellow
    npm run test:cov
    if ($LASTEXITCODE -ne 0) {
        Write-Host "AVISO: Alguns testes falharam" -ForegroundColor Yellow
    } else {
        Write-Host "Testes: OK" -ForegroundColor Green
    }
}

# ETAPA 4: Verificar se SonarQube esta rodando
Write-Host ""
Write-Host "ETAPA 4: Verificando SonarQube" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Verificando se SonarQube esta rodando..." -ForegroundColor Yellow
try {
    $sonarContainer = docker ps --filter "name=mecanica365-workshops-sonarqube" --format "{{.State}}" 2>$null
    if ([string]::IsNullOrEmpty($sonarContainer) -or $sonarContainer -ne "running") {
        Write-Host "SonarQube nao esta rodando!" -ForegroundColor Red
        Write-Host "Iniciando SonarQube..." -ForegroundColor Yellow
        docker-compose up -d sonarqube sonarqube_db
        Write-Host "Aguardando SonarQube inicializar (30 segundos)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
    } else {
        Write-Host "SonarQube esta rodando" -ForegroundColor Green
    }
} catch {
    Write-Host "Erro ao verificar status do SonarQube" -ForegroundColor Red
    exit 1
}

# ETAPA 5: Executar analise SonarQube
Write-Host ""
Write-Host "ETAPA 5: Executando analise SonarQube" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Executando SonarQube Scanner..." -ForegroundColor Yellow
Write-Host ""

# Verificar rede Docker
Write-Host "Verificando rede Docker..." -ForegroundColor Yellow
$networkName = "mecanica365-workshops_mecanica365-workshops-network"
$networkExists = docker network ls --filter "name=$networkName" --format "{{.Name}}" 2>$null
if ([string]::IsNullOrEmpty($networkExists)) {
    # Tentar nome alternativo
    $networkName = "mecanica365-workshops-network"
    $networkExists = docker network ls --filter "name=$networkName" --format "{{.Name}}" 2>$null
}

if ([string]::IsNullOrEmpty($networkExists)) {
    Write-Host "Rede nao encontrada, usando host network..." -ForegroundColor Yellow
    Write-Host "NOTA: SonarQube deve estar acessivel em localhost:9000" -ForegroundColor Yellow
    $useHostNetwork = $true
} else {
    Write-Host "Rede encontrada: $networkExists" -ForegroundColor Green
    $useHostNetwork = $false
}

# Construir comando Docker
$dockerArgs = @(
    "run", "--rm",
    "-v", "${PWD}:/usr/src",
    "-w", "/usr/src"
)

if (-not $useHostNetwork) {
    $dockerArgs += "--network"
    $dockerArgs += $networkExists
    $sonarHost = "http://sonarqube:9000"
} else {
    $dockerArgs += "--add-host=sonarqube:host-gateway"
    $sonarHost = "http://localhost:9000"
}

$dockerArgs += "sonarsource/sonar-scanner-cli:latest"
$dockerArgs += "-Dsonar.host.url=$sonarHost"
$dockerArgs += "-Dsonar.login=$Token"

& docker $dockerArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Analise concluida com sucesso!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Visualize os resultados em:" -ForegroundColor Cyan
    Write-Host "  http://localhost:9000" -ForegroundColor White
    Write-Host ""
    Write-Host "Proximos passos:" -ForegroundColor Yellow
    Write-Host "  1. Acesse o SonarQube e verifique os problemas" -ForegroundColor White
    Write-Host "  2. Use o Quick Fix do SonarLint no VS Code (Ctrl+.)" -ForegroundColor White
    Write-Host "  3. Para problemas complexos, corrija manualmente" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "ERRO: Analise SonarQube falhou!" -ForegroundColor Red
    Write-Host "Verifique os logs acima para mais detalhes" -ForegroundColor Yellow
    exit 1
}

