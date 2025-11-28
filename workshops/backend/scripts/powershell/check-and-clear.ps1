# Script para verificar e limpar banco
Write-Host "`n🔍 Verificando containers...`n" -ForegroundColor Cyan

# Verificar se containers estão rodando
$backend = docker ps --filter "name=backend" --format "{{.Names}}"
$postgres = docker ps --filter "name=postgres" --format "{{.Names}}"

if (-not $backend) {
    Write-Host "❌ Container backend não está rodando!" -ForegroundColor Red
    exit 1
}

if (-not $postgres) {
    Write-Host "❌ Container postgres não está rodando!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Containers encontrados: $backend, $postgres`n" -ForegroundColor Green

# Verificar dados atuais
Write-Host "📊 DADOS ATUAIS:" -ForegroundColor Yellow
$tenants = docker exec $postgres psql -U mecanica365 -d mecanica365_db -t -c "SELECT COUNT(*) FROM \"Tenant\";" 2>&1
$users = docker exec $postgres psql -U mecanica365 -d mecanica365_db -t -c "SELECT COUNT(*) FROM \"User\";" 2>&1
$subscriptions = docker exec $postgres psql -U mecanica365 -d mecanica365_db -t -c "SELECT COUNT(*) FROM \"Subscription\";" 2>&1

Write-Host "Tenants: $tenants" -ForegroundColor White
Write-Host "Users: $users" -ForegroundColor White
Write-Host "Subscriptions: $subscriptions`n" -ForegroundColor White

# Limpar banco
Write-Host "🗑️  Limpando banco de dados...`n" -ForegroundColor Cyan

docker exec $postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"RefreshToken\";" 2>&1 | Out-Null
docker exec $postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"User\";" 2>&1 | Out-Null
docker exec $postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"Subscription\";" 2>&1 | Out-Null
docker exec $postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"Tenant\";" 2>&1 | Out-Null

# Resetar sequências
docker exec $postgres psql -U mecanica365 -d mecanica365_db -c "ALTER SEQUENCE \"Tenant_id_seq\" RESTART WITH 1;" 2>&1 | Out-Null
docker exec $postgres psql -U mecanica365 -d mecanica365_db -c "ALTER SEQUENCE \"User_id_seq\" RESTART WITH 1;" 2>&1 | Out-Null
docker exec $postgres psql -U mecanica365 -d mecanica365_db -c "ALTER SEQUENCE \"Subscription_id_seq\" RESTART WITH 1;" 2>&1 | Out-Null

# Verificar se foi limpo
Write-Host "✅ Verificando limpeza...`n" -ForegroundColor Green
$tenantsAfter = docker exec $postgres psql -U mecanica365 -d mecanica365_db -t -c "SELECT COUNT(*) FROM \"Tenant\";" 2>&1
$usersAfter = docker exec $postgres psql -U mecanica365 -d mecanica365_db -t -c "SELECT COUNT(*) FROM \"User\";" 2>&1
$subscriptionsAfter = docker exec $postgres psql -U mecanica365 -d mecanica365_db -t -c "SELECT COUNT(*) FROM \"Subscription\";" 2>&1

Write-Host "Tenants: $tenantsAfter" -ForegroundColor White
Write-Host "Users: $usersAfter" -ForegroundColor White
Write-Host "Subscriptions: $subscriptionsAfter`n" -ForegroundColor White

Write-Host "✅ Banco limpo!`n" -ForegroundColor Green

# Mostrar logs do backend
Write-Host "📋 ÚLTIMOS LOGS DO BACKEND:`n" -ForegroundColor Yellow
docker logs --tail 50 $backend 2>&1

