# Boas Práticas e Anti-Patterns - Mecânica365 Backend

Este documento registra os erros comuns encontrados durante o desenvolvimento e as práticas recomendadas para evitá-los.

## ❌ Anti-Patterns (O que NÃO fazer)

### 1. Imports Não Utilizados

**❌ ERRADO:**
```typescript
import { ConflictException, BadRequestException, Logger } from '@nestjs/common';
// ConflictException nunca é usado
```

**✅ CORRETO:**
```typescript
import { BadRequestException, Logger } from '@nestjs/common';
// Apenas importar o que é realmente usado
```

**Como evitar:**
- Configure o ESLint para remover imports não usados automaticamente
- Use `npm run lint -- --fix` para correção automática
- Revise imports antes de fazer commit

### 2. Variáveis Não Utilizadas

**❌ ERRADO:**
```typescript
const subscription = await this.prisma.subscription.findFirst({...});
// subscription nunca é usado depois
```

**✅ CORRETO:**
```typescript
await this.prisma.subscription.findFirst({...});
// Se não precisa do valor, não atribua a uma variável
```

**Como evitar:**
- Remova variáveis que não são usadas
- Se precisar manter para debug, use `// eslint-disable-next-line @typescript-eslint/no-unused-vars`
- Para parâmetros não usados, prefixe com `_`: `_email: string`

### 3. Comparações de Enum Sem Type Casting

**❌ ERRADO:**
```typescript
if (tenant.status === TenantStatus.PENDING) {
  // TypeScript pode reclamar se os tipos não forem exatamente iguais
}
```

**✅ CORRETO:**
```typescript
if (tenant.status === (TenantStatus.PENDING as string)) {
  // Ou use type assertion quando necessário
}
// Ou melhor ainda, garanta que os tipos sejam compatíveis no schema Prisma
```

**Como evitar:**
- Use enums consistentes em todo o projeto
- Configure Prisma para usar os mesmos enums do TypeScript
- Use type assertions apenas quando necessário

### 4. Métodos Sem `this: void` em Callbacks

**❌ ERRADO:**
```typescript
setTimeout(() => {
  this.logger.log('Algo'); // Pode perder contexto de 'this'
}, 1000);
```

**✅ CORRETO:**
```typescript
setTimeout((): void => {
  this.logger.log('Algo');
}, 1000);

// Ou use arrow functions que preservam 'this'
const logMessage = (): void => {
  this.logger.log('Algo');
};
setTimeout(logMessage, 1000);
```

**Como evitar:**
- Use arrow functions para preservar contexto
- Adicione `this: void` explicitamente quando necessário
- Prefira métodos de classe para callbacks

### 5. Template Literals com Objetos

**❌ ERRADO:**
```typescript
const url = `https://example.com/${session.invoice}`;
// session.invoice pode ser um objeto, não uma string
const value = String(customData[key] || '');
// customData[key] pode ser um objeto, causando '[object Object]'
```

**✅ CORRETO:**
```typescript
const invoiceId = typeof session.invoice === 'string' 
  ? session.invoice 
  : session.invoice?.toString() || '';
const url = `https://example.com/${invoiceId}`;

// Para valores que podem ser objetos:
const rawValue = customData[key];
let value = '';
if (rawValue != null) {
  if (typeof rawValue === 'string' || typeof rawValue === 'number' || typeof rawValue === 'boolean') {
    value = String(rawValue);
  } else {
    value = JSON.stringify(rawValue);
  }
}
```

**Como evitar:**
- Sempre verifique o tipo antes de usar em template literals
- Use type guards para garantir tipos corretos
- Prefira propriedades específicas ao invés de objetos genéricos
- **Nunca use `String()` diretamente em valores que podem ser objetos** - use type guards primeiro

### 6. Destructuring de Variáveis Não Usadas

**❌ ERRADO:**
```typescript
const { tenant, subscription, adminUser } = result;
// subscription nunca é usado
```

**✅ CORRETO:**
```typescript
const { tenant, adminUser } = result;
// Apenas desestruture o que realmente precisa
```

**Como evitar:**
- Desestruture apenas variáveis que serão usadas
- Se precisar de todas para debug, use `// eslint-disable-next-line`

### 7. Uso de `any` Desnecessário

**❌ ERRADO:**
```typescript
const plan = metadata.plan as any;
const updateData: any = {};
const featureMatrix = (this.featureFlagsService as any).featureMatrix;
```

**✅ CORRETO:**
```typescript
const plan = metadata.plan as SubscriptionPlan;
const updateData: Prisma.SubscriptionUpdateInput = {};
const planFeatures = this.featureFlagsService.getEnabledFeaturesForPlan(plan);
// Use tipos específicos ao invés de 'any'
// Crie métodos públicos ao invés de acessar propriedades privadas via 'as any'
```

**Como evitar:**
- Defina tipos apropriados para todas as variáveis
- Use `unknown` ao invés de `any` quando o tipo é realmente desconhecido
- Crie interfaces/tipos para estruturas de dados complexas
- Use tipos do Prisma (`Prisma.ModelUpdateInput`) ao invés de `any`
- Crie métodos públicos ao invés de acessar propriedades privadas via type casting
- **ESLint está configurado para converter `any` para `unknown` automaticamente** (ver `eslint.config.mjs`)

### 8. Acesso Direto a `error.message` e `error.stack`

**❌ ERRADO:**
```typescript
catch (error: any) {
  this.logger.error(`Erro: ${error.message}`, error.stack);
}
```

**✅ CORRETO:**
```typescript
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

catch (error: unknown) {
  this.logger.error(
    `Erro: ${getErrorMessage(error)}`,
    getErrorStack(error),
  );
}
```

**Como evitar:**
- Sempre use `unknown` ao invés de `any` para erros
- Use funções helper `getErrorMessage()` e `getErrorStack()` para tratamento seguro
- Essas funções verificam se o erro é uma instância de `Error` antes de acessar propriedades

### 9. `await` em Métodos Não-Async

**❌ ERRADO:**
```typescript
async getAvailablePlans(): Promise<any[]> {
  return [...]; // Método não precisa ser async
}

// No teste:
const plans = await service.getAvailablePlans(); // Erro: await-thenable
```

**✅ CORRETO:**
```typescript
getAvailablePlans(): Array<{
  id: SubscriptionPlan;
  name: string;
  price: { monthly: number; annual: number };
  limits: unknown;
}> {
  return [...]; // Método síncrono
}

// No teste:
const plans = service.getAvailablePlans(); // Sem await
```

**Como evitar:**
- Remova `async` de métodos que não usam `await`
- Verifique se o método realmente precisa ser assíncrono
- Use tipos de retorno explícitos ao invés de `Promise<any[]>`

### 10. Acesso a Propriedades Privadas Via Type Casting

**❌ ERRADO:**
```typescript
const featureMatrix = (this.featureFlagsService as any).featureMatrix;
const planFeatures = featureMatrix[plan];
```

**✅ CORRETO:**
```typescript
// Criar método público no FeatureFlagsService:
getEnabledFeaturesForPlan(plan: string): Record<string, FeatureConfig> {
  return this.featureMatrix[plan] || {};
}

// Usar o método público:
const planFeatures = this.featureFlagsService.getEnabledFeaturesForPlan(plan);
```

**Como evitar:**
- Nunca acesse propriedades privadas via `(service as any).property`
- Crie métodos públicos quando necessário acessar dados internos
- Mantenha encapsulamento adequado

## ✅ Boas Práticas

### 1. Limpeza Regular de Código

- Execute `npm run lint` antes de cada commit
- Use `npm run lint -- --fix` para correções automáticas
- Revise warnings e erros regularmente

### 2. Type Safety

- Sempre use tipos explícitos
- Evite `any` - use `unknown` quando necessário
- Use type guards para validação de tipos
- **Use tipos do Prisma (`Prisma.ModelUpdateInput`, `Prisma.ModelCreateInput`) ao invés de `any`**
- **Crie métodos públicos ao invés de acessar propriedades privadas via type casting**
- **Remova `async` de métodos que não usam `await`**

### 3. Organização de Imports

- Agrupe imports por origem (NestJS, bibliotecas externas, módulos locais)
- Remova imports não utilizados
- Use path aliases (`@modules/*`, `@core/*`) para imports locais

### 4. Nomenclatura

- Use nomes descritivos para variáveis e funções
- Prefixe parâmetros não usados com `_`: `_email: string`
- Use constantes para valores mágicos

### 5. Tratamento de Erros

- Sempre trate erros adequadamente
- Use tipos específicos de exceção (NotFoundException, BadRequestException, etc.)
- Log erros com contexto suficiente
- **SEMPRE use `unknown` para erros capturados, nunca `any`**
- **Use funções helper `getErrorMessage()` e `getErrorStack()` para acesso seguro a propriedades de erro**

### 6. Testes

- Escreva testes para todas as funcionalidades
- Mantenha mocks atualizados
- Execute testes antes de fazer commit

## 🔧 Ferramentas e Comandos Úteis

```bash
# Verificar erros de linting
npm run lint

# Corrigir erros automaticamente (ESLint corrige automaticamente o que for possível)
npm run lint
# ou
npx eslint . --fix

# Verificar apenas um arquivo
npm run lint src/modules/core/onboarding/onboarding.service.ts

# Executar testes
npm run test

# Build do projeto
npm run build

# Verificar tipos TypeScript sem compilar
npx tsc --noEmit
```

### Configuração ESLint para Evitar `any`

O projeto está configurado com ESLint que:
- **Converte `any` para `unknown` automaticamente** quando possível
- **Bloqueia uso explícito de `any`** (regra `@typescript-eslint/no-explicit-any: error`)
- **Avisa sobre acessos inseguros** a propriedades de objetos `any`

Configuração em `eslint.config.mjs`:
```javascript
'@typescript-eslint/no-explicit-any': [
  'error',
  { fixToUnknown: true, ignoreRestArgs: false },
],
```

### Configuração VS Code (Recomendada)

Adicione ao `settings.json` do VS Code:
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

Isso corrige automaticamente todos os problemas do ESLint ao salvar o arquivo.

## 📝 Checklist Antes de Commit

- [ ] `npm run lint` não retorna erros
- [ ] `npm run test` passa todos os testes
- [ ] `npm run build` compila sem erros
- [ ] Imports não utilizados foram removidos
- [ ] Variáveis não utilizadas foram removidas
- [ ] Tipos estão corretos (sem `any` desnecessário)
- [ ] Tratamento de erros está adequado
- [ ] Código está documentado quando necessário

## 🎯 Metas

- **Zero erros de linting** antes de cada commit
- **100% de cobertura de testes** para código crítico
- **Type safety** em todo o código
- **Código limpo** e bem organizado


