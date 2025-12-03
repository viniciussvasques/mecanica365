# Script para executar SonarQube Scanner via Docker
# Windows PowerShell

param(
    [string]$Token = "",
    [switch]$WithCoverage = $false,
    [switch]$CheckQualityGate = $false
)

$ErrorActionPreference = "Stop"

Write-Host "SonarQube Scanner via Docker" -ForegroundColor Cyan
Write-Host ""

# Verificar se o token foi fornecido
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "Token nao fornecido!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\scripts\sonar-scanner.ps1 -Token 'seu-token-aqui'" -ForegroundColor White
    Write-Host "  .\scripts\sonar-scanner.ps1 -Token 'seu-token' -WithCoverage" -ForegroundColor White
    Write-Host "  .\scripts\sonar-scanner.ps1 -Token 'seu-token' -CheckQualityGate" -ForegroundColor White
    Write-Host ""
    Write-Host "Para obter o token:" -ForegroundColor Yellow
    Write-Host "  1. Acesse http://localhost:9000" -ForegroundColor White
    Write-Host "  2. Va em: My Account -> Security -> Generate Tokens" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Verificar se o SonarQube esta rodando
Write-Host "Verificando se SonarQube esta rodando..." -ForegroundColor Cyan
try {
    $sonarContainer = docker ps --filter "name=mecanica365-workshops-sonarqube" --format "{{.State}}" 2>$null
    if ([string]::IsNullOrEmpty($sonarContainer) -or $sonarContainer -ne "running") {
        Write-Host "SonarQube nao esta rodando!" -ForegroundColor Red
        Write-Host "Execute: docker-compose up -d sonarqube sonarqube_db" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "Erro ao verificar status do SonarQube" -ForegroundColor Red
    exit 1
}
Write-Host "SonarQube esta rodando" -ForegroundColor Green
Write-Host ""

# Executar testes com cobertura se solicitado
if ($WithCoverage) {
    Write-Host "Executando testes com cobertura..." -ForegroundColor Cyan
    npm run test:cov
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Testes falharam!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Testes concluidos" -ForegroundColor Green
    Write-Host ""
}

# Verificar se a rede existe, se não, usar a rede do docker-compose
$networkName = "mecanica365-workshops-network"
$networkExists = docker network ls --format "{{.Name}}" | Select-String -Pattern "^$networkName$"
if (-not $networkExists) {
    $networkName = "mecanica365-workshops_mecanica365-workshops-network"
}

# Construir comando Docker
$dockerArgs = @(
    "run", "--rm",
    "--network", $networkName,
    "-v", "${PWD}:/usr/src",
    "-w", "/usr/src",
    "sonarsource/sonar-scanner-cli:latest",
    "-Dsonar.host.url=http://mecanica365-workshops-sonarqube:9000",
    "-Dsonar.token=$Token"
)

if ($CheckQualityGate) {
    $dockerArgs += "-Dsonar.qualitygate.wait=true"
}

Write-Host "Executando analise SonarQube..." -ForegroundColor Cyan
Write-Host ""

& docker $dockerArgs

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Analise concluida com sucesso!" -ForegroundColor Green
    Write-Host "Visualize os resultados em: http://localhost:9000" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Analise falhou!" -ForegroundColor Red
    exit 1
}
