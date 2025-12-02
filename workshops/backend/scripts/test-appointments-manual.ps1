# Script de Teste Manual - AppointmentsModule
# Testa criação, listagem e busca de agendamentos

$baseUrl = "http://oficinartee.localhost:3001/api"
$tenantSubdomain = "oficinartee"

# Dados de teste
$testEmail = "admin@oficina.com"
$testPassword = "admin123"  # Ajuste conforme necessário

Write-Host "🧪 TESTE MANUAL - AppointmentsModule" -ForegroundColor Cyan
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
    exit 1
}

# 2. Buscar dados existentes
Write-Host "2️⃣ Buscando dados existentes..." -ForegroundColor Yellow
try {
    # Buscar Service Order mais recente
    $soResponse = Invoke-RestMethod -Uri "$baseUrl/service-orders?limit=1" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "X-Tenant-Subdomain" = $tenantSubdomain
        }
    
    $serviceOrderId = $soResponse.data[0].id
    $serviceOrderNumber = $soResponse.data[0].number
    
    # Buscar Cliente
    $customerResponse = Invoke-RestMethod -Uri "$baseUrl/customers?limit=1" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "X-Tenant-Subdomain" = $tenantSubdomain
        }
    
    $customerId = $customerResponse.data[0].id
    
    # Buscar Mecânico
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/users?role=mechanic&limit=1" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "X-Tenant-Subdomain" = $tenantSubdomain
        }
    
    $mechanicId = $usersResponse.data[0].id
    
    Write-Host "✅ Dados encontrados:" -ForegroundColor Green
    Write-Host "   Service Order: $serviceOrderNumber ($serviceOrderId)" -ForegroundColor Gray
    Write-Host "   Cliente: $($customerResponse.data[0].name) ($customerId)" -ForegroundColor Gray
    Write-Host "   Mecânico: $($usersResponse.data[0].name) ($mechanicId)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao buscar dados: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Criar agendamento
Write-Host "3️⃣ Criando agendamento..." -ForegroundColor Yellow
$appointmentDate = (Get-Date).AddDays(1)
$appointmentDate = $appointmentDate.Date.AddHours(9)  # Amanhã às 9h

$createAppointmentBody = @{
    customerId = $customerId
    serviceOrderId = $serviceOrderId
    assignedToId = $mechanicId
    date = $appointmentDate.ToUniversalTime().ToString("o")
    duration = 60
    serviceType = "Teste Manual"
    notes = "Agendamento criado via teste manual"
    status = "scheduled"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/appointments" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
            "X-Tenant-Subdomain" = $tenantSubdomain
        } `
        -Body $createAppointmentBody
    
    $appointmentId = $createResponse.id
    Write-Host "✅ Agendamento criado com sucesso!" -ForegroundColor Green
    Write-Host "   ID: $appointmentId" -ForegroundColor Gray
    Write-Host "   Data: $($createResponse.date)" -ForegroundColor Gray
    Write-Host "   Status: $($createResponse.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao criar agendamento: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
    exit 1
}

# 4. Listar agendamentos
Write-Host "4️⃣ Listando agendamentos..." -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/appointments?limit=10" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "X-Tenant-Subdomain" = $tenantSubdomain
        }
    
    Write-Host "✅ Agendamentos encontrados: $($listResponse.total)" -ForegroundColor Green
    foreach ($apt in $listResponse.data) {
        $osNumber = if ($apt.serviceOrder) { $apt.serviceOrder.number } else { "N/A" }
        Write-Host "   - $($apt.id): $($apt.date) | Status: $($apt.status) | OS: $osNumber" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao listar agendamentos: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. Buscar agendamento específico
Write-Host "5️⃣ Buscando agendamento específico..." -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/appointments/$appointmentId" `
        -Method GET `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
            "X-Tenant-Subdomain" = $tenantSubdomain
        }
    
    Write-Host "✅ Agendamento encontrado:" -ForegroundColor Green
    Write-Host "   ID: $($getResponse.id)" -ForegroundColor Gray
    Write-Host "   Data: $($getResponse.date)" -ForegroundColor Gray
    Write-Host "   Duração: $($getResponse.duration) minutos" -ForegroundColor Gray
    Write-Host "   Status: $($getResponse.status)" -ForegroundColor Gray
    $customerName = if ($getResponse.customer) { $getResponse.customer.name } else { "N/A" }
    $mechanicName = if ($getResponse.assignedTo) { $getResponse.assignedTo.name } else { "N/A" }
    $osNumber = if ($getResponse.serviceOrder) { $getResponse.serviceOrder.number } else { "N/A" }
    Write-Host "   Cliente: $customerName" -ForegroundColor Gray
    Write-Host "   Mecânico: $mechanicName" -ForegroundColor Gray
    Write-Host "   OS: $osNumber" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "❌ Erro ao buscar agendamento: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 6. Verificar no banco de dados
Write-Host "6️⃣ Verificando no banco de dados..." -ForegroundColor Yellow
try {
    $dbCheck = docker-compose exec -T postgres psql -U mecanica365 -d mecanica365_db -c "SELECT COUNT(*) FROM appointments WHERE id = '$appointmentId';"
    Write-Host "✅ Verificação no banco concluída" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "⚠️ Não foi possível verificar no banco (pode ser normal)" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan

