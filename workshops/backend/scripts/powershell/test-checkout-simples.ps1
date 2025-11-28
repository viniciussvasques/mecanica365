$baseUrl = "http://localhost:3001/api"
$randomId = Get-Random -Minimum 10000 -Maximum 99999

# Gerar CPF válido único
function Generate-CPF {
    $base = (Get-Random -Minimum 100000000 -Maximum 999999999).ToString()
    # Calcular dígitos verificadores
    $sum = 0
    for ($i = 0; $i -lt 9; $i++) {
        $sum += [int]$base[$i] * (10 - $i)
    }
    $digit1 = (11 - ($sum % 11)) % 11
    if ($digit1 -ge 10) { $digit1 = 0 }
    
    $sum = 0
    for ($i = 0; $i -lt 9; $i++) {
        $sum += [int]$base[$i] * (11 - $i)
    }
    $sum += $digit1 * 2
    $digit2 = (11 - ($sum % 11)) % 11
    if ($digit2 -ge 10) { $digit2 = 0 }
    
    return $base + $digit1.ToString() + $digit2.ToString()
}

$cpf = Generate-CPF

$checkoutData = @{
    name = "Oficina Stripe $randomId"
    email = "stripe-$randomId@teste.com"
    documentType = "cpf"
    document = $cpf
    subdomain = "stripe-$randomId"
    plan = "workshops_starter"
    billingCycle = "monthly"
} | ConvertTo-Json

Write-Host "Criando checkout Stripe..." -ForegroundColor Cyan

try {
    $checkout = Invoke-RestMethod -Uri "$baseUrl/onboarding/checkout" -Method POST -Headers @{'Content-Type'='application/json'} -Body $checkoutData -TimeoutSec 30
    
    Write-Host ""
    Write-Host "SUCESSO! Checkout criado!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Session ID: $($checkout.sessionId)" -ForegroundColor Gray
    Write-Host "URL de Pagamento: $($checkout.url)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "=== PROXIMOS PASSOS ===" -ForegroundColor Yellow
    Write-Host "1. Abra esta URL no navegador:" -ForegroundColor White
    Write-Host "   $($checkout.url)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Use cartao de teste do Stripe:" -ForegroundColor White
    Write-Host "   Numero: 4242 4242 4242 4242" -ForegroundColor Gray
    Write-Host "   Validade: 12/25" -ForegroundColor Gray
    Write-Host "   CVC: 123" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Complete o pagamento" -ForegroundColor White
    Write-Host ""
    Write-Host "4. O Stripe enviara webhook automaticamente" -ForegroundColor White
    Write-Host "   Backend criara: Tenant + Subscription + User + Email" -ForegroundColor Gray
    Write-Host ""
    Write-Host "5. Verifique os logs:" -ForegroundColor White
    Write-Host "   docker-compose logs -f backend" -ForegroundColor Gray
    
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

