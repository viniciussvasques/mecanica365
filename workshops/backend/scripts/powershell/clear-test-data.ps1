# Script para limpar dados de teste do banco
Write-Host "`n⚠️  ATENÇÃO: Este script vai limpar dados de teste!`n" -ForegroundColor Yellow
Write-Host "Isso vai deletar:" -ForegroundColor Red
Write-Host "  - Todos os Tenants" -ForegroundColor Red
Write-Host "  - Todos os Usuários" -ForegroundColor Red
Write-Host "  - Todas as Subscriptions" -ForegroundColor Red
Write-Host "  - Todos os Tokens de Refresh" -ForegroundColor Red
Write-Host "`nDeseja continuar? (S/N): " -ForegroundColor Yellow -NoNewline

$confirmation = Read-Host
if ($confirmation -ne "S" -and $confirmation -ne "s") {
    Write-Host "`n❌ Operação cancelada.`n" -ForegroundColor Red
    exit
}

Write-Host "`n🗑️  Limpando banco de dados...`n" -ForegroundColor Cyan

# Limpar dados na ordem correta (respeitando foreign keys)
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"RefreshToken\";" 2>&1 | Out-Null
Write-Host "✅ RefreshTokens deletados" -ForegroundColor Green

docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"User\";" 2>&1 | Out-Null
Write-Host "✅ Usuários deletados" -ForegroundColor Green

docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"Subscription\";" 2>&1 | Out-Null
Write-Host "✅ Subscriptions deletadas" -ForegroundColor Green

docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"Tenant\";" 2>&1 | Out-Null
Write-Host "✅ Tenants deletados" -ForegroundColor Green

# Resetar sequências (opcional, mas ajuda a manter IDs limpos)
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "ALTER SEQUENCE \"Tenant_id_seq\" RESTART WITH 1;" 2>&1 | Out-Null
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "ALTER SEQUENCE \"User_id_seq\" RESTART WITH 1;" 2>&1 | Out-Null
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "ALTER SEQUENCE \"Subscription_id_seq\" RESTART WITH 1;" 2>&1 | Out-Null

Write-Host "`n✅ Banco de dados limpo com sucesso!`n" -ForegroundColor Green
Write-Host "Agora você pode fazer um novo registro.`n" -ForegroundColor Cyan

