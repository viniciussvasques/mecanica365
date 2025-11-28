# Teste do Fluxo Completo com Stripe
# Este script testa a criação de checkout session no Stripe

$baseUrl = "http://localhost:3001/api"
$randomId = Get-Random -Minimum 1000 -Maximum 9999

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTE CHECKOUT STRIPE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Dados do cliente para checkout
$checkoutData = @{
    name = "Oficina Teste Stripe $randomId"
    email = "teste-stripe-$randomId@oficina.com"
    documentType = "cpf"
    document = "11144477735"
    subdomain = "oficina-stripe-$randomId"
    plan = "workshops_starter"
    billingCycle = "monthly"
} | ConvertTo-Json

Write-Host "1. Criando sessão de checkout no Stripe..." -ForegroundColor Yellow
Write-Host "   Dados:" -ForegroundColor Gray
Write-Host "   - Nome: Oficina Teste Stripe $randomId" -ForegroundColor Gray
Write-Host "   - Email: teste-stripe-$randomId@oficina.com" -ForegroundColor Gray
Write-Host "   - Subdomain: oficina-stripe-$randomId" -ForegroundColor Gray
Write-Host "   - Plano: workshops_starter" -ForegroundColor Gray
Write-Host ""

try {
    $checkout = Invoke-RestMethod -Uri "$baseUrl/onboarding/checkout" `
        -Method POST `
        -Headers @{'Content-Type'='application/json'} `
        -Body $checkoutData `
        -TimeoutSec 30
    
    Write-Host "   OK - Checkout criado com sucesso!" -ForegroundColor Green
    Write-Host "   Session ID: $($checkout.sessionId)" -ForegroundColor Gray
    Write-Host "   URL de Pagamento: $($checkout.url)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Abra a URL de pagamento no navegador:" -ForegroundColor Cyan
    Write-Host "   $($checkout.url)" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Complete o pagamento no Stripe (use cartão de teste):" -ForegroundColor Cyan
    Write-Host "   Cartão: 4242 4242 4242 4242" -ForegroundColor White
    Write-Host "   Validade: Qualquer data futura" -ForegroundColor White
    Write-Host "   CVC: Qualquer 3 dígitos" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Após o pagamento, o Stripe enviará webhook automaticamente" -ForegroundColor Cyan
    Write-Host "   O backend processará e criará:" -ForegroundColor Gray
    Write-Host "   - Tenant" -ForegroundColor Gray
    Write-Host "   - Subscription" -ForegroundColor Gray
    Write-Host "   - Usuário admin" -ForegroundColor Gray
    Write-Host "   - Email de boas-vindas" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Verifique os logs do backend:" -ForegroundColor Cyan
    Write-Host "   docker-compose logs backend --tail 30" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "   ERRO: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Detalhes: $($_.ErrorDetails.Message)" -ForegroundColor Red
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        if ($errorDetails.message) {
            Write-Host "   Mensagens:" -ForegroundColor Yellow
            $errorDetails.message | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
        }
    }
    Write-Host ""
    Write-Host "Verifique:" -ForegroundColor Yellow
    Write-Host "  - STRIPE_SECRET_KEY está configurado no .env" -ForegroundColor Gray
    Write-Host "  - Backend foi reiniciado após adicionar as chaves" -ForegroundColor Gray
}


