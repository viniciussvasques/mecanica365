# Script de setup inicial do Docker (PowerShell)
# Uso: .\scripts\docker-setup.ps1

Write-Host "🚀 Configurando Docker para Mecânica365 Backend..." -ForegroundColor Cyan

# Verificar se Docker está instalado
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker não está instalado. Por favor, instale o Docker primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se Docker Compose está instalado
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro." -ForegroundColor Red
    exit 1
}

# Copiar arquivo de ambiente se não existir
if (-not (Test-Path .env)) {
    Write-Host "📝 Copiando arquivo de ambiente..." -ForegroundColor Yellow
    Copy-Item env.example .env
    Write-Host "✅ Arquivo .env criado. Por favor, edite com suas configurações." -ForegroundColor Green
} else {
    Write-Host "ℹ️  Arquivo .env já existe." -ForegroundColor Blue
}

# Build das imagens
Write-Host "🔨 Construindo imagens Docker..." -ForegroundColor Yellow
docker-compose build

# Subir containers
Write-Host "⬆️  Subindo containers..." -ForegroundColor Yellow
docker-compose up -d

# Aguardar PostgreSQL estar pronto
Write-Host "⏳ Aguardando PostgreSQL estar pronto..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Verificar se PostgreSQL está saudável
$maxRetries = 30
$retryCount = 0
$postgresReady = $false

while ($retryCount -lt $maxRetries -and -not $postgresReady) {
    try {
        $result = docker-compose exec -T postgres pg_isready -U ${env:POSTGRES_USER:-mecanica365} 2>&1
        if ($LASTEXITCODE -eq 0) {
            $postgresReady = $true
        }
    } catch {
        # Ignorar erros
    }
    
    if (-not $postgresReady) {
        Write-Host "⏳ Aguardando PostgreSQL... ($retryCount/$maxRetries)" -ForegroundColor Yellow
        Start-Sleep -Seconds 2
        $retryCount++
    }
}

if ($postgresReady) {
    Write-Host "✅ PostgreSQL está pronto!" -ForegroundColor Green
} else {
    Write-Host "⚠️  PostgreSQL pode não estar pronto. Verifique os logs: npm run docker:logs" -ForegroundColor Yellow
}

# Gerar Prisma Client localmente (importante antes do Docker)
Write-Host "🔧 Gerando Prisma Client localmente..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    npm run prisma:generate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Erro ao gerar Prisma Client localmente. Execute: npm install && npm run prisma:generate" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Prisma Client gerado localmente!" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  node_modules não encontrado. Execute: npm install && npm run prisma:generate" -ForegroundColor Yellow
}

# Executar migrations
Write-Host "📦 Executando migrations..." -ForegroundColor Yellow
docker-compose exec -T backend npx prisma migrate dev --schema=./prisma/schema.prisma
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Erro ao executar migrations. Execute manualmente: npm run docker:migrate" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup concluído!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Status dos containers:" -ForegroundColor Cyan
docker-compose ps
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "  - Ver logs: npm run docker:logs"
Write-Host "  - Acessar API: http://localhost:3001"
Write-Host "  - Swagger: http://localhost:3001/api/docs"
Write-Host "  - Health check: http://localhost:3001/api/health"
Write-Host ""

