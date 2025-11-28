Write-Host "Limpando banco de dados..." -ForegroundColor Yellow

$sql = @"
DELETE FROM "RefreshToken";
DELETE FROM "User";
DELETE FROM "Subscription";
DELETE FROM "Tenant";
ALTER SEQUENCE "Tenant_id_seq" RESTART WITH 1;
ALTER SEQUENCE "User_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Subscription_id_seq" RESTART WITH 1;
"@

$sql | docker exec -i mecanica365-workshops-postgres psql -U mecanica365 -d mecanica365_db

Write-Host "Banco limpo!" -ForegroundColor Green

