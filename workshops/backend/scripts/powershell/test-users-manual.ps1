# Script de Teste Manual do Módulo Users
# Execute: .\test-users-manual.ps1

$baseUrl = "http://localhost:3001/api"
$tenantSubdomain = "teste"

Write-Host "🧪 TESTES MANUAIS DO MÓDULO USERS" -ForegroundColor Cyan
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
    Write-Host "✅ Login OK - Token obtido" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Login FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# TESTE 1: Criar usuário
Write-Host "TESTE 1: Criar Usuário" -ForegroundColor Yellow
$createUserBody = @{
    email = "novo.usuario@oficina.com"
    name = "Novo Usuário Teste"
    password = "Senha123"
    role = "technician"
    isActive = $true
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
            'Authorization' = "Bearer $accessToken"
            'X-Tenant-Subdomain' = $tenantSubdomain
        } -Body $createUserBody
    
    Write-Host "✅ Criar Usuário OK - ID: $($response.id)" -ForegroundColor Green
    Write-Host "   Email: $($response.email)" -ForegroundColor Gray
    Write-Host "   Nome: $($response.name)" -ForegroundColor Gray
    Write-Host "   Role: $($response.role)" -ForegroundColor Gray
    $newUserId = $response.id
    Write-Host ""
} catch {
    Write-Host "❌ Criar Usuário FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    $newUserId = $null
}

# TESTE 2: Listar usuários
Write-Host "TESTE 2: Listar Usuários" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users" -Method GET `
        -Headers @{
            'Authorization' = "Bearer $accessToken"
            'X-Tenant-Subdomain' = $tenantSubdomain
        }
    
    Write-Host "✅ Listar Usuários OK - Total: $($response.Count)" -ForegroundColor Green
    foreach ($user in $response) {
        Write-Host "   - $($user.name) ($($user.email)) - $($user.role)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Listar Usuários FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 3: Buscar usuário por ID
if ($newUserId) {
    Write-Host "TESTE 3: Buscar Usuário por ID" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/users/$newUserId" -Method GET `
            -Headers @{
                'Authorization' = "Bearer $accessToken"
                'X-Tenant-Subdomain' = $tenantSubdomain
            }
        
        Write-Host "✅ Buscar Usuário OK" -ForegroundColor Green
        Write-Host "   Email: $($response.email)" -ForegroundColor Gray
        Write-Host "   Nome: $($response.name)" -ForegroundColor Gray
        Write-Host "   Role: $($response.role)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Buscar Usuário FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 4: Atualizar usuário
if ($newUserId) {
    Write-Host "TESTE 4: Atualizar Usuário" -ForegroundColor Yellow
    $updateUserBody = @{
        name = "Usuário Atualizado"
        role = "manager"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/users/$newUserId" -Method PATCH `
            -Headers @{
                'Content-Type' = 'application/json'
                'Authorization' = "Bearer $accessToken"
                'X-Tenant-Subdomain' = $tenantSubdomain
            } -Body $updateUserBody
        
        Write-Host "✅ Atualizar Usuário OK" -ForegroundColor Green
        Write-Host "   Nome atualizado: $($response.name)" -ForegroundColor Gray
        Write-Host "   Role atualizada: $($response.role)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Atualizar Usuário FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 5: Tentar criar usuário com email duplicado
Write-Host "TESTE 5: Tentar Criar Usuário com Email Duplicado" -ForegroundColor Yellow
$duplicateBody = @{
    email = "teste@oficina.com"
    name = "Usuário Duplicado"
    password = "Senha123"
    role = "technician"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users" -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
            'Authorization' = "Bearer $accessToken"
            'X-Tenant-Subdomain' = $tenantSubdomain
        } -Body $duplicateBody
    
    Write-Host "❌ ERRO: Deveria ter falhado!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "✅ Email Duplicado Rejeitado Corretamente (409)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Erro inesperado: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    Write-Host ""
}

# TESTE 6: Remover usuário (soft delete)
if ($newUserId) {
    Write-Host "TESTE 6: Remover Usuário (Soft Delete)" -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$baseUrl/users/$newUserId" -Method DELETE `
            -Headers @{
                'Authorization' = "Bearer $accessToken"
                'X-Tenant-Subdomain' = $tenantSubdomain
            }
        
        Write-Host "✅ Remover Usuário OK (204)" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "❌ Remover Usuário FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# TESTE 7: Listar usuários incluindo inativos
Write-Host "TESTE 7: Listar Usuários (Incluindo Inativos)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users?includeInactive=true" -Method GET `
        -Headers @{
            'Authorization' = "Bearer $accessToken"
            'X-Tenant-Subdomain' = $tenantSubdomain
        }
    
    Write-Host "✅ Listar Usuários (com inativos) OK - Total: $($response.Count)" -ForegroundColor Green
    $inactiveCount = ($response | Where-Object { $_.isActive -eq $false }).Count
    Write-Host "   Inativos: $inactiveCount" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Listar Usuários FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "TODOS OS TESTES CONCLUIDOS!" -ForegroundColor Green

