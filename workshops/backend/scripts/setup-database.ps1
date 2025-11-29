# Script automatizado para setup completo do banco de dados (PowerShell)
# Inclui: migrations, seeds e validações

Write-Host "🚀 Iniciando setup do banco de dados..." -ForegroundColor Cyan

# Verificar se Docker está rodando
try {
    docker ps | Out-Null
} catch {
    Write-Host "❌ Docker não está rodando. Por favor, inicie o Docker primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se containers estão rodando
$postgresRunning = docker-compose ps | Select-String "mecanica365-workshops-postgres.*Up"
if (-not $postgresRunning) {
    Write-Host "⚠️  Container do PostgreSQL não está rodando. Iniciando..." -ForegroundColor Yellow
    docker-compose up -d postgres
    Write-Host "⏳ Aguardando PostgreSQL iniciar..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host "✅ PostgreSQL está rodando" -ForegroundColor Green

# Aplicar migrations
Write-Host "`n📦 Aplicando migrations..." -ForegroundColor Yellow
Get-Content prisma/migrations/20241216000000_add_quotes_module/migration_complete.sql | docker-compose exec -T postgres psql -U mecanica365 -d mecanica365_db
Get-Content prisma/migrations/20241229000000_add_problem_diagnosis_fields/migration_partial.sql | docker-compose exec -T postgres psql -U mecanica365 -d mecanica365_db

Write-Host "✅ Migrations aplicadas" -ForegroundColor Green

# Executar seed de problemas comuns
Write-Host "`n🌱 Executando seed de problemas comuns..." -ForegroundColor Yellow
docker-compose exec backend npx ts-node prisma/seeds/index.ts

Write-Host "✅ Seed executado" -ForegroundColor Green

# Validar setup
Write-Host "`n🔍 Validando setup..." -ForegroundColor Yellow

# Verificar se tabelas existem
$tables = @("quotes", "quote_items", "service_orders", "common_problems")
foreach ($table in $tables) {
    $result = docker-compose exec -T postgres psql -U mecanica365 -d mecanica365_db -c "\d $table" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tabela $table existe" -ForegroundColor Green
    } else {
        Write-Host "❌ Tabela $table não existe" -ForegroundColor Red
    }
}

# Verificar se problemas comuns foram criados
$problemCount = docker-compose exec -T postgres psql -U mecanica365 -d mecanica365_db -t -c "SELECT COUNT(*) FROM common_problems;" | ForEach-Object { $_.Trim() }
if ([int]$problemCount -gt 0) {
    Write-Host "✅ $problemCount problemas comuns cadastrados" -ForegroundColor Green
} else {
    Write-Host "⚠️  Nenhum problema comum encontrado" -ForegroundColor Yellow
}

Write-Host "`n🎉 Setup do banco de dados concluído!" -ForegroundColor Green

