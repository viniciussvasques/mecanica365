# Arquitetura Modular e Estrutura de Backends

**Versão:** 1.0  
**Data:** 2024  
**Objetivo:** Definir arquitetura modular baseada em planos e estrutura de backends

---

## 🎯 Sistema Modular Baseado em Planos

### Conceito

Cada **módulo** pode ser **ativado/desativado** por tenant baseado no **plano** (Basic, Premium, Enterprise).

### Vantagens

1. ✅ **Flexibilidade:** Cada tenant paga apenas pelo que usa
2. ✅ **Escalabilidade:** Adicionar novos módulos sem afetar existentes
3. ✅ **Testes:** Testar módulos isoladamente
4. ✅ **Monetização:** Diferentes planos, diferentes features
5. ✅ **Manutenção:** Manter código organizado

---

## 📦 Módulos do Sistema

### Módulos Core (Sempre Ativos)

1. **Auth Module** - Autenticação e autorização
2. **Tenants Module** - Gerenciamento de tenants
3. **Users Module** - Gerenciamento de usuários
4. **Stores Module** - Gerenciamento de lojas/filiais
5. **Billing Module** - Assinaturas e billing

### Módulos por Versão

#### Versão Dealers

| Módulo | Basic | Premium | Enterprise |
|--------|-------|---------|------------|
| **Inventory** | ✅ | ✅ | ✅ |
| **CRM** | ✅ | ✅ | ✅ |
| **Sales** | ✅ | ✅ | ✅ |
| **Vehicle History** | ❌ | ✅ (50/mês) | ✅ (Ilimitado) |
| **Service/RO** | ⚠️ Básico | ✅ | ✅ |
| **Parts** | ⚠️ Básico | ✅ | ✅ |
| **Dashboard** | ✅ Básico | ✅ Avançado | ✅ Custom |
| **Accounting** | ❌ | ⚠️ Básico | ✅ Completo |
| **Integrations** | ❌ | ⚠️ Limitado | ✅ Ilimitado |
| **API Access** | ❌ | ⚠️ Rate limit | ✅ Ilimitado |

#### Versão Oficinas

| Módulo | Starter | Professional | Enterprise |
|--------|---------|--------------|------------|
| **Service Orders** | ✅ (50/mês) | ✅ Ilimitado | ✅ Ilimitado |
| **Agendamentos** | ✅ | ✅ | ✅ |
| **Estoque** | ⚠️ (500 peças) | ✅ Ilimitado | ✅ Ilimitado |
| **Faturamento** | ✅ Básico | ✅ + NF-e | ✅ Completo |
| **Vehicle History** | ✅ (Escrita) | ✅ (Escrita) | ✅ (Escrita + Leitura) |
| **Clientes** | ✅ | ✅ | ✅ |
| **Dashboard** | ❌ | ✅ | ✅ Avançado |
| **Automações** | ❌ | ✅ | ✅ Avançado |
| **Integrations** | ❌ | ⚠️ Limitado | ✅ Ilimitado |

---

## 🏗️ Estrutura de Backends

### ✅ Decisão Final: Dois Backends Separados

**Estrutura:**
- `backend-workshops/` - ERP para oficinas (NestJS)
- `backend-dealers/` - ERP para concessionárias (NestJS)
- `shared/` - Código compartilhado (types, schemas, utils)

**Razão:**
- ✅ Separação clara de responsabilidades
- ✅ Escala independente
- ✅ Deploy independente
- ✅ Time pode trabalhar em paralelo

**Compartilhado:**
- Vehicle History Platform (API compartilhada)
- Types (pasta `shared/`)
- Schemas de validação (Zod)

---

### Opção 1: Backend Único com Feature Flags (Não escolhido)

**Arquitetura:**

```
apps/api/ (NestJS Backend Único)
├── src/
│   ├── modules/
│   │   ├── core/              # Módulos sempre ativos
│   │   │   ├── auth/
│   │   │   ├── tenants/
│   │   │   ├── users/
│   │   │   └── billing/
│   │   │
│   │   ├── dealers/          # Módulos específicos Dealers
│   │   │   ├── inventory/
│   │   │   ├── crm/
│   │   │   ├── sales/
│   │   │   └── ...
│   │   │
│   │   ├── workshops/        # Módulos específicos Oficinas
│   │   │   ├── service-orders/
│   │   │   ├── appointments/
│   │   │   ├── parts/
│   │   │   └── ...
│   │   │
│   │   └── shared/           # Módulos compartilhados
│   │       ├── vehicle-history/
│   │       ├── notifications/
│   │       └── ...
│   │
│   └── common/
│       ├── decorators/
│       │   └── feature-flag.decorator.ts
│       └── guards/
│           └── feature-flag.guard.ts
```

**Vantagens:**
- ✅ Código compartilhado fácil (Vehicle History, Notifications)
- ✅ Um deploy apenas
- ✅ Menos infraestrutura
- ✅ Type safety entre módulos
- ✅ Mais simples de manter

**Desvantagens:**
- ⚠️ Código pode ficar grande (mas modular resolve)
- ⚠️ Precisa feature flags bem implementadas

**Decisão:** ❌ **NÃO ESCOLHIDO** - Optamos por dois backends separados

---

### Opção 2: Dois Backends Separados

**Arquitetura:**

```
apps/
├── api-dealers/              # Backend Dealers
│   └── src/modules/
│       ├── inventory/
│       ├── crm/
│       └── ...
│
└── api-workshops/            # Backend Oficinas
    └── src/modules/
        ├── service-orders/
        ├── appointments/
        └── ...
```

**Vantagens:**
- ✅ Separação completa
- ✅ Escala independente
- ✅ Deploy independente

**Desvantagens:**
- ❌ Código duplicado (Vehicle History, Auth, etc.)
- ❌ Mais complexo de manter
- ❌ Type safety perdido
- ❌ Mais infraestrutura

**Decisão:** ✅ **ESCOLHIDO** - Dois backends separados para melhor separação

---

## 🔧 Implementação de Feature Flags

### 1. Decorator para Feature Flags

```typescript
// common/decorators/feature-flag.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const FEATURE_FLAG_KEY = 'featureFlag';

export enum FeatureFlag {
  VEHICLE_HISTORY = 'vehicle_history',
  ADVANCED_DASHBOARD = 'advanced_dashboard',
  ACCOUNTING = 'accounting',
  API_ACCESS = 'api_access',
  AUTOMATIONS = 'automations',
  // ... outros módulos
}

export const RequireFeature = (...features: FeatureFlag[]) =>
  SetMetadata(FEATURE_FLAG_KEY, features);
```

### 2. Guard para Validar Feature Flags

```typescript
// common/guards/feature-flag.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlag, FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator';
import { TenantsService } from '../../modules/core/tenants/tenants.service';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantsService: TenantsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<FeatureFlag[]>(
      FEATURE_FLAG_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeatures || requiredFeatures.length === 0) {
      return true; // Sem feature flag requerida, permite acesso
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request['tenantId'];

    if (!tenantId) {
      throw new ForbiddenException('Tenant not found');
    }

    const tenant = await this.tenantsService.findOne(tenantId);
    const plan = tenant.subscription?.plan;

    // Verificar se tenant tem acesso aos features requeridos
    const hasAccess = await this.checkFeatureAccess(plan, requiredFeatures);

    if (!hasAccess) {
      throw new ForbiddenException(
        `Feature(s) ${requiredFeatures.join(', ')} not available in your plan`,
      );
    }

    return true;
  }

  private async checkFeatureAccess(
    plan: string,
    requiredFeatures: FeatureFlag[],
  ): Promise<boolean> {
    // Lógica para verificar se plano tem acesso aos features
    const planFeatures = this.getPlanFeatures(plan);

    return requiredFeatures.every((feature) => planFeatures.includes(feature));
  }

  private getPlanFeatures(plan: string): FeatureFlag[] {
    // Mapear planos para features
    const planFeatureMap: Record<string, FeatureFlag[]> = {
      // Dealers
      'dealers_basic': [
        FeatureFlag.INVENTORY,
        FeatureFlag.CRM,
        FeatureFlag.SALES,
      ],
      'dealers_premium': [
        FeatureFlag.INVENTORY,
        FeatureFlag.CRM,
        FeatureFlag.SALES,
        FeatureFlag.VEHICLE_HISTORY,
        FeatureFlag.SERVICE_RO,
        FeatureFlag.PARTS,
        FeatureFlag.ADVANCED_DASHBOARD,
      ],
      'dealers_enterprise': [
        // Todos os features
        ...Object.values(FeatureFlag),
      ],
      // Oficinas
      'workshops_starter': [
        FeatureFlag.SERVICE_ORDERS,
        FeatureFlag.APPOINTMENTS,
        FeatureFlag.PARTS_BASIC,
        FeatureFlag.VEHICLE_HISTORY_WRITE,
      ],
      'workshops_professional': [
        FeatureFlag.SERVICE_ORDERS,
        FeatureFlag.APPOINTMENTS,
        FeatureFlag.PARTS,
        FeatureFlag.VEHICLE_HISTORY_WRITE,
        FeatureFlag.DASHBOARD,
        FeatureFlag.AUTOMATIONS,
      ],
      'workshops_enterprise': [
        // Todos os features
        ...Object.values(FeatureFlag),
      ],
    };

    return planFeatureMap[plan] || [];
  }
}
```

### 3. Uso no Controller

```typescript
// modules/dealers/vehicle-history/vehicle-history.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { FeatureFlagGuard, RequireFeature, FeatureFlag } from '../../../common';

@Controller('vehicle-history')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
export class VehicleHistoryController {
  @Get()
  @RequireFeature(FeatureFlag.VEHICLE_HISTORY)
  async getHistory() {
    // Apenas tenants com Vehicle History podem acessar
  }
}
```

---

## 🗄️ Seed Data (Dados Iniciais)

### Estratégia: Seed por Módulo

Criar seeds para dados comuns que facilitam onboarding:

### 1. Serviços Comuns (Oficinas)

```typescript
// prisma/seeds/workshop-services.seed.ts
export const workshopServices = [
  {
    name: 'Revisão Completa',
    description: 'Revisão completa do veículo',
    estimatedHours: 2.0,
    category: 'MANUTENCAO',
  },
  {
    name: 'Troca de Óleo',
    description: 'Troca de óleo e filtro',
    estimatedHours: 0.5,
    category: 'MANUTENCAO',
  },
  {
    name: 'Alinhamento e Balanceamento',
    description: 'Alinhamento e balanceamento de rodas',
    estimatedHours: 1.0,
    category: 'SUSPENSAO',
  },
  {
    name: 'Troca de Pneus',
    description: 'Troca de pneus',
    estimatedHours: 1.0,
    category: 'PNEUS',
  },
  {
    name: 'Troca de Pastilhas',
    description: 'Troca de pastilhas de freio',
    estimatedHours: 1.5,
    category: 'FREIOS',
  },
  {
    name: 'Diagnóstico Eletrônico',
    description: 'Leitura de códigos de erro',
    estimatedHours: 0.5,
    category: 'DIAGNOSTICO',
  },
  {
    name: 'Lavagem Completa',
    description: 'Lavagem interna e externa',
    estimatedHours: 1.0,
    category: 'ESTETICA',
  },
  // ... mais serviços
];
```

### 2. Problemas Comuns (Checklist)

```typescript
// prisma/seeds/common-problems.seed.ts
export const commonProblems = [
  {
    name: 'Óleo abaixo do mínimo',
    category: 'MANUTENCAO',
    severity: 'MEDIA',
    estimatedCost: 150.00,
  },
  {
    name: 'Pneus desgastados',
    category: 'PNEUS',
    severity: 'ALTA',
    estimatedCost: 800.00,
  },
  {
    name: 'Pastilhas de freio gastas',
    category: 'FREIOS',
    severity: 'ALTA',
    estimatedCost: 300.00,
  },
  {
    name: 'Bateria fraca',
    category: 'ELETRICA',
    severity: 'MEDIA',
    estimatedCost: 400.00,
  },
  {
    name: 'Ar condicionado sem gás',
    category: 'AR_CONDICIONADO',
    severity: 'BAIXA',
    estimatedCost: 200.00,
  },
  // ... mais problemas
];
```

### 3. Categorias de Peças

```typescript
// prisma/seeds/parts-categories.seed.ts
export const partsCategories = [
  { name: 'Motor', code: 'MOTOR' },
  { name: 'Transmissão', code: 'TRANSMISSAO' },
  { name: 'Suspensão', code: 'SUSPENSAO' },
  { name: 'Freios', code: 'FREIOS' },
  { name: 'Elétrica', code: 'ELETRICA' },
  { name: 'Ar Condicionado', code: 'AR_CONDICIONADO' },
  { name: 'Pneus', code: 'PNEUS' },
  { name: 'Estética', code: 'ESTETICA' },
  // ... mais categorias
];
```

### 4. Tipos de Serviço (Dealers)

```typescript
// prisma/seeds/dealer-service-types.seed.ts
export const dealerServiceTypes = [
  {
    name: 'Venda de Veículo Novo',
    category: 'VENDA',
  },
  {
    name: 'Venda de Veículo Usado',
    category: 'VENDA',
  },
  {
    name: 'Trade-in',
    category: 'TRADE_IN',
  },
  {
    name: 'Financiamento',
    category: 'FINANCIAMENTO',
  },
  // ... mais tipos
];
```

### 5. Status de Pipeline (CRM)

```typescript
// prisma/seeds/crm-pipeline-statuses.seed.ts
export const pipelineStatuses = [
  { name: 'Novo', order: 1, color: '#3B82F6' },
  { name: 'Contatado', order: 2, color: '#8B5CF6' },
  { name: 'Interessado', order: 3, color: '#F59E0B' },
  { name: 'Proposta Enviada', order: 4, color: '#10B981' },
  { name: 'Negociando', order: 5, color: '#EF4444' },
  { name: 'Fechado Ganho', order: 6, color: '#059669' },
  { name: 'Fechado Perdido', order: 7, color: '#6B7280' },
];
```

### Implementação do Seed

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { workshopServices } from './seeds/workshop-services.seed';
import { commonProblems } from './seeds/common-problems.seed';
import { partsCategories } from './seeds/parts-categories.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed Services (para oficinas)
  console.log('📋 Seeding workshop services...');
  for (const service of workshopServices) {
    await prisma.workshopService.upsert({
      where: { name: service.name },
      update: {},
      create: service,
    });
  }

  // Seed Common Problems
  console.log('🔧 Seeding common problems...');
  for (const problem of commonProblems) {
    await prisma.commonProblem.upsert({
      where: { name: problem.name },
      update: {},
      create: problem,
    });
  }

  // Seed Parts Categories
  console.log('📦 Seeding parts categories...');
  for (const category of partsCategories) {
    await prisma.partsCategory.upsert({
      where: { code: category.code },
      update: {},
      create: category,
    });
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## 🚀 Estratégia de Desenvolvimento

### Fase 1: Backend Oficinas (Mais Rápido) ⭐

**Por que começar por Oficinas:**
- ✅ Escopo menor (menos módulos)
- ✅ Mais focado (service orders)
- ✅ Validação rápida do conceito
- ✅ Integração Vehicle History (escrita) é crítica

**Módulos a implementar:**
1. ✅ Core (Auth, Tenants, Users)
2. ✅ Service Orders
3. ✅ Agendamentos
4. ✅ Estoque básico
5. ✅ Vehicle History (escrita)
6. ✅ Faturamento básico

**Tempo estimado:** 6-8 semanas (MVP Oficinas)

---

### Fase 2: Backend Dealers

**Módulos a implementar:**
1. ✅ Inventory
2. ✅ CRM
3. ✅ Sales
4. ✅ Vehicle History (leitura)
5. ✅ Service/RO (completo)
6. ✅ Parts (completo)
7. ✅ Dashboard

**Tempo estimado:** 10-12 semanas (MVP Dealers)

---

## 📋 Checklist de Implementação Modular

### Setup Inicial

- [ ] Criar estrutura de módulos
- [ ] Implementar FeatureFlag decorator
- [ ] Implementar FeatureFlag guard
- [ ] Criar enum de FeatureFlags
- [ ] Mapear planos para features
- [ ] Criar seeds de dados iniciais

### Por Módulo

- [ ] Criar módulo NestJS
- [ ] Definir DTOs
- [ ] Implementar Service
- [ ] Implementar Controller
- [ ] Adicionar FeatureFlag guard
- [ ] Criar testes unitários
- [ ] Criar testes de integração
- [ ] Documentar no Swagger

---

## 💡 Sugestões Adicionais

### 1. Sistema de Templates

**Para Oficinas:**
- Templates de orçamento
- Templates de checklist
- Templates de email/SMS

**Para Dealers:**
- Templates de contrato
- Templates de proposta
- Templates de email

### 2. Sistema de Notificações

**Canais:**
- Email
- SMS (via Twilio/WhatsApp Business)
- Push (futuro)
- In-app

**Eventos:**
- RO finalizado → Cliente
- Agendamento confirmado → Cliente
- Lead quente → Vendedor
- Estoque baixo → Estoquista

### 3. Sistema de Relatórios Customizáveis

- Builder de relatórios
- Agendamento de relatórios
- Export (PDF, CSV, Excel)

### 4. Sistema de Integrações

**Marketplaces:**
- OLX
- Webmotors
- Autoline

**Gateways:**
- Stripe
- Pagar.me

**Contabilidade:**
- QuickBooks
- Contmatic

### 5. Sistema de Automações

**Workflows:**
- Se lead não responde em X dias → Enviar email
- Se estoque < mínimo → Criar pedido
- Se RO finalizado → Atualizar Vehicle History

### 6. Sistema de Analytics

- Event tracking
- User behavior
- Business intelligence
- Dashboards customizáveis

---

## 🎯 Resumo das Decisões

### ✅ Backend Único com Feature Flags

**Estrutura:**
```
apps/api/
├── modules/
│   ├── core/          # Sempre ativos
│   ├── dealers/       # Módulos Dealers
│   ├── workshops/     # Módulos Oficinas
│   └── shared/        # Compartilhados
```

### ✅ Começar por Oficinas

**Razão:** Mais rápido, validação rápida, integração crítica

### ✅ Seed Data Inicial

**Dados:**
- Serviços comuns
- Problemas comuns
- Categorias de peças
- Status de pipeline
- Templates

### ✅ Sistema Modular

**Implementação:**
- FeatureFlag decorator
- FeatureFlag guard
- Mapeamento plano → features
- Validação em runtime

---

**Documento criado em:** [Data]  
**Última atualização:** [Data]  
**Versão:** 1.0

