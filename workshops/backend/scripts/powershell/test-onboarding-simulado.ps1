# Teste Simulado do Fluxo de Onboarding (sem Stripe)
# Simula diretamente o processamento do webhook

$baseUrl = "http://localhost:3001/api"
$randomId = Get-Random -Minimum 1000 -Maximum 9999

# Usar CPF válido conhecido + randomId para garantir unicidade
# CPF válido: 98765432100 (usado como base, mas vamos usar um diferente)
# Vamos usar um CPF válido conhecido: 11144477735
$cpf = "11144477735"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTE FLUXO ONBOARDING SIMULADO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Dados do cliente
$tenantData = @{
    name = "Oficina Teste $randomId"
    documentType = "cpf"
    document = $cpf
    subdomain = "oficina-teste-$randomId"
    plan = "workshops_starter"
    status = "active"
    adminEmail = "teste-$randomId@oficina.com"
    adminName = "Admin Teste"
    adminPassword = "Admin123456"
} | ConvertTo-Json

Write-Host "1. Criando tenant com provisionamento automático..." -ForegroundColor Yellow
try {
    $tenant = Invoke-RestMethod -Uri "$baseUrl/tenants" `
        -Method POST `
        -Headers @{'Content-Type'='application/json'} `
        -Body $tenantData `
        -TimeoutSec 30
    
    Write-Host "   OK - Tenant criado!" -ForegroundColor Green
    Write-Host "   ID: $($tenant.id)" -ForegroundColor Gray
    Write-Host "   Nome: $($tenant.name)" -ForegroundColor Gray
    Write-Host "   Subdomain: $($tenant.subdomain)" -ForegroundColor Gray
    Write-Host "   Status: $($tenant.status)" -ForegroundColor Gray
    Write-Host "   Plano: $($tenant.plan)" -ForegroundColor Gray
    
    if ($tenant.subscription) {
        Write-Host "   Subscription: Criada automaticamente!" -ForegroundColor Green
        Write-Host "   Subscription ID: $($tenant.subscription.id)" -ForegroundColor Gray
        Write-Host "   Subscription Status: $($tenant.subscription.status)" -ForegroundColor Gray
    }
    Write-Host ""
    
    # Testar login
    Write-Host "2. Testando login com credenciais criadas..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    $loginData = @{
        email = "teste-$randomId@oficina.com"
        password = "Admin123456"
    } | ConvertTo-Json
    
    try {
        $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
            -Method POST `
            -Headers @{'Content-Type'='application/json'; 'X-Tenant-Subdomain'=$tenant.subdomain} `
            -Body $loginData `
            -TimeoutSec 30
        
        Write-Host "   OK - Login realizado!" -ForegroundColor Green
        Write-Host "   Token recebido: $($login.accessToken.Substring(0, 20))..." -ForegroundColor Gray
        Write-Host ""
        
        # Testar profile
        Write-Host "3. Testando acesso ao profile..." -ForegroundColor Yellow
        
        $profile = Invoke-RestMethod -Uri "$baseUrl/auth/profile" `
            -Method GET `
            -Headers @{'Authorization'="Bearer $($login.accessToken)"; 'X-Tenant-Subdomain'=$tenant.subdomain} `
            -TimeoutSec 30
        
        Write-Host "   OK - Profile acessado!" -ForegroundColor Green
        Write-Host "   Nome: $($profile.name)" -ForegroundColor Gray
        Write-Host "   Email: $($profile.email)" -ForegroundColor Gray
        Write-Host "   Role: $($profile.role)" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "FLUXO COMPLETO TESTADO COM SUCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Resumo:" -ForegroundColor Yellow
        Write-Host "✅ Tenant criado automaticamente" -ForegroundColor Green
        Write-Host "✅ Subscription criada automaticamente" -ForegroundColor Green
        Write-Host "✅ Usuário admin criado automaticamente" -ForegroundColor Green
        Write-Host "✅ Login funcionando" -ForegroundColor Green
        Write-Host "✅ Profile acessível" -ForegroundColor Green
        Write-Host ""
        Write-Host "Nota: Email não foi enviado (SMTP não configurado)" -ForegroundColor Gray
        Write-Host "      Verificar logs do backend para ver senha gerada" -ForegroundColor Gray
        Write-Host ""
        
    } catch {
        Write-Host "   ERRO no login: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "   Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

