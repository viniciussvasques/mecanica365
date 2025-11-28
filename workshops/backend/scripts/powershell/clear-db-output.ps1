# Script para limpar banco e mostrar logs
$outputFile = "docker-output.txt"

Write-Host "`n🔍 Verificando e limpando banco...`n" -ForegroundColor Cyan

# Verificar containers
docker ps --filter "name=backend" --format "{{.Names}}" | Out-File -FilePath $outputFile -Append
docker ps --filter "name=postgres" --format "{{.Names}}" | Out-File -FilePath $outputFile -Append

# Verificar dados antes
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "SELECT COUNT(*) as tenants FROM \"Tenant\";" 2>&1 | Out-File -FilePath $outputFile -Append
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "SELECT COUNT(*) as users FROM \"User\";" 2>&1 | Out-File -FilePath $outputFile -Append

# Limpar
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "DELETE FROM \"RefreshToken\"; DELETE FROM \"User\"; DELETE FROM \"Subscription\"; DELETE FROM \"Tenant\";" 2>&1 | Out-File -FilePath $outputFile -Append

# Resetar sequências
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "ALTER SEQUENCE \"Tenant_id_seq\" RESTART WITH 1; ALTER SEQUENCE \"User_id_seq\" RESTART WITH 1; ALTER SEQUENCE \"Subscription_id_seq\" RESTART WITH 1;" 2>&1 | Out-File -FilePath $outputFile -Append

# Verificar depois
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -c "SELECT COUNT(*) as tenants FROM \"Tenant\";" 2>&1 | Out-File -FilePath $outputFile -Append

# Logs do backend
docker logs --tail 100 mecanica365-workshops-backend 2>&1 | Out-File -FilePath $outputFile -Append

# Mostrar conteúdo
Get-Content $outputFile
Remove-Item $outputFile

