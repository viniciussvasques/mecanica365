# Script de Teste Manual do Módulo Auth
# Execute: .\test-auth-manual.ps1

$baseUrl = "http://localhost:3001/api"
$tenantSubdomain = "teste"

Write-Host "🧪 TESTES MANUAIS DO MÓDULO AUTH" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# TESTE 1: Login
Write-Host "TESTE 1: Login" -ForegroundColor Yellow
$loginBody = @{
    email = "teste@oficina.com"
    password = "TestPassword123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
            'X-Tenant-Subdomain' = $tenantSubdomain
        } `
        -Body $loginBody -UseBasicParsing
    
    Write-Host "✅ Login OK - Status: $($response.StatusCode)" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "   AccessToken: $($result.accessToken.Substring(0,50))..." -ForegroundColor Gray
    Write-Host "   RefreshToken: $($result.refreshToken)" -ForegroundColor Gray
    Write-Host "   User: $($result.user.email)" -ForegroundColor Gray
    
    $script:accessToken = $result.accessToken
    $script:refreshToken = $result.refreshToken
    Write-Host ""
} catch {
    Write-Host "❌ Login FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}

# TESTE 2: Profile
Write-Host "TESTE 2: Obter Perfil" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/profile" -Method GET `
        -Headers @{
            'Authorization' = "Bearer $script:accessToken"
            'X-Tenant-Subdomain' = $tenantSubdomain
        } -UseBasicParsing
    
    Write-Host "✅ Profile OK - Status: $($response.StatusCode)" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "   Email: $($result.email)" -ForegroundColor Gray
    Write-Host "   Name: $($result.name)" -ForegroundColor Gray
    Write-Host "   Role: $($result.role)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Profile FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 3: Refresh Token
Write-Host "TESTE 3: Refresh Token" -ForegroundColor Yellow
$refreshBody = @{
    refreshToken = $script:refreshToken
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/refresh" -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
            'X-Tenant-Subdomain' = $tenantSubdomain
        } `
        -Body $refreshBody -UseBasicParsing
    
    Write-Host "✅ Refresh OK - Status: $($response.StatusCode)" -ForegroundColor Green
    $result = $response.Content | ConvertFrom-Json
    Write-Host "   Novo AccessToken: $($result.accessToken.Substring(0,50))..." -ForegroundColor Gray
    Write-Host "   Novo RefreshToken: $($result.refreshToken)" -ForegroundColor Gray
    
    $script:accessToken = $result.accessToken
    $script:refreshToken = $result.refreshToken
    Write-Host ""
} catch {
    Write-Host "❌ Refresh FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 4: Change Password
Write-Host "TESTE 4: Alterar Senha" -ForegroundColor Yellow
$changePasswordBody = @{
    currentPassword = "TestPassword123"
    newPassword = "NewPassword123"
    confirmPassword = "NewPassword123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/change-password" -Method PATCH `
        -Headers @{
            'Content-Type' = 'application/json'
            'Authorization' = "Bearer $script:accessToken"
            'X-Tenant-Subdomain' = $tenantSubdomain
        } `
        -Body $changePasswordBody -UseBasicParsing
    
    Write-Host "✅ Change Password OK - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Change Password FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}

# TESTE 5: Logout
Write-Host "TESTE 5: Logout" -ForegroundColor Yellow
$logoutBody = @{
    refreshToken = $script:refreshToken
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$baseUrl/auth/logout" -Method POST `
        -Headers @{
            'Content-Type' = 'application/json'
            'Authorization' = "Bearer $script:accessToken"
            'X-Tenant-Subdomain' = $tenantSubdomain
        } `
        -Body $logoutBody -UseBasicParsing
    
    Write-Host "✅ Logout OK - Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Logout FALHOU: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "✅ TODOS OS TESTES CONCLUÍDOS!" -ForegroundColor Green

