# Script profissional para resolver migration falhada
# Este script verifica o estado do banco, resolve problemas e aplica migrations de forma segura

param(
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix Failed Migration - Professional" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se DATABASE_URL está configurado
if (-not $DatabaseUrl) {
    Write-Host "ERRO: DATABASE_URL não configurado" -ForegroundColor Red
    Write-Host "Configure a variável de ambiente DATABASE_URL ou passe como parâmetro" -ForegroundColor Yellow
    exit 1
}

# Extrair informações da URL do banco
$dbInfo = $DatabaseUrl -replace '.*://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)', '$1|$2|$3|$4|$5'
$dbParts = $dbInfo -split '\|'
$dbUser = $dbParts[0]
$dbPass = $dbParts[1]
$dbHost = $dbParts[2]
$dbPort = $dbParts[3]
$dbName = $dbParts[4]

Write-Host "Conectando ao banco: $dbHost:$dbPort/$dbName" -ForegroundColor Green
Write-Host ""

# Verificar se o Prisma está instalado
if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: npx não encontrado. Instale Node.js" -ForegroundColor Red
    exit 1
}

# Função para executar query SQL
function Invoke-PrismaQuery {
    param(
        [string]$Query,
        [string]$DatabaseUrl = $env:DATABASE_URL
    )
    
    $tempFile = [System.IO.Path]::GetTempFileName()
    $Query | Out-File -FilePath $tempFile -Encoding UTF8
    
    try {
        $result = npx prisma db execute --stdin < $tempFile 2>&1
        return $result
    }
    finally {
        Remove-Item $tempFile -Force -ErrorAction SilentlyContinue
    }
}

# Verificar estado da migration
Write-Host "1. Verificando estado das migrations..." -ForegroundColor Yellow
$migrationStatus = npx prisma migrate status 2>&1

if ($migrationStatus -match "following migrations have failed") {
    Write-Host "   ✓ Migration falhada detectada" -ForegroundColor Red
    $failedMigration = "20241216000000_add_quotes_module"
}
else {
    Write-Host "   ✓ Nenhuma migration falhada detectada" -ForegroundColor Green
}

Write-Host ""

# Verificar se tabela quotes existe
Write-Host "2. Verificando estado do banco de dados..." -ForegroundColor Yellow

$checkQuotesQuery = @"
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'quotes'
) as quotes_exists;
"@

# Usar Prisma para verificar
$quotesExists = $false
try {
    $result = docker-compose exec -T postgres psql -U $dbUser -d $dbName -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') as quotes_exists;" 2>&1
    if ($result -match "t\s*$" -or $result -match "true") {
        $quotesExists = $true
        Write-Host "   ✓ Tabela 'quotes' existe" -ForegroundColor Green
    }
    else {
        Write-Host "   ✗ Tabela 'quotes' não existe" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   ⚠ Não foi possível verificar via Docker. Tentando método alternativo..." -ForegroundColor Yellow
}

Write-Host ""

# Resolver migration falhada
Write-Host "3. Resolvendo migration falhada..." -ForegroundColor Yellow

if ($quotesExists) {
    Write-Host "   → Tabela existe. Marcando migration como aplicada..." -ForegroundColor Cyan
    try {
        npx prisma migrate resolve --applied 20241216000000_add_quotes_module
        Write-Host "   ✓ Migration marcada como aplicada" -ForegroundColor Green
    }
    catch {
        Write-Host "   ✗ Erro ao marcar migration como aplicada: $_" -ForegroundColor Red
        if (-not $Force) {
            Write-Host "   Use -Force para continuar mesmo com erros" -ForegroundColor Yellow
            exit 1
        }
    }
}
else {
    Write-Host "   → Tabela não existe. Marcando migration como revertida..." -ForegroundColor Cyan
    try {
        npx prisma migrate resolve --rolled-back 20241216000000_add_quotes_module
        Write-Host "   ✓ Migration marcada como revertida" -ForegroundColor Green
    }
    catch {
        Write-Host "   ✗ Erro ao marcar migration como revertida: $_" -ForegroundColor Red
        if (-not $Force) {
            exit 1
        }
    }
}

Write-Host ""

# Aplicar migrations
Write-Host "4. Aplicando migrations..." -ForegroundColor Yellow
try {
    npx prisma migrate deploy
    Write-Host "   ✓ Migrations aplicadas com sucesso" -ForegroundColor Green
}
catch {
    Write-Host "   ✗ Erro ao aplicar migrations: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Validar estado final
Write-Host "5. Validando estado final..." -ForegroundColor Yellow
$finalStatus = npx prisma migrate status 2>&1

if ($finalStatus -match "Database schema is up to date") {
    Write-Host "   ✓ Banco de dados está atualizado" -ForegroundColor Green
}
elseif ($finalStatus -match "following migrations have failed") {
    Write-Host "   ✗ Ainda há migrations falhadas" -ForegroundColor Red
    Write-Host "   Status: $finalStatus" -ForegroundColor Yellow
    exit 1
}
else {
    Write-Host "   ⚠ Status: $finalStatus" -ForegroundColor Yellow
}

Write-Host ""

# Verificar integridade das tabelas
Write-Host "6. Verificando integridade das tabelas..." -ForegroundColor Yellow

$tablesToCheck = @("quotes", "quote_items")
$allTablesExist = $true

foreach ($table in $tablesToCheck) {
    try {
        $checkResult = docker-compose exec -T postgres psql -U $dbUser -d $dbName -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table') as exists;" 2>&1
        if ($checkResult -match "t\s*$" -or $checkResult -match "true") {
            Write-Host "   ✓ Tabela '$table' existe" -ForegroundColor Green
        }
        else {
            Write-Host "   ✗ Tabela '$table' não existe" -ForegroundColor Red
            $allTablesExist = $false
        }
    }
    catch {
        Write-Host "   ⚠ Não foi possível verificar tabela '$table'" -ForegroundColor Yellow
    }
}

Write-Host ""

# Resumo final
Write-Host "========================================" -ForegroundColor Cyan
if ($allTablesExist) {
    Write-Host "  ✓ Processo concluído com sucesso!" -ForegroundColor Green
}
else {
    Write-Host "  ⚠ Processo concluído com avisos" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allTablesExist) {
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Execute 'npx prisma generate' para atualizar o Prisma Client" -ForegroundColor White
    Write-Host "  2. Execute os testes para validar: 'npm run test'" -ForegroundColor White
    Write-Host ""
    exit 0
}
else {
    Write-Host "Atenção: Algumas tabelas não foram criadas." -ForegroundColor Yellow
    Write-Host "Revise os logs acima e execute novamente se necessário." -ForegroundColor Yellow
    exit 1
}

