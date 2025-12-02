# Script de Teste Manual - AttachmentsModule
# Testa upload, listagem, busca e remoção de anexos

$baseUrl = "http://oficinartee.localhost:3001/api"
$tenantSubdomain = "oficinartee"

# Dados de teste
$testEmail = "admin@oficina.com"
$testPassword = "admin123"  # Ajuste conforme necessário

Write-Host "🧪 TESTE MANUAL - AttachmentsModule" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login para obter token
Write-Host "1️⃣ Fazendo login..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "X-Tenant-Subdomain" = $tenantSubdomain
        } `
        -Body (@{
            email = $testEmail
            password = $testPassword
        } | ConvertTo-Json)

    $accessToken = $loginResponse.accessToken
    $userId = $loginResponse.user.id
    $tenantId = $loginResponse.user.tenantId
    
    Write-Host "✅ Login realizado com sucesso!" -ForegroundColor Green
    Write-Host "   Token: $($accessToken.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "   User ID: $userId" -ForegroundColor Gray
    Write-Host "   Tenant ID: $tenantId" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Erro no login: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Verifique as credenciais e tente novamente" -ForegroundColor Yellow
    exit 1
}

# 2. Buscar dados existentes
Write-Host "2️⃣ Buscando dados existentes..." -ForegroundColor Yellow
try {
    # Buscar Quote mais recente
    $quoteResponse = Invoke-RestMethod -Uri "$baseUrl/quotes?limit=1" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "X-Tenant-Subdomain" = $tenantSubdomain
        }
    
    $quoteId = $null
    if ($quoteResponse.data -and $quoteResponse.data.Count -gt 0) {
        $quoteId = $quoteResponse.data[0].id
        Write-Host "   Quote encontrado: $($quoteResponse.data[0].number) ($quoteId)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️ Nenhum quote encontrado" -ForegroundColor Yellow
    }
    
    # Buscar Service Order mais recente
    $soResponse = Invoke-RestMethod -Uri "$baseUrl/service-orders?limit=1" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "X-Tenant-Subdomain" = $tenantSubdomain
        }
    
    $serviceOrderId = $null
    if ($soResponse.data -and $soResponse.data.Count -gt 0) {
        $serviceOrderId = $soResponse.data[0].id
        Write-Host "   Service Order encontrada: $($soResponse.data[0].number) ($serviceOrderId)" -ForegroundColor Gray
    } else {
        Write-Host "   ⚠️ Nenhuma service order encontrada" -ForegroundColor Yellow
    }
    
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao buscar dados: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Continuando sem relacionamentos..." -ForegroundColor Yellow
    Write-Host ""
}

# 3. Criar arquivo de teste
Write-Host "3️⃣ Criando arquivo de teste..." -ForegroundColor Yellow
$testImagePath = "$env:TEMP\test-attachment-$(Get-Date -Format 'yyyyMMddHHmmss').jpg"
try {
    # Criar uma imagem de teste simples (1x1 pixel PNG em base64)
    $base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    $bytes = [Convert]::FromBase64String($base64Image)
    [System.IO.File]::WriteAllBytes($testImagePath, $bytes)
    Write-Host "✅ Arquivo de teste criado: $testImagePath" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao criar arquivo de teste: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Pulando teste de upload..." -ForegroundColor Yellow
    $testImagePath = $null
    Write-Host ""
}

# 4. Upload de anexo (se arquivo foi criado)
if ($testImagePath -and (Test-Path $testImagePath)) {
    Write-Host "4️⃣ Testando upload de anexo..." -ForegroundColor Yellow
    try {
        $boundary = [System.Guid]::NewGuid().ToString()
        $bodyLines = @()
        $bodyLines += "--$boundary"
        $bodyLines += "Content-Disposition: form-data; name=`"type`""
        $bodyLines += ""
        $bodyLines += "photo_before"
        
        if ($quoteId) {
            $bodyLines += "--$boundary"
            $bodyLines += "Content-Disposition: form-data; name=`"quoteId`""
            $bodyLines += ""
            $bodyLines += $quoteId
        }
        
        $bodyLines += "--$boundary"
        $bodyLines += "Content-Disposition: form-data; name=`"file`"; filename=`"test-image.jpg`""
        $bodyLines += "Content-Type: image/jpeg"
        $bodyLines += ""
        
        $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($bodyLines -join "`r`n")
        $fileBytes = [System.IO.File]::ReadAllBytes($testImagePath)
        $endBytes = [System.Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")
        
        $finalBody = $bodyBytes + $fileBytes + $endBytes
        
        $uploadResponse = Invoke-RestMethod -Uri "$baseUrl/attachments" `
            -Method POST `
            -Headers @{
                "Authorization" = "Bearer $accessToken"
                "X-Tenant-Subdomain" = $tenantSubdomain
                "Content-Type" = "multipart/form-data; boundary=$boundary"
            } `
            -Body $finalBody
        
        $attachmentId = $uploadResponse.id
        Write-Host "✅ Anexo criado com sucesso!" -ForegroundColor Green
        Write-Host "   ID: $attachmentId" -ForegroundColor Gray
        Write-Host "   Tipo: $($uploadResponse.type)" -ForegroundColor Gray
        Write-Host "   URL: $($uploadResponse.url)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Erro ao fazer upload: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "   Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
        $attachmentId = $null
        Write-Host ""
    }
} else {
    Write-Host "4️⃣ ⚠️ Pulando teste de upload (arquivo não criado)" -ForegroundColor Yellow
    Write-Host ""
    $attachmentId = $null
}

# 5. Listar anexos
Write-Host "5️⃣ Listando anexos..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/attachments?limit=10" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "X-Tenant-Subdomain" = $tenantSubdomain
        }
    
    Write-Host "✅ Anexos encontrados: $($listResponse.total)" -ForegroundColor Green
    foreach ($att in $listResponse.data) {
        Write-Host "   - $($att.id): $($att.type) | $($att.originalName) | URL: $($att.url)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao listar anexos: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# 6. Buscar anexo específico (se foi criado)
if ($attachmentId) {
    Write-Host "6️⃣ Buscando anexo específico..." -ForegroundColor Yellow
    try {
        $getResponse = Invoke-RestMethod -Uri "$baseUrl/attachments/$attachmentId" `
            -Method GET `
            -Headers @{
                "Authorization" = "Bearer $accessToken"
                "X-Tenant-Subdomain" = $tenantSubdomain
            }
        
        Write-Host "✅ Anexo encontrado:" -ForegroundColor Green
        Write-Host "   ID: $($getResponse.id)" -ForegroundColor Gray
        Write-Host "   Tipo: $($getResponse.type)" -ForegroundColor Gray
        Write-Host "   Nome original: $($getResponse.originalName)" -ForegroundColor Gray
        Write-Host "   Tamanho: $($getResponse.fileSize) bytes" -ForegroundColor Gray
        Write-Host "   URL: $($getResponse.url)" -ForegroundColor Gray
        Write-Host ""
    } catch {
        Write-Host "❌ Erro ao buscar anexo: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
    }
}

# 7. Limpar arquivo de teste
if ($testImagePath -and (Test-Path $testImagePath)) {
    try {
        Remove-Item $testImagePath -Force
        Write-Host "🧹 Arquivo de teste removido" -ForegroundColor Gray
    } catch {
        # Ignorar erro de remoção
    }
}

Write-Host "✅ TODOS OS TESTES CONCLUÍDOS!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

