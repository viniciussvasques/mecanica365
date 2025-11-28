# Script para verificar e limpar banco
$output = @()

Write-Host "`n🔍 Verificando banco...`n" -ForegroundColor Cyan

# Verificar dados atuais
$tenants = docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -t -A -c "SELECT COUNT(*) FROM \"Tenant\";" 2>&1
$users = docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -t -A -c "SELECT COUNT(*) FROM \"User\";" 2>&1
$subscriptions = docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -t -A -c "SELECT COUNT(*) FROM \"Subscription\";" 2>&1

Write-Host "Tenants: $tenants" -ForegroundColor White
Write-Host "Users: $users" -ForegroundColor White
Write-Host "Subscriptions: $subscriptions`n" -ForegroundColor White

# Limpar
Write-Host "🗑️  Limpando banco...`n" -ForegroundColor Yellow

docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"RefreshToken\";" 2>&1 | Out-Null
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"User\";" 2>&1 | Out-Null
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"Subscription\";" 2>&1 | Out-Null
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"Tenant\";" 2>&1 | Out-Null

# Resetar sequências
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "ALTER SEQUENCE \"Tenant_id_seq\" RESTART WITH 1;" 2>&1 | Out-Null
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "ALTER SEQUENCE \"User_id_seq\" RESTART WITH 1;" 2>&1 | Out-Null
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "ALTER SEQUENCE \"Subscription_id_seq\" RESTART WITH 1;" 2>&1 | Out-Null

# Verificar depois
Write-Host "✅ Verificando limpeza...`n" -ForegroundColor Green
$tenantsAfter = docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -t -A -c "SELECT COUNT(*) FROM \"Tenant\";" 2>&1
$usersAfter = docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -t -A -c "SELECT COUNT(*) FROM \"User\";" 2>&1
$subscriptionsAfter = docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -t -A -c "SELECT COUNT(*) FROM \"Subscription\";" 2>&1

Write-Host "Tenants: $tenantsAfter" -ForegroundColor White
Write-Host "Users: $usersAfter" -ForegroundColor White
Write-Host "Subscriptions: $subscriptionsAfter`n" -ForegroundColor White

Write-Host "✅ Banco limpo!`n" -ForegroundColor Green


