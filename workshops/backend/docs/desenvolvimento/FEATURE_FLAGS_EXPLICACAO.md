# 🎛️ Feature Flags - Explicação

## O que são Feature Flags?

**Feature Flags** são um sistema de controle de acesso que permite **habilitar ou desabilitar funcionalidades** baseado no **plano de assinatura** do tenant.

---

## 🔐 Como Funciona

### 1. **@RequireFeature Decorator**

```typescript
@RequireFeature('customers')
@Controller('customers')
```

**O que faz:**
- Marca que a rota/controller **requer** uma feature específica
- Armazena o nome da feature em metadados
- Exemplo: `@RequireFeature('customers')` marca que precisa da feature `customers`

### 2. **FeatureGuard**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
```

**O que faz:**
1. **Intercepta** todas as requisições
2. **Lê** o decorator `@RequireFeature` da rota
3. **Verifica** se o tenant tem a feature habilitada no plano
4. **Permite ou bloqueia** o acesso:
   - ✅ **Permite**: Se a feature está habilitada no plano
   - ❌ **Bloqueia**: Se a feature NÃO está habilitada (retorna `403 Forbidden`)

---

## 📊 Exemplo Prático

### Configuração no FeatureFlagsService

```typescript
workshops_starter: {
  customers: { enabled: true, limit: 100 },  // ✅ Habilitado, limite 100
  diagnostics: { enabled: false },            // ❌ Desabilitado
}

workshops_professional: {
  customers: { enabled: true, unlimited: true }, // ✅ Habilitado, ilimitado
  diagnostics: { enabled: true, unlimited: true }, // ✅ Habilitado
}
```

### Uso no Controller

```typescript
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('customers')  // ← Exige que 'customers' esteja habilitado
export class CustomersController {
  // ...
}
```

### Comportamento

**Tenant com plano Starter:**
- ✅ Pode acessar `/api/customers` (feature habilitada)
- ❌ NÃO pode acessar `/api/diagnostics` (feature desabilitada) → `403 Forbidden`

**Tenant com plano Professional:**
- ✅ Pode acessar `/api/customers` (feature habilitada)
- ✅ Pode acessar `/api/diagnostics` (feature habilitada)

---

## 🎯 Quando Usar?

### ✅ **USAR Feature Flags quando:**

1. **Funcionalidade Premium**
   - Recursos avançados apenas em planos superiores
   - Exemplo: Diagnóstico OBD2, Relatórios Avançados

2. **Limites por Plano**
   - Funcionalidade existe, mas com limites diferentes
   - Exemplo: Starter = 100 clientes, Professional = ilimitado

3. **Beta/Experimental**
   - Funcionalidades em teste
   - Pode ser desabilitada temporariamente

### ❌ **NÃO USAR Feature Flags quando:**

1. **Funcionalidade Básica**
   - Recursos essenciais do sistema
   - Exemplo: Clientes, Veículos, Ordens de Serviço básicas

2. **Todos os Planos Têm Acesso**
   - Se todos os planos têm acesso, não precisa de feature flag
   - O controle pode ser feito apenas por **permissões (Roles)**

3. **Módulos Core**
   - Módulos fundamentais do sistema
   - Exemplo: Autenticação, Tenants, Usuários

---

## 🔄 Fluxo de Verificação

```
1. Cliente faz requisição → POST /api/customers
   ↓
2. FeatureGuard intercepta
   ↓
3. Lê @RequireFeature('customers')
   ↓
4. Busca tenant no banco
   ↓
5. Verifica plano do tenant
   ↓
6. Consulta FeatureFlagsService
   ↓
7. Verifica se 'customers' está enabled
   ↓
8a. ✅ Se SIM → Permite acesso → Controller processa
8b. ❌ Se NÃO → Retorna 403 Forbidden
```

---

## 📝 Exemplo de Código

### Com Feature Flag (Premium)

```typescript
@Controller('diagnostics')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('diagnostics')  // ← Apenas planos Professional/Enterprise
export class DiagnosticsController {
  // ...
}
```

### Sem Feature Flag (Básico)

```typescript
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← Sem FeatureGuard
// Sem @RequireFeature - todos os planos têm acesso
export class CustomersController {
  // ...
}
```

---

## 🎯 Por que Removemos do Customers?

**Razão:** O módulo `customers` é uma **funcionalidade básica** que **todos os planos têm acesso**. 

- ✅ Starter: 100 clientes
- ✅ Professional: Ilimitado
- ✅ Enterprise: Ilimitado

**Controle de Limites:**
- O limite de 100 clientes do Starter é controlado no **Service** (lógica de negócio)
- Não precisa bloquear o acesso completo ao módulo

**Se precisar bloquear completamente:**
- Adicione `@RequireFeature('customers')` novamente
- Configure no FeatureFlagsService: `diagnostics: { enabled: false }` para Starter

---

## 📚 Resumo

| Item | Função |
|------|--------|
| `@RequireFeature('nome')` | Marca que a rota precisa de uma feature |
| `FeatureGuard` | Verifica se o tenant tem a feature habilitada |
| `FeatureFlagsService` | Gerencia quais features cada plano tem |
| **Resultado** | Bloqueia acesso (403) se feature não estiver habilitada |

---

**Última atualização:** 2024-12-XX

