# Script para configurar SonarLint no VS Code
# Windows PowerShell

param(
    [string]$SonarQubeUrl = "http://localhost:9000",
    [string]$Token = "",
    [string]$ConnectionName = "Local SonarQube",
    [string]$ProjectKey = "mecanica365-workshops-backend"
)

$ErrorActionPreference = "Stop"

Write-Host "Configurando SonarLint no VS Code" -ForegroundColor Cyan
Write-Host ""

# Verificar se o VS Code esta instalado
Write-Host "Verificando VS Code..." -ForegroundColor Cyan
$codePath = Get-Command code -ErrorAction SilentlyContinue
if (-not $codePath) {
    Write-Host "VS Code nao encontrado no PATH!" -ForegroundColor Red
    Write-Host "   Instale o VS Code ou adicione ao PATH" -ForegroundColor Yellow
    exit 1
}
Write-Host "VS Code encontrado" -ForegroundColor Green
Write-Host ""

# Verificar se a extensao SonarLint esta instalada
Write-Host "Verificando extensao SonarLint..." -ForegroundColor Cyan
$installed = code --list-extensions | Select-String "sonarsource.sonarlint-vscode"
if (-not $installed) {
    Write-Host "Extensao SonarLint nao encontrada!" -ForegroundColor Yellow
    Write-Host "   Instalando extensao..." -ForegroundColor Yellow
    code --install-extension SonarSource.sonarlint-vscode
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Falha ao instalar extensao!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Extensao instalada" -ForegroundColor Green
} else {
    Write-Host "Extensao SonarLint ja instalada" -ForegroundColor Green
}
Write-Host ""

# Verificar se o token foi fornecido
if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "Token nao fornecido!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para obter o token:" -ForegroundColor Yellow
    Write-Host "  1. Acesse: $SonarQubeUrl" -ForegroundColor White
    Write-Host "  2. Va em: My Account -> Security -> Generate Tokens" -ForegroundColor White
    Write-Host "  3. Gere um novo token" -ForegroundColor White
    Write-Host ""
    $Token = Read-Host "Cole o token aqui"
    
    if ([string]::IsNullOrEmpty($Token)) {
        Write-Host "Token nao fornecido!" -ForegroundColor Red
        exit 1
    }
}

# Verificar se o SonarQube esta acessivel
Write-Host "Verificando conexao com SonarQube..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$SonarQubeUrl/api/system/status" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "SonarQube esta acessivel" -ForegroundColor Green
} catch {
    Write-Host "Nao foi possivel conectar ao SonarQube em $SonarQubeUrl" -ForegroundColor Yellow
    Write-Host "   Certifique-se de que o SonarQube esta rodando:" -ForegroundColor Yellow
    Write-Host "   docker-compose up -d sonarqube sonarqube_db" -ForegroundColor White
    Write-Host ""
    $continue = Read-Host "Deseja continuar mesmo assim? (S/N)"
    if ($continue -ne "S" -and $continue -ne "s") {
        exit 1
    }
}
Write-Host ""

# Criar arquivo de configuracao do SonarLint
Write-Host "Criando configuracao do SonarLint..." -ForegroundColor Cyan

$sonarlintConfigPath = "$env:APPDATA\Code\User\globalStorage\sonarsource.sonarlint-vscode\sonarlint_connections.json"

# Criar diretorio se nao existir
$configDir = Split-Path -Parent $sonarlintConfigPath
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

# Ler configuracao existente ou criar nova
$config = @{
    sonarQubeConnections = @()
    sonarCloudConnections = @()
}

if (Test-Path $sonarlintConfigPath) {
    try {
        $existingConfig = Get-Content $sonarlintConfigPath -Raw | ConvertFrom-Json
        if ($existingConfig.sonarQubeConnections) {
            $config.sonarQubeConnections = $existingConfig.sonarQubeConnections
        }
    } catch {
        Write-Host "Erro ao ler configuracao existente, criando nova..." -ForegroundColor Yellow
    }
}

# Verificar se a conexao ja existe
$existingConnection = $config.sonarQubeConnections | Where-Object { $_.connectionId -eq $ConnectionName }
if ($existingConnection) {
    Write-Host "Conexao '$ConnectionName' ja existe!" -ForegroundColor Yellow
    $overwrite = Read-Host "Deseja sobrescrever? (S/N)"
    if ($overwrite -eq "S" -or $overwrite -eq "s") {
        $config.sonarQubeConnections = $config.sonarQubeConnections | Where-Object { $_.connectionId -ne $ConnectionName }
    } else {
        Write-Host "Mantendo conexao existente" -ForegroundColor Green
        Write-Host ""
        Write-Host "Proximos passos:" -ForegroundColor Cyan
        Write-Host "   1. Abra o VS Code" -ForegroundColor White
        Write-Host "   2. Pressione Ctrl+Shift+P" -ForegroundColor White
        Write-Host "   3. Digite: SonarLint: Update All Project Bindings" -ForegroundColor White
        Write-Host "   4. Selecione a conexao e o projeto" -ForegroundColor White
        exit 0
    }
}

# Adicionar nova conexao
$newConnection = @{
    connectionId = $ConnectionName
    serverUrl = $SonarQubeUrl
    token = $Token
}

$config.sonarQubeConnections += $newConnection

# Salvar configuracao
try {
    $config | ConvertTo-Json -Depth 10 | Set-Content $sonarlintConfigPath -Encoding UTF8
    Write-Host "Configuracao salva em: $sonarlintConfigPath" -ForegroundColor Green
} catch {
    Write-Host "Erro ao salvar configuracao: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Criar binding do projeto
Write-Host "Configurando binding do projeto..." -ForegroundColor Cyan

$workspacePath = (Get-Location).Path
$bindingPath = "$workspacePath\.sonarlint\$ProjectKey.json"
$bindingDir = Split-Path -Parent $bindingPath

if (-not (Test-Path $bindingDir)) {
    New-Item -ItemType Directory -Path $bindingDir -Force | Out-Null
}

$binding = @{
    sonarQubeConnectionId = $ConnectionName
    projectKey = $ProjectKey
}

try {
    $binding | ConvertTo-Json -Depth 10 | Set-Content $bindingPath -Encoding UTF8
    Write-Host "Binding criado em: $bindingPath" -ForegroundColor Green
} catch {
    Write-Host "Erro ao criar binding: $_" -ForegroundColor Yellow
    Write-Host "   Voce pode criar manualmente via VS Code" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Configuracao concluida!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "   1. Recarregue o VS Code (Ctrl+Shift+P -> Developer: Reload Window)" -ForegroundColor White
Write-Host "   2. Abra qualquer arquivo .ts" -ForegroundColor White
Write-Host "   3. Pressione Ctrl + . em uma linha com problema" -ForegroundColor White
Write-Host "   4. Selecione 'SonarLint: Fix this issue'" -ForegroundColor White
Write-Host ""
Write-Host "Pronto! SonarLint configurado e funcionando!" -ForegroundColor Green
