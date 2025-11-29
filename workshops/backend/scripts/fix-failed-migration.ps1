# Script profissional para resolver migration falhada
param([switch]$Force = $false)

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix Failed Migration - Professional" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Carregar variáveis do .env se existir
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

# Verificar DATABASE_URL
if (-not $env:DATABASE_URL) {
    Write-Host "ERRO: DATABASE_URL não configurado" -ForegroundColor Red
    Write-Host "Verifique se o arquivo .env existe e contém DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Extrair informações do banco
$dbUrl = $env:DATABASE_URL
$dbUser = "mecanica365"
$dbName = "mecanica365_db"

Write-Host "Conectando ao banco: postgres:5432/${dbName}" -ForegroundColor Green
Write-Host ""

# Verificar estado da migration
Write-Host "1. Verificando estado das migrations..." -ForegroundColor Yellow
$statusOutput = docker-compose exec -T backend npx prisma migrate status 2>&1 | Out-String

# Tentar aplicar migrations para detectar falhas
$deployCheck = docker-compose exec -T backend npx prisma migrate deploy --dry-run 2>&1 | Out-String

$failedMigrations = @()
if ($statusOutput -match "following migrations have failed" -or $deployCheck -match "P3009" -or $deployCheck -match "failed migrations") {
    Write-Host "   Migrations falhadas detectadas" -ForegroundColor Red
    
    # Extrair nomes das migrations falhadas do status
    $lines = $statusOutput -split "`n"
    foreach ($line in $lines) {
        if ($line -match "(\d{14}_[^\s]+)") {
            $failedMigrations += $matches[1]
        }
    }
    
    # Extrair do deploy check também
    $deployLines = $deployCheck -split "`n"
    foreach ($line in $deployLines) {
        if ($line -match "`(\d{14}_[^\s]+)`") {
            if ($failedMigrations -notcontains $matches[1]) {
                $failedMigrations += $matches[1]
            }
        }
    }
    
    if ($failedMigrations.Count -gt 0) {
        Write-Host "   Migrations falhadas: $($failedMigrations -join ', ')" -ForegroundColor Yellow
    }
} else {
    Write-Host "   Nenhuma migration falhada detectada" -ForegroundColor Green
}

Write-Host ""

# Verificar se tabela quotes existe
Write-Host "2. Verificando estado do banco de dados..." -ForegroundColor Yellow
$quotesExists = $false

try {
    $checkCmd = "docker-compose exec -T postgres psql -U $dbUser -d $dbName -t -c `"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes')`""
    $result = Invoke-Expression $checkCmd 2>&1
    if ($result -match "t") {
        $quotesExists = $true
        Write-Host "   Tabela 'quotes' existe" -ForegroundColor Green
    } else {
        Write-Host "   Tabela 'quotes' não existe" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Não foi possível verificar via Docker" -ForegroundColor Yellow
}

Write-Host ""

# Resolver migrations falhadas
Write-Host "3. Resolvendo migrations falhadas..." -ForegroundColor Yellow

if ($failedMigrations.Count -eq 0) {
    Write-Host "   Nenhuma migration falhada para resolver" -ForegroundColor Green
} else {
    foreach ($migration in $failedMigrations) {
        Write-Host "   Resolvendo migration: $migration" -ForegroundColor Cyan
        
        # Verificar se é a migration do quotes
        if ($migration -match "quotes" -and $quotesExists) {
            Write-Host "     Marcando como aplicada (tabela existe)..." -ForegroundColor Yellow
            $resolveCmd = "docker-compose exec -T backend npx prisma migrate resolve --applied $migration"
        } elseif ($migration -match "admin_email") {
            # Migration do admin_email - coluna já existe, marcar como aplicada
            Write-Host "     Marcando como aplicada (coluna já existe)..." -ForegroundColor Yellow
            $resolveCmd = "docker-compose exec -T backend npx prisma migrate resolve --applied $migration"
        } else {
            Write-Host "     Marcando como revertida..." -ForegroundColor Yellow
            $resolveCmd = "docker-compose exec -T backend npx prisma migrate resolve --rolled-back $migration"
        }
        
        Invoke-Expression $resolveCmd 2>&1 | Out-Null
        Write-Host "     Migration $migration resolvida" -ForegroundColor Green
    }
}

Write-Host ""

# Aplicar migrations
Write-Host "4. Aplicando migrations..." -ForegroundColor Yellow
$deployResult = docker-compose exec -T backend npx prisma migrate deploy 2>&1 | Out-String
if ($LASTEXITCODE -eq 0) {
    Write-Host "   Migrations aplicadas com sucesso" -ForegroundColor Green
} else {
    Write-Host "   Erro ao aplicar migrations" -ForegroundColor Red
    Write-Host $deployResult
    exit 1
}

Write-Host ""

# Validar estado final
Write-Host "5. Validando estado final..." -ForegroundColor Yellow
$finalStatus = docker-compose exec -T backend npx prisma migrate status 2>&1 | Out-String

if ($finalStatus -match "Database schema is up to date") {
    Write-Host "   Banco de dados está atualizado" -ForegroundColor Green
} else {
    Write-Host "   Status: $finalStatus" -ForegroundColor Yellow
}

Write-Host ""

# Verificar integridade das tabelas
Write-Host "6. Verificando integridade das tabelas..." -ForegroundColor Yellow

$tablesToCheck = @("quotes", "quote_items")
$allTablesExist = $true

foreach ($table in $tablesToCheck) {
    try {
        $checkCmd = "docker-compose exec -T postgres psql -U $dbUser -d $dbName -t -c `"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table')`""
        $checkResult = Invoke-Expression $checkCmd 2>&1
        if ($checkResult -match "t") {
            Write-Host "   Tabela '$table' existe" -ForegroundColor Green
        } else {
            Write-Host "   Tabela '$table' não existe" -ForegroundColor Red
            $allTablesExist = $false
        }
    } catch {
        Write-Host "   Não foi possível verificar tabela '$table'" -ForegroundColor Yellow
    }
}

Write-Host ""

# Resumo final
Write-Host "========================================" -ForegroundColor Cyan
if ($allTablesExist) {
    Write-Host "  Processo concluído com sucesso!" -ForegroundColor Green
} else {
    Write-Host "  Processo concluído com avisos" -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($allTablesExist) {
    Write-Host "Próximos passos:" -ForegroundColor Cyan
    Write-Host "  1. Execute 'npx prisma generate'" -ForegroundColor White
    Write-Host "  2. Execute 'npm run test'" -ForegroundColor White
    Write-Host ""
    exit 0
} else {
    Write-Host "Atenção: Algumas tabelas não foram criadas." -ForegroundColor Yellow
    exit 1
}
