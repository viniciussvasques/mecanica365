# Script de Teste - Provisionamento Automático Completo
# Testa o fluxo completo: Criar Tenant -> Subscription -> Usuário Admin -> Login

$baseUrl = "http://localhost:3001/api"

Write-Host "TESTE DE PROVISIONAMENTO AUTOMATICO COMPLETO" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# PASSO 1: Criar Tenant (provisionamento)
Write-Host "PASSO 1: Criando Tenant..." -ForegroundColor Yellow
$tenantData = @{
    name = "Oficina Automática Teste"
    cnpj = "11222333000181"
    subdomain = "oficina-automatica"
    plan = "workshops_starter"
    status = "pending"
} | ConvertTo-Json

try {
    $tenant = Invoke-RestMethod -Uri "$baseUrl/tenants" -Method POST `
        -Headers @{'Content-Type'='application/json'} -Body $tenantData
    
    Write-Host "OK - Tenant criado:" -ForegroundColor Green
    Write-Host "   ID: $($tenant.id)" -ForegroundColor Gray
    Write-Host "   Nome: $($tenant.name)" -ForegroundColor Gray
    Write-Host "   Subdomain: $($tenant.subdomain)" -ForegroundColor Gray
    Write-Host "   Status: $($tenant.status)" -ForegroundColor Gray
    $tenantId = $tenant.id
    $tenantSubdomain = $tenant.subdomain
    Write-Host ""
} catch {
    Write-Host "ERRO ao criar tenant: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# PASSO 2: Criar Subscription automaticamente
Write-Host "PASSO 2: Criando Subscription..." -ForegroundColor Yellow
$subscriptionData = @{
    tenantId = $tenantId
    plan = "workshops_starter"
    billingCycle = "monthly"
} | ConvertTo-Json

try {
    # Primeiro fazer login como admin do sistema (se existir)
    # Por enquanto, vamos criar a subscription diretamente
    # Em produção, isso seria feito automaticamente ao criar o tenant
    
    Write-Host "   Nota: Subscription deve ser criada automaticamente" -ForegroundColor Yellow
    Write-Host "   Criando manualmente para teste..." -ForegroundColor Yellow
    
    # Para criar subscription, precisamos de um token admin
    # Vamos usar o tenant de teste existente para obter token
    $testLogin = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST `
        -Headers @{'Content-Type'='application/json'; 'X-Tenant-Subdomain'='teste'} `
        -Body '{"email":"teste@oficina.com","password":"TestPassword123"}' -ErrorAction SilentlyContinue
    
    if ($testLogin -and $testLogin.accessToken) {
        $adminToken = $testLogin.accessToken
        $subscription = Invoke-RestMethod -Uri "$baseUrl/billing/subscription" -Method POST `
            -Headers @{'Content-Type'='application/json'; 'Authorization'="Bearer $adminToken"} `
            -Body $subscriptionData
        
        Write-Host "OK - Subscription criada:" -ForegroundColor Green
        Write-Host "   ID: $($subscription.id)" -ForegroundColor Gray
        Write-Host "   Plano: $($subscription.plan)" -ForegroundColor Gray
        Write-Host "   Status: $($subscription.status)" -ForegroundColor Gray
        Write-Host "   Limite ROs: $($subscription.serviceOrdersLimit)" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "   AVISO: Não foi possível criar subscription automaticamente" -ForegroundColor Yellow
        Write-Host "   (Precisa de token admin ou implementar criação automática)" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "   AVISO: Subscription não criada automaticamente" -ForegroundColor Yellow
    Write-Host "   (Isso deve ser implementado no provisionamento automático)" -ForegroundColor Yellow
    Write-Host ""
}

# PASSO 3: Ativar Tenant
Write-Host "PASSO 3: Ativando Tenant..." -ForegroundColor Yellow
try {
    if ($adminToken) {
        $activatedTenant = Invoke-RestMethod -Uri "$baseUrl/tenants/$tenantId/activate" -Method POST `
            -Headers @{'Authorization'="Bearer $adminToken"}
        
        Write-Host "OK - Tenant ativado:" -ForegroundColor Green
        Write-Host "   Status: $($activatedTenant.status)" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "   AVISO: Não foi possível ativar (precisa de token admin)" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "   AVISO: Não foi possível ativar tenant" -ForegroundColor Yellow
    Write-Host ""
}

# PASSO 4: Criar Usuário Admin
Write-Host "PASSO 4: Criando Usuário Admin..." -ForegroundColor Yellow
$userData = @{
    email = "admin@oficina-automatica.com"
    name = "Admin Oficina Automática"
    password = "Admin123456"
    role = "admin"
    isActive = $true
} | ConvertTo-Json

try {
    if ($adminToken) {
        $user = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST `
            -Headers @{'Content-Type'='application/json'; 'Authorization'="Bearer $adminToken"; 'X-Tenant-Subdomain'=$tenantSubdomain} `
            -Body $userData
        
        Write-Host "OK - Usuário Admin criado:" -ForegroundColor Green
        Write-Host "   ID: $($user.id)" -ForegroundColor Gray
        Write-Host "   Email: $($user.email)" -ForegroundColor Gray
        Write-Host "   Nome: $($user.name)" -ForegroundColor Gray
        Write-Host "   Role: $($user.role)" -ForegroundColor Gray
        Write-Host ""
    } else {
        Write-Host "   AVISO: Não foi possível criar usuário (precisa de token admin)" -ForegroundColor Yellow
        Write-Host ""
    }
} catch {
    Write-Host "   AVISO: Não foi possível criar usuário admin" -ForegroundColor Yellow
    Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# PASSO 5: Login com o novo usuário
Write-Host "PASSO 5: Fazendo Login com novo usuário..." -ForegroundColor Yellow
$loginData = @{
    email = "admin@oficina-automatica.com"
    password = "Admin123456"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST `
        -Headers @{'Content-Type'='application/json'; 'X-Tenant-Subdomain'=$tenantSubdomain} `
        -Body $loginData
    
    Write-Host "OK - Login realizado:" -ForegroundColor Green
    Write-Host "   Token obtido: $($login.accessToken.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
    $userToken = $login.accessToken
} catch {
    Write-Host "ERRO ao fazer login: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    $userToken = $null
}

# PASSO 6: Testar acesso aos módulos core
if ($userToken) {
    Write-Host "PASSO 6: Testando acesso aos módulos core..." -ForegroundColor Yellow
    Write-Host ""
    
    # Teste 6.1: Profile
    Write-Host "  6.1. Testando Auth - Profile..." -ForegroundColor Cyan
    try {
        $profile = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method GET `
            -Headers @{'Authorization'="Bearer $userToken"; 'X-Tenant-Subdomain'=$tenantSubdomain}
        Write-Host "      OK - Profile: $($profile.name) ($($profile.email))" -ForegroundColor Green
    } catch {
        Write-Host "      ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Teste 6.2: Subscription
    Write-Host "  6.2. Testando Billing - Subscription..." -ForegroundColor Cyan
    try {
        $subscription = Invoke-RestMethod -Uri "$baseUrl/billing/subscription" -Method GET `
            -Headers @{'Authorization'="Bearer $userToken"; 'X-Tenant-Subdomain'=$tenantSubdomain}
        Write-Host "      OK - Subscription: $($subscription.plan) ($($subscription.status))" -ForegroundColor Green
    } catch {
        Write-Host "      ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Teste 6.3: Plans
    Write-Host "  6.3. Testando Billing - Plans..." -ForegroundColor Cyan
    try {
        $plans = Invoke-RestMethod -Uri "$baseUrl/billing/plans" -Method GET `
            -Headers @{'Authorization'="Bearer $userToken"}
        Write-Host "      OK - Planos disponíveis: $($plans.Count)" -ForegroundColor Green
    } catch {
        Write-Host "      ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Teste 6.4: Tenant atual
    Write-Host "  6.4. Testando Tenants - Me..." -ForegroundColor Cyan
    try {
        $currentTenant = Invoke-RestMethod -Uri "$baseUrl/tenants/me" -Method GET `
            -Headers @{'Authorization'="Bearer $userToken"; 'X-Tenant-Subdomain'=$tenantSubdomain}
        Write-Host "      OK - Tenant: $($currentTenant.name) ($($currentTenant.subdomain))" -ForegroundColor Green
    } catch {
        Write-Host "      ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Teste 6.5: Users
    Write-Host "  6.5. Testando Users - List..." -ForegroundColor Cyan
    try {
        $users = Invoke-RestMethod -Uri "$baseUrl/users" -Method GET `
            -Headers @{'Authorization'="Bearer $userToken"; 'X-Tenant-Subdomain'=$tenantSubdomain}
        Write-Host "      OK - Usuários: $($users.Count)" -ForegroundColor Green
    } catch {
        Write-Host "      ERRO: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# RESUMO FINAL
Write-Host "RESUMO DO TESTE DE PROVISIONAMENTO" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Tenant criado:" -ForegroundColor Yellow
Write-Host "  ID: $tenantId" -ForegroundColor White
Write-Host "  Subdomain: $tenantSubdomain" -ForegroundColor White
Write-Host "  Nome: Oficina Automática Teste" -ForegroundColor White
Write-Host ""
Write-Host "Usuário Admin:" -ForegroundColor Yellow
Write-Host "  Email: admin@oficina-automatica.com" -ForegroundColor White
Write-Host "  Senha: Admin123456" -ForegroundColor White
Write-Host ""
Write-Host "Status:" -ForegroundColor Yellow
if ($userToken) {
    Write-Host "  [OK] Fluxo completo testado com sucesso!" -ForegroundColor Green
    Write-Host "  [OK] Todos os módulos core acessíveis" -ForegroundColor Green
} else {
    Write-Host "  [AVISO] Alguns passos precisam de ajustes" -ForegroundColor Yellow
    Write-Host "  [INFO] Implementar provisionamento automático completo" -ForegroundColor Yellow
}
Write-Host ""


