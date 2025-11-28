# Script de Teste Manual do Módulo Tenants
# Execute: .\test-tenants-manual.ps1

$baseUrl = "http://localhost:3001/api"
$tenantSubdomain = "teste"

Write-Host "TESTES MANUAIS DO MODULO TENANTS" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Primeiro, fazer login como admin
Write-Host "1. Fazendo login como admin..." -ForegroundColor Yellow
$loginBody = @{
    email = "teste@oficina.com"
    password = "TestPassword123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
            'X-Tenant-Subdomain' = $tenantSubdomain
        } -Body $loginBody
    
    $accessToken = $loginResponse.accessToken
    Write-Host "OK - Token obtido" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# TESTE 1: Criar tenant
Write-Host "TESTE 1: Criar Tenant" -ForegroundColor Yellow
$createTenantBody = @{
    name = "Oficina Teste Manual"
    cnpj = "11222333000181"
    subdomain = "oficina-teste-manual"
    plan = "workshops_starter"
    status = "pending"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/tenants" -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
        } -Body $createTenantBody
    
    Write-Host "OK - ID: $($response.id)" -ForegroundColor Green
    Write-Host "   Nome: $($response.name)" -ForegroundColor Gray
    Write-Host "   CNPJ: $($response.cnpj)" -ForegroundColor Gray
    Write-Host "   Subdomain: $($response.subdomain)" -ForegroundColor Gray
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    $newTenantId = $response.id
    Write-Host ""
} catch {
    Write-Host "FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    $newTenantId = $null
}

# TESTE 2: Listar tenants (admin)
Write-Host "TESTE 2: Listar Todos os Tenants (Admin)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/tenants" -Method GET `
        -Headers @{
            'Authorization' = "Bearer $accessToken"
        }
    
    Write-Host "OK - Total: $($response.Count)" -ForegroundColor Green
    foreach ($tenant in $response) {
        Write-Host "   - $($tenant.name) ($($tenant.subdomain)) - $($tenant.status)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 3: Buscar tenant atual
Write-Host "TESTE 3: Buscar Tenant Atual (me)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/tenants/me" -Method GET `
        -Headers @{
            'Authorization' = "Bearer $accessToken"
            'X-Tenant-Subdomain' = $tenantSubdomain
        }
    
    Write-Host "OK - Nome: $($response.name)" -ForegroundColor Green
    Write-Host "   Subdomain: $($response.subdomain)" -ForegroundColor Gray
    Write-Host "   Status: $($response.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 4: Buscar por subdomain
if ($newTenantId) {
    Write-Host "TESTE 4: Buscar Tenant por Subdomain" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/tenants/subdomain/oficina-teste-manual" -Method GET
        
        Write-Host "OK - Nome: $($response.name)" -ForegroundColor Green
        Write-Host "   Subdomain: $($response.subdomain)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 5: Buscar por ID
if ($newTenantId) {
    Write-Host "TESTE 5: Buscar Tenant por ID" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/tenants/$newTenantId" -Method GET `
            -Headers @{
                'Authorization' = "Bearer $accessToken"
            }
        
        Write-Host "OK - Nome: $($response.name)" -ForegroundColor Green
        Write-Host "   ID: $($response.id)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 6: Atualizar tenant
if ($newTenantId) {
    Write-Host "TESTE 6: Atualizar Tenant" -ForegroundColor Yellow
    $updateBody = @{
        name = "Oficina Atualizada"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/tenants/$newTenantId" -Method PATCH `
            -Headers @{
                'Content-Type' = 'application/json'
                'Authorization' = "Bearer $accessToken"
            } -Body $updateBody
        
        Write-Host "OK - Nome atualizado: $($response.name)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 7: Ativar tenant
if ($newTenantId) {
    Write-Host "TESTE 7: Ativar Tenant" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/tenants/$newTenantId/activate" -Method POST `
            -Headers @{
                'Authorization' = "Bearer $accessToken"
            }
        
        Write-Host "OK - Status: $($response.status)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 8: Suspender tenant
if ($newTenantId) {
    Write-Host "TESTE 8: Suspender Tenant" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/tenants/$newTenantId/suspend" -Method POST `
            -Headers @{
                'Authorization' = "Bearer $accessToken"
            }
        
        Write-Host "OK - Status: $($response.status)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 9: Cancelar tenant
if ($newTenantId) {
    Write-Host "TESTE 9: Cancelar Tenant" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/tenants/$newTenantId/cancel" -Method POST `
            -Headers @{
                'Authorization' = "Bearer $accessToken"
            }
        
        Write-Host "OK - Status: $($response.status)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 10: Tentar criar tenant com CNPJ duplicado
Write-Host "TESTE 10: Tentar Criar Tenant com CNPJ Duplicado" -ForegroundColor Yellow
$duplicateBody = @{
    name = "Duplicate CNPJ"
    cnpj = "11222333000181"
    subdomain = "duplicate-cnpj"
    plan = "workshops_starter"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/tenants" -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
        } -Body $duplicateBody
    
    Write-Host "ERRO: Deveria ter falhado!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "OK - CNPJ duplicado rejeitado corretamente (409)" -ForegroundColor Green
    } else {
        Write-Host "Erro inesperado: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host "TODOS OS TESTES CONCLUIDOS!" -ForegroundColor Green

