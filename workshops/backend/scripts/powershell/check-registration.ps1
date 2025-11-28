# Script para verificar se o registro funcionou
Write-Host "`n🔍 Verificando registro no banco de dados...`n" -ForegroundColor Cyan

# Verificar tenants mais recentes
Write-Host "📊 TENANTS (últimos 3):" -ForegroundColor Yellow
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -t -c "SELECT 'ID: ' || id || ' | Nome: ' || name || ' | Subdomain: ' || subdomain || ' | Status: ' || status || ' | Plano: ' || plan || ' | Criado: ' || \"createdAt\" FROM \"Tenant\" ORDER BY \"createdAt\" DESC LIMIT 3;"

Write-Host "`n👥 USUÁRIOS (últimos 3):" -ForegroundColor Yellow
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -t -c "SELECT 'ID: ' || u.id || ' | Email: ' || u.email || ' | Nome: ' || u.name || ' | Role: ' || u.role || ' | Ativo: ' || u.\"isActive\" || ' | Tenant: ' || t.subdomain FROM \"User\" u JOIN \"Tenant\" t ON u.\"tenantId\" = t.id ORDER BY u.\"createdAt\" DESC LIMIT 3;"

Write-Host "`n💳 SUBSCRIPTIONS (últimas 3):" -ForegroundColor Yellow
docker exec mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db -t -c "SELECT 'ID: ' || s.id || ' | Tenant: ' || t.subdomain || ' | Plano: ' || s.plan || ' | Status: ' || s.status || ' | Ciclo: ' || s.\"billingCycle\" FROM \"Subscription\" s JOIN \"Tenant\" t ON s.\"tenantId\" = t.id ORDER BY s.\"createdAt\" DESC LIMIT 3;"

Write-Host "`n✅ Verificação concluída!`n" -ForegroundColor Green

