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
```

**✅ CORRETO:**
```typescript
const invoiceId = typeof session.invoice === 'string' 
  ? session.invoice 
  : session.invoice?.toString() || '';
const url = `https://example.com/${invoiceId}`;
```

**Como evitar:**
- Sempre verifique o tipo antes de usar em template literals
- Use type guards para garantir tipos corretos
- Prefira propriedades específicas ao invés de objetos genéricos

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
```

**✅ CORRETO:**
```typescript
const plan = metadata.plan as SubscriptionPlan;
// Use tipos específicos ao invés de 'any'
```

**Como evitar:**
- Defina tipos apropriados para todas as variáveis
- Use `unknown` ao invés de `any` quando o tipo é realmente desconhecido
- Crie interfaces/tipos para estruturas de dados complexas

## ✅ Boas Práticas

### 1. Limpeza Regular de Código

- Execute `npm run lint` antes de cada commit
- Use `npm run lint -- --fix` para correções automáticas
- Revise warnings e erros regularmente

### 2. Type Safety

- Sempre use tipos explícitos
- Evite `any` - use `unknown` quando necessário
- Use type guards para validação de tipos

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

### 6. Testes

- Escreva testes para todas as funcionalidades
- Mantenha mocks atualizados
- Execute testes antes de fazer commit

## 🔧 Ferramentas e Comandos Úteis

```bash
# Verificar erros de linting
npm run lint

# Corrigir erros automaticamente
npm run lint -- --fix

# Verificar apenas um arquivo
npm run lint src/modules/core/onboarding/onboarding.service.ts

# Executar testes
npm run test

# Build do projeto
npm run build
```

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


