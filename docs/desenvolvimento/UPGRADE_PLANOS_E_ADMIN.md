# Sistema de Upgrade de Planos e Painel Admin

**Versão:** 1.0  
**Data:** 2024  
**Objetivo:** Definir sistema de upgrade de planos e painel administrativo

---

## 🎯 Sistema de Upgrade de Planos

### Conceito

Permitir que tenants **façam upgrade/downgrade** de planos de forma **self-service** ou através do **painel admin**.

### Fluxos de Upgrade

#### 1. Upgrade de Plano

```
Tenant solicita upgrade
    ↓
Sistema valida pagamento
    ↓
Ativa novos módulos/features
    ↓
Notifica tenant
    ↓
Histórico registrado
```

#### 2. Downgrade de Plano

```
Tenant solicita downgrade
    ↓
Sistema valida (sem dados perdidos)
    ↓
Desativa módulos/features
    ↓
Prorate billing
    ↓
Notifica tenant
```

---

## 📋 Funcionalidades do Sistema de Upgrade

### Para Tenant (Self-Service)

1. **Visualizar Planos Disponíveis**
   - Comparação de features
   - Preços
   - Limites (ex: ROs/mês, consultas Vehicle History)

2. **Solicitar Upgrade**
   - Selecionar novo plano
   - Processar pagamento
   - Ativação imediata (se pagamento aprovado)

3. **Solicitar Downgrade**
   - Selecionar novo plano
   - Aviso sobre features perdidas
   - Efetivo no próximo ciclo de billing

4. **Histórico de Mudanças**
   - Ver todas as mudanças de plano
   - Invoices
   - Próxima cobrança

### Para Admin (Painel Admin)

1. **Gerenciar Planos**
   - Criar/editar/deletar planos
   - Definir features por plano
   - Definir preços

2. **Gerenciar Tenants**
   - Ver todos os tenants
   - Alterar plano manualmente
   - Ver uso (ROs, consultas, etc.)
   - Suspender/ativar tenant

3. **Aprovar Upgrades**
   - Se upgrade requer aprovação
   - Aprovar/rejeitar
   - Notificar tenant

4. **Analytics**
   - Tenants por plano
   - Churn rate
   - Revenue por plano
   - Upgrade/downgrade trends

---

## 🏗️ Estrutura de Dados

### Subscription Model

```prisma
model Subscription {
  id                    String   @id @default(uuid())
  tenantId              String   @unique
  tenant                Tenant   @relation(fields: [tenantId], references: [id])
  
  plan                  String   // dealers_basic, dealers_premium, workshops_starter, etc.
  status                String   // active, cancelled, past_due, suspended
  
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  
  // Features ativos
  activeFeatures        String[] // Array de FeatureFlags
  
  // Limites
  vehicleHistoryCredits       Int      @default(0)
  vehicleHistoryCreditsUsed   Int      @default(0)
  serviceOrdersLimit          Int?     // null = ilimitado
  serviceOrdersUsed           Int      @default(0)
  partsLimit                  Int?     // null = ilimitado
  
  // Billing
  stripeSubscriptionId  String?  @unique
  stripeCustomerId      String?
  billingCycle          String   // monthly, annual
  
  // Histórico
  planHistory           PlanChange[]
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model PlanChange {
  id              String   @id @default(uuid())
  subscriptionId  String
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  
  fromPlan        String
  toPlan          String
  changeType      String   // upgrade, downgrade, renewal
  effectiveDate   DateTime
  proratedAmount Decimal?
  
  reason          String?  // Motivo da mudança
  approvedBy      String?  // Admin que aprovou (se necessário)
  
  createdAt       DateTime @default(now())
}
```

---

## 🔧 Implementação

### 1. Service de Upgrade

```typescript
// modules/billing/upgrade.service.ts
@Injectable()
export class UpgradeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  async upgradePlan(
    tenantId: string,
    newPlan: string,
    paymentMethodId?: string,
  ): Promise<Subscription> {
    // 1. Buscar subscription atual
    const currentSubscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    if (!currentSubscription) {
      throw new NotFoundException('Subscription not found');
    }

    // 2. Validar upgrade (não pode fazer downgrade direto)
    const isValidUpgrade = this.validateUpgrade(
      currentSubscription.plan,
      newPlan,
    );

    if (!isValidUpgrade) {
      throw new BadRequestException('Invalid upgrade path');
    }

    // 3. Calcular prorated amount
    const proratedAmount = await this.calculateProratedAmount(
      currentSubscription,
      newPlan,
    );

    // 4. Processar pagamento (Stripe)
    if (paymentMethodId) {
      await this.stripeService.updateSubscription(
        currentSubscription.stripeSubscriptionId,
        newPlan,
        proratedAmount,
      );
    }

    // 5. Atualizar subscription
    const updatedSubscription = await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        plan: newPlan,
        activeFeatures: this.getPlanFeatures(newPlan),
        // Atualizar limites
        vehicleHistoryCredits: this.getPlanCredits(newPlan),
        serviceOrdersLimit: this.getPlanServiceOrdersLimit(newPlan),
        partsLimit: this.getPlanPartsLimit(newPlan),
        currentPeriodStart: new Date(),
        currentPeriodEnd: this.calculatePeriodEnd(newPlan),
      },
    });

    // 6. Registrar histórico
    await this.prisma.planChange.create({
      data: {
        subscriptionId: updatedSubscription.id,
        fromPlan: currentSubscription.plan,
        toPlan: newPlan,
        changeType: 'upgrade',
        effectiveDate: new Date(),
        proratedAmount,
      },
    });

    // 7. Ativar novos features
    await this.featureFlagService.activateFeatures(
      tenantId,
      updatedSubscription.activeFeatures,
    );

    // 8. Notificar tenant
    await this.notifyTenant(tenantId, 'upgrade', newPlan);

    return updatedSubscription;
  }

  async downgradePlan(
    tenantId: string,
    newPlan: string,
    effectiveDate?: Date,
  ): Promise<Subscription> {
    // Similar ao upgrade, mas:
    // - Efetivo no próximo ciclo (ou data especificada)
    // - Aviso sobre features perdidas
    // - Não processa pagamento imediato (prorated no próximo ciclo)
  }

  private validateUpgrade(fromPlan: string, toPlan: string): boolean {
    // Validar se upgrade é válido
    const planHierarchy = {
      dealers_basic: 1,
      dealers_premium: 2,
      dealers_enterprise: 3,
      workshops_starter: 1,
      workshops_professional: 2,
      workshops_enterprise: 3,
    };

    return planHierarchy[toPlan] > planHierarchy[fromPlan];
  }

  private async calculateProratedAmount(
    subscription: Subscription,
    newPlan: string,
  ): Promise<number> {
    // Calcular valor prorated baseado em:
    // - Dias restantes no período atual
    // - Diferença de preço entre planos
    // - Desconto anual (se aplicável)
  }

  private getPlanFeatures(plan: string): FeatureFlag[] {
    // Retornar features do plano
    const planFeatures = {
      dealers_basic: [FeatureFlag.INVENTORY, FeatureFlag.CRM, FeatureFlag.SALES],
      dealers_premium: [
        ...this.getPlanFeatures('dealers_basic'),
        FeatureFlag.VEHICLE_HISTORY,
        FeatureFlag.SERVICE_RO,
        FeatureFlag.PARTS,
      ],
      // ... outros planos
    };

    return planFeatures[plan] || [];
  }
}
```

### 2. Controller de Upgrade

```typescript
// modules/billing/upgrade.controller.ts
@Controller('billing/upgrade')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UpgradeController {
  constructor(private readonly upgradeService: UpgradeService) {}

  @Get('plans')
  async getAvailablePlans(@Req() req: Request) {
    const tenantId = req['tenantId'];
    const currentPlan = await this.getCurrentPlan(tenantId);

    return {
      currentPlan,
      availablePlans: this.getAvailablePlans(currentPlan),
      comparison: this.getPlanComparison(),
    };
  }

  @Post('upgrade')
  async upgrade(
    @Req() req: Request,
    @Body() dto: UpgradePlanDto,
  ): Promise<Subscription> {
    const tenantId = req['tenantId'];
    return this.upgradeService.upgradePlan(
      tenantId,
      dto.newPlan,
      dto.paymentMethodId,
    );
  }

  @Post('downgrade')
  async downgrade(
    @Req() req: Request,
    @Body() dto: DowngradePlanDto,
  ): Promise<Subscription> {
    const tenantId = req['tenantId'];
    return this.upgradeService.downgradePlan(
      tenantId,
      dto.newPlan,
      dto.effectiveDate,
    );
  }

  @Get('history')
  async getHistory(@Req() req: Request) {
    const tenantId = req['tenantId'];
    return this.upgradeService.getPlanHistory(tenantId);
  }
}
```

---

## 🎛️ Painel Admin

### Funcionalidades

#### 1. Dashboard Admin

**Métricas:**
- Total de tenants
- Tenants por plano
- Revenue (MRR, ARR)
- Churn rate
- Novos tenants (últimos 30 dias)
- Uso de features (Vehicle History, ROs, etc.)

**Gráficos:**
- Revenue por período
- Tenants por plano (pie chart)
- Churn por período
- Upgrade/downgrade trends

#### 2. Gerenciamento de Tenants

**Listagem:**
- Filtros: plano, status, data criação
- Busca: nome, CNPJ, email
- Ordenação: data criação, revenue, uso

**Ações:**
- Ver detalhes do tenant
- Alterar plano manualmente
- Suspender/ativar tenant
- Ver uso (ROs, consultas, etc.)
- Ver histórico de mudanças
- Ver invoices

#### 3. Gerenciamento de Planos

**CRUD de Planos:**
- Criar/editar/deletar planos
- Definir features por plano
- Definir preços (mensal/anual)
- Definir limites (ROs, consultas, etc.)
- Ativar/desativar planos

**Estrutura de Plano:**
```typescript
interface Plan {
  id: string;
  name: string;
  type: 'dealers' | 'workshops';
  price: {
    monthly: number;
    annual: number; // Com desconto
  };
  features: FeatureFlag[];
  limits: {
    vehicleHistoryCredits?: number; // null = ilimitado
    serviceOrdersLimit?: number;
    partsLimit?: number;
    storesLimit?: number;
  };
  isActive: boolean;
}
```

#### 4. Aprovações

**Upgrades que Requerem Aprovação:**
- Enterprise plans (pode requerer aprovação)
- Upgrades com desconto customizado
- Upgrades de tenants suspensos

**Fluxo:**
```
Tenant solicita upgrade
    ↓
Sistema cria approval request
    ↓
Admin recebe notificação
    ↓
Admin aprova/rejeita
    ↓
Sistema processa upgrade (se aprovado)
    ↓
Notifica tenant
```

#### 5. Analytics e Relatórios

**Relatórios:**
- Revenue report
- Tenant growth report
- Churn analysis
- Feature usage report
- Plan comparison report

**Export:**
- PDF
- CSV
- Excel

---

## 🏗️ Estrutura do Painel Admin

### Backend (NestJS)

```
apps/admin-panel-api/
├── src/
│   ├── modules/
│   │   ├── auth/              # Auth admin
│   │   ├── dashboard/         # Dashboard admin
│   │   ├── tenants/           # Gerenciamento tenants
│   │   ├── plans/             # Gerenciamento planos
│   │   ├── approvals/         # Aprovações
│   │   ├── analytics/          # Analytics
│   │   └── reports/           # Relatórios
│   └── common/
│       ├── guards/
│       │   └── admin.guard.ts # Guard para validar admin
│       └── decorators/
│           └── admin.decorator.ts
```

### Frontend (Next.js)

```
apps/admin-panel/
├── app/
│   ├── (auth)/               # Login admin
│   ├── (dashboard)/          # Dashboard
│   │   ├── tenants/          # Listagem/gestão tenants
│   │   ├── plans/            # Gestão planos
│   │   ├── approvals/        # Aprovações
│   │   ├── analytics/        # Analytics
│   │   └── settings/         # Configurações
│   └── layout.tsx
```

---

## 🔐 Autenticação Admin

### Roles Admin

```typescript
enum AdminRole {
  SUPER_ADMIN = 'super_admin',      // Acesso total
  ADMIN = 'admin',                  // Gerenciar tenants, planos
  SUPPORT = 'support',              // Ver tenants, suporte
  FINANCE = 'finance',              // Ver billing, invoices
  ANALYST = 'analyst',              // Ver analytics apenas
}
```

### Permissões

| Ação | SUPER_ADMIN | ADMIN | SUPPORT | FINANCE | ANALYST |
|------|-------------|-------|---------|---------|---------|
| Ver tenants | ✅ | ✅ | ✅ | ✅ | ✅ |
| Editar tenant | ✅ | ✅ | ⚠️ Limitado | ❌ | ❌ |
| Suspender tenant | ✅ | ✅ | ❌ | ❌ | ❌ |
| Criar/editar planos | ✅ | ✅ | ❌ | ❌ | ❌ |
| Ver billing | ✅ | ✅ | ❌ | ✅ | ❌ |
| Ver analytics | ✅ | ✅ | ❌ | ❌ | ✅ |
| Aprovar upgrades | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 📋 User Stories

### US-ADMIN-001: Visualizar Dashboard Admin

**Como** Admin  
**Quero** ver dashboard com métricas principais  
**Para que** acompanhar saúde do negócio

**Critérios de Aceitação:**
- Métricas: total tenants, MRR, churn rate, novos tenants
- Gráficos: revenue, tenants por plano, churn
- Filtros: período (últimos 7, 30, 90 dias)
- Export PDF/CSV

---

### US-ADMIN-002: Listar Tenants

**Como** Admin  
**Quero** listar todos os tenants  
**Para que** gerenciar clientes

**Critérios de Aceitação:**
- Filtros: plano, status, data criação
- Busca: nome, CNPJ, email
- Ordenação: data, revenue, uso
- Paginação (50 por página)
- Ações: ver detalhes, editar, suspender

---

### US-ADMIN-003: Alterar Plano de Tenant

**Como** Admin  
**Quero** alterar plano de um tenant manualmente  
**Para que** ajustar billing ou oferecer desconto

**Critérios de Aceitação:**
- Selecionar novo plano
- Opção de aplicar desconto
- Calcular prorated amount
- Confirmar mudança
- Registrar histórico
- Notificar tenant

---

### US-ADMIN-004: Criar/Editar Plano

**Como** Admin  
**Quero** criar ou editar planos  
**Para que** ajustar ofertas

**Critérios de Aceitação:**
- Campos: nome, tipo (dealers/workshops), preço, features, limites
- Validação de features
- Preview de plano
- Ativar/desativar plano
- Histórico de mudanças

---

### US-ADMIN-005: Aprovar Upgrade

**Como** Admin  
**Quero** aprovar upgrades pendentes  
**Para que** controlar upgrades de planos Enterprise

**Critérios de Aceitação:**
- Lista de upgrades pendentes
- Ver detalhes do tenant
- Aprovar/rejeitar
- Adicionar nota (opcional)
- Notificar tenant

---

## 🚀 Roadmap de Implementação

### Fase 1: Sistema de Upgrade Básico (MVP)

- [ ] Model Subscription com planHistory
- [ ] Service de upgrade/downgrade
- [ ] Controller de upgrade
- [ ] Integração com Stripe
- [ ] Notificações básicas

### Fase 2: Painel Admin Básico

- [ ] Auth admin
- [ ] Dashboard com métricas básicas
- [ ] Listagem de tenants
- [ ] Alterar plano manualmente

### Fase 3: Painel Admin Completo

- [ ] Gerenciamento de planos (CRUD)
- [ ] Sistema de aprovações
- [ ] Analytics avançado
- [ ] Relatórios customizáveis

---

## 📊 Modelo de Dados Completo

```prisma
model Plan {
  id          String   @id @default(uuid())
  name        String
  type        String   // dealers, workshops
  code        String   @unique // dealers_basic, workshops_starter
  
  priceMonthly Decimal
  priceAnnual  Decimal
  
  features    String[] // Array de FeatureFlags
  limits      Json     // { vehicleHistoryCredits, serviceOrdersLimit, etc }
  
  isActive    Boolean  @default(true)
  
  subscriptions Subscription[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Subscription {
  id                    String   @id @default(uuid())
  tenantId              String   @unique
  tenant                Tenant   @relation(fields: [tenantId], references: [id])
  
  planId                String
  plan                  Plan     @relation(fields: [planId], references: [id])
  
  status                String   // active, cancelled, past_due, suspended
  
  currentPeriodStart    DateTime
  currentPeriodEnd      DateTime
  
  activeFeatures        String[]
  vehicleHistoryCredits       Int      @default(0)
  vehicleHistoryCreditsUsed   Int      @default(0)
  serviceOrdersLimit          Int?
  serviceOrdersUsed           Int      @default(0)
  
  stripeSubscriptionId  String?  @unique
  stripeCustomerId      String?
  billingCycle          String   // monthly, annual
  
  planHistory           PlanChange[]
  
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}

model PlanChange {
  id              String   @id @default(uuid())
  subscriptionId  String
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  
  fromPlanId      String
  toPlanId        String
  changeType      String   // upgrade, downgrade, renewal
  effectiveDate   DateTime
  proratedAmount  Decimal?
  
  reason          String?
  approvedBy      String?  // Admin ID
  
  createdAt       DateTime @default(now())
}
```

---

**Documento criado em:** [Data]  
**Última atualização:** [Data]  
**Versão:** 1.0

