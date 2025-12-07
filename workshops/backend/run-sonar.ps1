# Script PowerShell para executar análise do SonarQube
# Token salvo em .sonar-token

$tokenFile = ".sonar-token"
if (-not (Test-Path $tokenFile)) {
    Write-Host "❌ Token não encontrado em .sonar-token" -ForegroundColor Red
    Write-Host "Por favor, crie o arquivo .sonar-token com o token do SonarQube" -ForegroundColor Yellow
    exit 1
}

$token = Get-Content $tokenFile -Raw | ForEach-Object { $_.Trim() }

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "❌ Token vazio em .sonar-token" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Executando análise do SonarQube..." -ForegroundColor Cyan
Write-Host "📊 Project Key: mecanica-365" -ForegroundColor Cyan
Write-Host ""

# Converter caminho Windows para formato Docker
$backendPath = (Resolve-Path ".").Path -replace '^([A-Z]):', '/$1' -replace '\\', '/'

docker run --rm `
  --network mecanica365-workshops_mecanica365-workshops-network `
  -v "${backendPath}:/usr/src" `
  -w /usr/src `
  -e SONAR_TOKEN=$token `
  sonarsource/sonar-scanner-cli `
  "-Dsonar.host.url=http://sonarqube:9000" `
  "-Dsonar.token=$token" `
  "-Dsonar.projectKey=mecanica-365"

Write-Host ""
Write-Host "✅ Análise concluída!" -ForegroundColor Green
Write-Host "📊 Acesse http://localhost:9000 para ver os resultados" -ForegroundColor Cyan

