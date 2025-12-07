# Script para forçar atualização dos tipos do TypeScript e Prisma
Write-Host "🔄 Atualizando tipos do Prisma e TypeScript..." -ForegroundColor Cyan

# Limpar cache do Prisma
Write-Host "Limpando cache do Prisma..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules/.prisma -ErrorAction SilentlyContinue

# Regenerar Prisma Client
Write-Host "Regenerando Prisma Client..." -ForegroundColor Yellow
npx prisma generate

# Limpar cache do TypeScript
Write-Host "Limpando cache do TypeScript..." -ForegroundColor Yellow
Remove-Item -Force tsconfig.tsbuildinfo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

Write-Host "✅ Tipos atualizados! Reinicie o TypeScript Language Server no editor (Ctrl+Shift+P -> 'TypeScript: Restart TS Server')" -ForegroundColor Green

