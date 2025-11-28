# 📁 Path Aliases - TypeScript

## 🎯 Configuração

O projeto usa **path aliases** para simplificar os imports e evitar caminhos relativos longos.

### Aliases Configurados

```typescript
{
  "@/*": ["src/*"],
  "@modules/*": ["src/modules/*"],
  "@core/*": ["src/modules/core/*"],
  "@shared/*": ["src/modules/shared/*"],
  "@common/*": ["src/common/*"],
  "@config/*": ["src/config/*"],
  "@database/*": ["src/database/*"],
  "@health/*": ["src/health/*"]
}
```

## 📝 Exemplos de Uso

### ❌ Antes (caminhos relativos)
```typescript
import { PrismaService } from '../../../database/prisma.service';
import { TenantGuard } from '../../../../common/guards/tenant.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
```

### ✅ Depois (com aliases)
```typescript
import { PrismaService } from '@database/prisma.service';
import { TenantGuard } from '@common/guards/tenant.guard';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
```

## 🔧 Configuração

### tsconfig.json
```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@modules/*": ["src/modules/*"],
      "@core/*": ["src/modules/core/*"],
      "@shared/*": ["src/modules/shared/*"],
      "@common/*": ["src/common/*"],
      "@config/*": ["src/config/*"],
      "@database/*": ["src/database/*"],
      "@health/*": ["src/health/*"]
    }
  }
}
```

### tsconfig.build.json
Mesma configuração de paths.

## 📦 Dependências

- `tsconfig-paths` - Para resolver paths em runtime (se necessário)

## ✅ Benefícios

1. **Imports mais limpos** - Sem `../../../`
2. **Refatoração mais fácil** - Mover arquivos não quebra imports
3. **Melhor legibilidade** - Fica claro de onde vem cada import
4. **Consistência** - Todos usam os mesmos aliases

## 🚀 Uso Recomendado

- Use `@core/*` para módulos core (auth, tenants, users, etc.)
- Use `@shared/*` para módulos compartilhados (email, storage, etc.)
- Use `@common/*` para recursos comuns (guards, decorators, filters, etc.)
- Use `@database/*` para database (prisma)
- Use `@config/*` para configurações
- Use `@health/*` para health checks

---

**Última atualização:** 2024-11-28

