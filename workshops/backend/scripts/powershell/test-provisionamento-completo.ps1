# Script de Teste - Provisionamento Automático Completo
$baseUrl = "http://localhost:3001/api"

Write-Host "TESTE DE PROVISIONAMENTO AUTOMATICO COMPLETO" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Gerar CNPJ válido (apenas para teste)
# Usar CNPJ válido conhecido: 11222333000181
function Generate-CNPJ {
    $random = Get-Random -Minimum 1000 -Maximum 9999
    # Usar base conhecida e adicionar random no final para evitar duplicatas
    $base = "11222333000"
    $suffix = $random.ToString().PadLeft(3, '0')
    # Calcular dígitos verificadores simples (para teste)
    # Para simplificar, usar 18 como sufixo fixo
    return "11222333000181"
}

# PASSO 1: Criar Tenant
Write-Host "PASSO 1: Criando Tenant com Admin..." -ForegroundColor Yellow
$randomId = Get-Random -Minimum 1000 -Maximum 9999

# Lista de CNPJs válidos para teste
$validCnpjs = @("11222333000181", "22333444000192", "33444555000103", "44555666000114", "55666777000125")

$tenantCreated = $false
foreach ($cnpj in $validCnpjs) {
    $tenantData = @{
        name = "Oficina Automática Teste $randomId"
        cnpj = $cnpj
        subdomain = "oficina-auto-$randomId"
        plan = "workshops_starter"
        status = "pending"
        adminEmail = "admin@oficina-auto-$randomId.com"
        adminName = "Admin Automático"
        adminPassword = "Admin123456"
    } | ConvertTo-Json

    try {
        $tenant = Invoke-RestMethod -Uri "$baseUrl/tenants" -Method POST `
            -Headers @{'Content-Type'='application/json'} -Body $tenantData -TimeoutSec 30
        
        Write-Host "OK - Tenant criado:" -ForegroundColor Green
        Write-Host "   ID: $($tenant.id)" -ForegroundColor Gray
        Write-Host "   Nome: $($tenant.name)" -ForegroundColor Gray
        Write-Host "   Subdomain: $($tenant.subdomain)" -ForegroundColor Gray
        Write-Host "   CNPJ: $cnpj" -ForegroundColor Gray
        
        if ($tenant.subscription) {
            Write-Host "   Subscription: $($tenant.subscription.id) - $($tenant.subscription.plan)" -ForegroundColor Green
        } else {
            Write-Host "   Subscription: (não encontrada no retorno)" -ForegroundColor Yellow
        }
        
        $tenantSubdomain = $tenant.subdomain
        $adminEmail = "admin@oficina-auto-$randomId.com"
        $tenantCreated = $true
        Write-Host ""
        break
    } catch {
        if ($_.Exception.Response.StatusCode -eq 409) {
            # CNPJ já cadastrado, tentar próximo
            continue
        } else {
            Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
            if ($_.ErrorDetails.Message) {
                Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
            }
        }
    }
}

if (-not $tenantCreated) {
    Write-Host "ERRO: Não foi possível criar tenant (todos os CNPJs já cadastrados)" -ForegroundColor Red
    exit 1
}

# PASSO 2: Login
Write-Host "PASSO 2: Fazendo Login com Admin criado..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

$loginData = @{
    email = $adminEmail
    password = "Admin123456"
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST `
        -Headers @{'Content-Type'='application/json'; 'X-Tenant-Subdomain'=$tenantSubdomain} `
        -Body $loginData -TimeoutSec 30
    
    Write-Host "OK - Login realizado!" -ForegroundColor Green
    Write-Host "   Token: $($login.accessToken.Substring(0, 30))..." -ForegroundColor Gray
    $userToken = $login.accessToken
    Write-Host ""
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# PASSO 3: Testar módulos core
Write-Host "PASSO 3: Testando acesso aos módulos core..." -ForegroundColor Yellow
Write-Host ""

$success = 0
$total = 0

# 3.1. Auth Profile
Write-Host "  3.1. Auth - Profile" -ForegroundColor Cyan
$total++
try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method GET `
        -Headers @{'Authorization'="Bearer $userToken"; 'X-Tenant-Subdomain'=$tenantSubdomain} `
        -TimeoutSec 30
    Write-Host "      OK - $($profile.name) ($($profile.email))" -ForegroundColor Green
    $success++
} catch {
    Write-Host "      ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 3.2. Billing Subscription
Write-Host "  3.2. Billing - Subscription" -ForegroundColor Cyan
$total++
try {
    $sub = Invoke-RestMethod -Uri "$baseUrl/billing/subscription" -Method GET `
        -Headers @{'Authorization'="Bearer $userToken"; 'X-Tenant-Subdomain'=$tenantSubdomain} `
        -TimeoutSec 30
    Write-Host "      OK - Plano: $($sub.plan), Status: $($sub.status), Limite ROs: $($sub.serviceOrdersLimit)" -ForegroundColor Green
    $success++
} catch {
    Write-Host "      ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 3.3. Billing Plans
Write-Host "  3.3. Billing - Plans" -ForegroundColor Cyan
$total++
try {
    $plans = Invoke-RestMethod -Uri "$baseUrl/billing/plans" -Method GET `
        -Headers @{'Authorization'="Bearer $userToken"} -TimeoutSec 30
    Write-Host "      OK - $($plans.Count) planos disponíveis" -ForegroundColor Green
    $success++
} catch {
    Write-Host "      ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 3.4. Tenants Me
Write-Host "  3.4. Tenants - Me" -ForegroundColor Cyan
$total++
try {
    $me = Invoke-RestMethod -Uri "$baseUrl/tenants/me" -Method GET `
        -Headers @{'Authorization'="Bearer $userToken"; 'X-Tenant-Subdomain'=$tenantSubdomain} `
        -TimeoutSec 30
    Write-Host "      OK - $($me.name) ($($me.subdomain))" -ForegroundColor Green
    $success++
} catch {
    Write-Host "      ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# 3.5. Users List
Write-Host "  3.5. Users - List" -ForegroundColor Cyan
$total++
try {
    $users = Invoke-RestMethod -Uri "$baseUrl/users" -Method GET `
        -Headers @{'Authorization'="Bearer $userToken"; 'X-Tenant-Subdomain'=$tenantSubdomain} `
        -TimeoutSec 30
    Write-Host "      OK - $($users.Count) usuários" -ForegroundColor Green
    $success++
} catch {
    Write-Host "      ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

# RESUMO
Write-Host ""
Write-Host "RESUMO:" -ForegroundColor Cyan
Write-Host "  Testes passando: $success/$total" -ForegroundColor $(if ($success -eq $total) { "Green" } else { "Yellow" })
Write-Host ""

if ($success -eq $total) {
    Write-Host "PROVISIONAMENTO AUTOMATICO FUNCIONANDO PERFEITAMENTE!" -ForegroundColor Green
    Write-Host "Todos os módulos core estão operacionais!" -ForegroundColor Green
} else {
    Write-Host "Alguns testes falharam. Verifique os erros acima." -ForegroundColor Yellow
}

