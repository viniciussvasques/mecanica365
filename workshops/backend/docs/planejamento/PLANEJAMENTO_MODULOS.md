# 🏗️ PLANEJAMENTO COMPLETO DO SISTEMA - MECÂNICA365

## 📋 ÍNDICE

1. [Arquitetura de Módulos](#arquitetura-de-módulos)
2. [Sistema de Ativação por Plano](#sistema-de-ativação-por-plano)
3. [Módulos Principais](#módulos-principais)
4. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados)
5. [Permissões e Roles](#permissões-e-roles)
6. [Roadmap de Implementação](#roadmap-de-implementação)

---

## 🏛️ ARQUITETURA DE MÓDULOS

### Princípios

1. **Modularidade**: Cada módulo é independente e pode ser ativado/desativado
2. **Escalabilidade**: Fácil adicionar novos módulos sem quebrar existentes
3. **Multi-tenant**: Cada tenant tem seus próprios módulos ativos
4. **Plano-based**: Módulos são ativados conforme o plano do tenant
5. **Feature Flags**: Controle granular de funcionalidades

### Estrutura de Módulos

```
src/modules/
├── core/                    # Módulos core (sempre ativos)
│   ├── auth/               # Autenticação
│   ├── tenants/            # Gestão de tenants
│   ├── users/              # Gestão de usuários
│   ├── onboarding/         # Onboarding
│   └── billing/            # Faturamento/Assinaturas
│
├── features/               # Módulos de features (ativados por plano)
│   ├── elevators/          # Cadastro de Elevadores
│   ├── inventory/          # Inventário/Estoque
│   ├── service-orders/     # Ordens de Serviço (ROs)
│   ├── quotes/             # Orçamentos
│   ├── customers/          # Clientes
│   ├── vehicles/           # Veículos
│   ├── appointments/       # Agendamentos
│   ├── diagnostics/        # Diagnósticos OBD2
│   ├── reports/            # Relatórios
│   ├── suppliers/          # Fornecedores
│   ├── parts/              # Peças/Catálogo
│   └── documents/          # Geração de Documentos
│
└── shared/                 # Recursos compartilhados
    ├── email/              # Serviço de email
    ├── storage/            # Armazenamento de arquivos
    └── notifications/      # Notificações
```

---

## 🎯 SISTEMA DE ATIVAÇÃO POR PLANO

### Planos e Módulos

| Módulo | Starter | Professional | Enterprise |
|--------|---------|--------------|------------|
| **Core** | ✅ | ✅ | ✅ |
| Elevadores | ✅ (2) | ✅ (Ilimitado) | ✅ (Ilimitado) |
| Inventário | ✅ (100 peças) | ✅ (Ilimitado) | ✅ (Ilimitado) |
| Ordens de Serviço | ✅ (50/mês) | ✅ (Ilimitado) | ✅ (Ilimitado) |
| Orçamentos | ✅ | ✅ | ✅ |
| Clientes | ✅ (100) | ✅ (Ilimitado) | ✅ (Ilimitado) |
| Veículos | ✅ | ✅ | ✅ |
| Agendamentos | ✅ | ✅ | ✅ |
| Histórico Inteligente | ✅ (Básico) | ✅ (Completo) | ✅ (IA Avançada) |
| Nota Fiscal | ✅ (Manual) | ✅ (Automática) | ✅ (Completa) |
| Cobranças | ✅ (Básico) | ✅ (Gateways) | ✅ (Completo) |
| Diagnósticos OBD2 | ❌ | ✅ | ✅ |
| Relatórios Avançados | ❌ | ✅ | ✅ |
| Fornecedores | ❌ | ✅ | ✅ |
| Catálogo de Peças | ❌ | ✅ | ✅ |
| Geração de Documentos | ✅ (Básico) | ✅ (Avançado) | ✅ (Customizado) |
| Automações | ✅ (Básicas) | ✅ (Avançadas) | ✅ (IA) |
| API Access | ❌ | ✅ | ✅ |
| White Label | ❌ | ❌ | ✅ |
| Integrações Customizadas | ❌ | ❌ | ✅ |

### Implementação Técnica

```typescript
// src/modules/core/features/feature-flags.service.ts
@Injectable()
export class FeatureFlagsService {
  async isFeatureEnabled(tenantId: string, feature: string): Promise<boolean> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { subscription: { include: { plan: true } } }
    });

    const plan = tenant.subscription?.plan;
    return this.checkFeatureAccess(plan, feature);
  }

  private checkFeatureAccess(plan: string, feature: string): boolean {
    const featureMatrix = {
      workshops_starter: {
        elevators: { enabled: true, limit: 2 },
        inventory: { enabled: true, limit: 100 },
        service_orders: { enabled: true, limit: 50 },
        quotes: { enabled: true },
        customers: { enabled: true, limit: 100 },
        vehicles: { enabled: true },
        appointments: { enabled: true },
        diagnostics: { enabled: false },
        advanced_reports: { enabled: false },
        suppliers: { enabled: false },
        parts_catalog: { enabled: false },
        documents: { enabled: true, level: 'basic' },
        api_access: { enabled: false },
        white_label: { enabled: false },
        custom_integrations: { enabled: false },
      },
      workshops_professional: {
        // ... todos habilitados com limites maiores
      },
      workshops_enterprise: {
        // ... tudo ilimitado
      },
    };

    return featureMatrix[plan]?.[feature]?.enabled ?? false;
  }
}
```

---

## 📦 MÓDULOS PRINCIPAIS

### 1. 🏗️ ELEVADORES (Elevators)

**Funcionalidades:**
- ✅ Cadastro de elevadores (nome, número, tipo, capacidade)
- ✅ Status em tempo real (livre, ocupado, manutenção, agendado)
- ✅ Histórico de uso
- ✅ Agendamento de elevadores
- ✅ Notificações de status
- ✅ Relatórios de utilização

**Entidades:**
- `Elevator` (id, tenantId, name, number, type, capacity, status, createdAt, updatedAt)
- `ElevatorUsage` (id, elevatorId, serviceOrderId, startTime, endTime, notes)
- `ElevatorMaintenance` (id, elevatorId, scheduledDate, completedDate, notes, technicianId)

**Limites por Plano:**
- Starter: 2 elevadores
- Professional: Ilimitado
- Enterprise: Ilimitado

---

### 2. 📦 INVENTÁRIO (Inventory)

**Funcionalidades:**
- ✅ Cadastro de peças e materiais
- ✅ Categorização (filtros, óleos, pastilhas, etc.)
- ✅ Controle de estoque (entrada, saída, ajuste)
- ✅ Alertas de estoque baixo
- ✅ Movimentações (histórico completo)
- ✅ Múltiplos fornecedores
- ✅ Custo médio e preço de venda
- ✅ Relatórios de estoque
- ✅ Importação/Exportação

**Entidades:**
- `Part` (id, tenantId, code, name, description, category, unit, minStock, currentStock, costPrice, sellPrice, supplierId, createdAt, updatedAt)
- `InventoryMovement` (id, partId, type, quantity, unitPrice, totalValue, reason, userId, createdAt)
- `PartCategory` (id, tenantId, name, description, parentId)
- `StockAlert` (id, partId, threshold, notified, createdAt)

**Limites por Plano:**
- Starter: 100 peças
- Professional: Ilimitado
- Enterprise: Ilimitado

---

### 3. 🔧 ORDENS DE SERVIÇO (Service Orders)

**Funcionalidades:**
- ✅ Criação de ROs (número sequencial automático)
- ✅ Status (Aguardando, Em Andamento, Aguardando Peça, Finalizada, Cancelada)
- ✅ Vinculação com cliente e veículo
- ✅ Lista de serviços realizados
- ✅ Lista de peças utilizadas
- ✅ Atribuição de mecânico
- ✅ Elevador utilizado
- ✅ Fotos e anexos
- ✅ Histórico completo
- ✅ Relatórios detalhados
- ✅ Exportação PDF/Excel

**Entidades:**
- `ServiceOrder` (id, tenantId, number, customerId, vehicleId, status, mechanicId, elevatorId, startDate, endDate, totalValue, notes, createdAt, updatedAt)
- `ServiceOrderItem` (id, serviceOrderId, type, description, quantity, unitPrice, totalPrice, partId)
- `ServiceOrderAttachment` (id, serviceOrderId, fileName, fileUrl, fileType, uploadedBy, createdAt)
- `ServiceOrderStatusHistory` (id, serviceOrderId, status, changedBy, changedAt, notes)

**Limites por Plano:**
- Starter: 50 ROs/mês
- Professional: Ilimitado
- Enterprise: Ilimitado

---

### 4. 💰 ORÇAMENTOS (Quotes)

**Funcionalidades:**
- ✅ Criação de orçamentos
- ✅ Conversão de orçamento em OS
- ✅ Status (Pendente, Aprovado, Recusado, Expirado)
- ✅ Validade do orçamento
- ✅ Lista de serviços e peças
- ✅ Cálculo automático de totais
- ✅ Geração automática de documento PDF
- ✅ Envio por email
- ✅ Histórico de versões
- ✅ Templates personalizáveis

**Entidades:**
- `Quote` (id, tenantId, number, customerId, vehicleId, status, validUntil, totalValue, discount, finalValue, notes, createdAt, updatedAt)
- `QuoteItem` (id, quoteId, type, description, quantity, unitPrice, totalPrice, partId)
- `QuoteDocument` (id, quoteId, documentUrl, templateId, generatedAt, generatedBy)
- `QuoteTemplate` (id, tenantId, name, htmlTemplate, isDefault, createdAt, updatedAt)

**Geração de Documentos:**
- PDF com logo da oficina
- Informações do cliente e veículo
- Lista detalhada de serviços e peças
- Valores e totais
- Condições de pagamento
- Validade
- QR Code para aprovação rápida

**Limites por Plano:**
- Todos os planos: Ilimitado

---

### 5. 👥 CLIENTES (Customers)

**Funcionalidades:**
- ✅ Cadastro completo (nome, CPF/CNPJ, contatos, endereço)
- ✅ Histórico de serviços
- ✅ Histórico de veículos
- ✅ Histórico de orçamentos
- ✅ Fidelidade e pontos
- ✅ Notas e observações
- ✅ Importação em massa
- ✅ Busca avançada
- ✅ Relatórios

**Entidades:**
- `Customer` (id, tenantId, name, documentType, document, email, phone, address, city, state, zipCode, notes, createdAt, updatedAt)
- `CustomerNote` (id, customerId, note, createdBy, createdAt)
- `CustomerLoyalty` (id, customerId, points, level, totalSpent, lastPurchase)

**Limites por Plano:**
- Starter: 100 clientes
- Professional: Ilimitado
- Enterprise: Ilimitado

---

### 6. 🚗 VEÍCULOS (Vehicles)

**Funcionalidades:**
- ✅ Cadastro completo (placa, marca, modelo, ano, cor, km)
- ✅ Vinculação com cliente
- ✅ Histórico de serviços
- ✅ Histórico de orçamentos
- ✅ Fotos do veículo
- ✅ Documentos (CRLV, seguro, etc.)
- ✅ Alertas de manutenção preventiva
- ✅ Próxima revisão

**Entidades:**
- `Vehicle` (id, tenantId, customerId, plate, brand, model, year, color, km, chassis, engine, fuelType, notes, createdAt, updatedAt)
- `VehicleDocument` (id, vehicleId, type, documentUrl, expiryDate, createdAt)
- `VehiclePhoto` (id, vehicleId, photoUrl, description, uploadedAt)
- `VehicleMaintenanceAlert` (id, vehicleId, type, nextServiceDate, kmInterval, notified, createdAt)

**Limites por Plano:**
- Todos os planos: Ilimitado

---

### 7. 📅 AGENDAMENTOS (Appointments)

**Funcionalidades:**
- ✅ Criação de agendamentos
- ✅ Calendário visual
- ✅ Status (Agendado, Confirmado, Em Andamento, Concluído, Cancelado)
- ✅ Notificações (email, SMS)
- ✅ Lembretes automáticos
- ✅ Conflitos de horário
- ✅ Disponibilidade de elevadores
- ✅ Disponibilidade de mecânicos

**Entidades:**
- `Appointment` (id, tenantId, customerId, vehicleId, serviceOrderId, date, startTime, endTime, status, elevatorId, mechanicId, notes, createdAt, updatedAt)
- `AppointmentReminder` (id, appointmentId, sentAt, method, status)

**Limites por Plano:**
- Todos os planos: Ilimitado

---

### 8. 🔍 DIAGNÓSTICOS OBD2 (Diagnostics)

**Funcionalidades:**
- ✅ Integração com scanners OBD2
- ✅ Leitura de códigos de erro
- ✅ Histórico de diagnósticos
- ✅ Interpretação de códigos
- ✅ Sugestões de reparo
- ✅ Relatórios técnicos
- ✅ Exportação de dados

**Entidades:**
- `Diagnostic` (id, tenantId, vehicleId, serviceOrderId, scannerModel, codes, data, interpretation, suggestions, createdAt)
- `DiagnosticCode` (id, code, description, severity, category)

**Limites por Plano:**
- Starter: ❌
- Professional: ✅
- Enterprise: ✅

---

### 9. 📊 RELATÓRIOS (Reports)

**Funcionalidades:**
- ✅ Relatórios de receita
- ✅ Relatórios de serviços
- ✅ Relatórios de estoque
- ✅ Relatórios de clientes
- ✅ Relatórios de mecânicos
- ✅ Relatórios de elevadores
- ✅ Gráficos e dashboards
- ✅ Exportação (PDF, Excel, CSV)
- ✅ Agendamento de relatórios

**Entidades:**
- `Report` (id, tenantId, type, parameters, generatedAt, fileUrl, createdBy)
- `ReportTemplate` (id, tenantId, name, type, config, isDefault)

**Limites por Plano:**
- Starter: Relatórios básicos
- Professional: Relatórios avançados
- Enterprise: Relatórios customizados

---

### 10. 🏭 FORNECEDORES (Suppliers)

**Funcionalidades:**
- ✅ Cadastro de fornecedores
- ✅ Contatos e endereços
- ✅ Histórico de compras
- ✅ Avaliações
- ✅ Catálogo de produtos
- ✅ Preços e condições

**Entidades:**
- `Supplier` (id, tenantId, name, documentType, document, email, phone, address, notes, createdAt, updatedAt)
- `SupplierProduct` (id, supplierId, partId, supplierCode, price, minOrder, deliveryTime)

**Limites por Plano:**
- Starter: ❌
- Professional: ✅
- Enterprise: ✅

---

### 11. 📚 CATÁLOGO DE PEÇAS (Parts Catalog)

**Funcionalidades:**
- ✅ Catálogo completo de peças
- ✅ Busca por código, nome, categoria
- ✅ Compatibilidade de veículos
- ✅ Preços de mercado
- ✅ Imagens e especificações
- ✅ Sincronização com fornecedores

**Entidades:**
- `PartCatalog` (id, code, name, description, category, brand, compatibleVehicles, images, specifications)
- `PartCompatibility` (id, partId, brand, model, yearFrom, yearTo)

**Limites por Plano:**
- Starter: ❌
- Professional: ✅
- Enterprise: ✅

---

### 12. 📄 GERAÇÃO DE DOCUMENTOS (Documents)

**Funcionalidades:**
- ✅ Geração automática de PDFs
- ✅ Templates personalizáveis
- ✅ Orçamentos
- ✅ Ordens de Serviço
- ✅ Notas fiscais
- ✅ Recibos
- ✅ Relatórios
- ✅ Assinatura digital
- ✅ Envio automático por email

**Entidades:**
- `Document` (id, tenantId, type, entityId, templateId, fileUrl, generatedAt, generatedBy, sentAt)
- `DocumentTemplate` (id, tenantId, type, name, htmlTemplate, variables, isDefault, createdAt, updatedAt)

**Níveis por Plano:**
- Starter: Básico (templates padrão)
- Professional: Avançado (templates customizáveis)
- Enterprise: Customizado (templates totalmente personalizados)

---

### 13. 🧾 NOTA FISCAL (Invoices)

**Funcionalidades:**
- ✅ Emissão de notas fiscais (NFe)
- ✅ Integração com SEFAZ
- ✅ Cálculo automático de impostos
- ✅ Geração de XML
- ✅ Cancelamento de notas
- ✅ Carta de Correção
- ✅ Consulta de status
- ✅ Histórico completo
- ✅ Relatórios fiscais
- ✅ Backup de XMLs

**Entidades:**
- `Invoice` (id, tenantId, serviceOrderId, number, series, accessKey, status, issueDate, totalValue, taxes, xmlUrl, pdfUrl, createdAt, updatedAt)
- `InvoiceItem` (id, invoiceId, description, quantity, unitPrice, totalPrice, ncm, cst, cfop)
- `InvoiceTax` (id, invoiceId, type, baseValue, rate, value)
- `InvoiceCancellation` (id, invoiceId, reason, cancelledAt, cancelledBy)

**Integrações:**
- SEFAZ (API pública)
- Emissor de NFe (ex: Focus NFe, Bling, etc.)

**Limites por Plano:**
- Starter: Emissão básica (manual)
- Professional: Emissão automática + integração SEFAZ
- Enterprise: Emissão completa + múltiplas integrações

---

### 14. 💳 COBRANÇAS (Billing/Payments)

**Funcionalidades:**
- ✅ Gestão de cobranças
- ✅ Múltiplas formas de pagamento (Dinheiro, PIX, Cartão, Boleto)
- ✅ Parcelamento
- ✅ Contas a receber
- ✅ Controle de inadimplência
- ✅ Notificações de vencimento
- ✅ Relatórios financeiros
- ✅ Integração com gateways de pagamento
- ✅ Conciliação bancária
- ✅ Fluxo de caixa

**Entidades:**
- `Payment` (id, tenantId, serviceOrderId, customerId, type, method, amount, installments, status, dueDate, paidDate, createdAt, updatedAt)
- `PaymentInstallment` (id, paymentId, number, amount, dueDate, paidDate, status, createdAt)
- `PaymentMethod` (id, tenantId, name, type, enabled, config, createdAt, updatedAt)
- `Receivable` (id, tenantId, customerId, serviceOrderId, amount, dueDate, paidDate, status, notes, createdAt, updatedAt)

**Formas de Pagamento:**
- Dinheiro
- PIX (QR Code automático)
- Cartão de Crédito/Débito
- Boleto Bancário
- Transferência Bancária
- Cheque

**Limites por Plano:**
- Starter: Gestão básica
- Professional: Integração com gateways
- Enterprise: Múltiplas integrações + conciliação automática

---

### 15. 🤖 SISTEMA INTELIGENTE DE HISTÓRICO (Vehicle History Intelligence)

**Funcionalidades:**
- ✅ **Cadastro Automático de Veículo:**
  - Busca automática por placa (RENAVAN)
  - Busca automática por VIN (Chassis)
  - Preenchimento automático de dados (marca, modelo, ano, cor, etc.)
  - Validação de dados
  - Sugestão de correções

- ✅ **Histórico Automático:**
  - Registro automático de todos os serviços realizados
  - Histórico completo de manutenções
  - Histórico de peças utilizadas
  - Histórico de orçamentos
  - Histórico de diagnósticos
  - Timeline visual do veículo

- ✅ **Sugestões Inteligentes:**
  - **Troca de Óleo:** Sugere óleo correto baseado em:
    - Marca/Modelo/Ano do veículo
    - Tipo de motor
    - Última troca de óleo
    - KM atual vs KM da última troca
    - Especificações do fabricante
  
  - **Manutenção Preventiva:** Sugere serviços baseado em:
    - Manual do fabricante
    - Histórico do veículo
    - KM atual
    - Tempo desde última manutenção
    - Alertas automáticos
  
  - **Peças:** Sugere peças compatíveis:
    - Baseado em marca/modelo/ano
    - Histórico de peças já utilizadas
    - Compatibilidade automática
    - Preços de mercado

- ✅ **Alertas Inteligentes:**
  - Próxima revisão baseada em KM ou tempo
  - Troca de óleo pendente
  - Peças que precisam de atenção
  - Manutenções preventivas
  - Vencimento de documentos do veículo

**Entidades:**
- `VehicleHistory` (id, vehicleId, type, serviceOrderId, description, date, km, cost, notes, createdAt)
- `VehicleHistoryItem` (id, historyId, type, description, quantity, unitPrice, totalPrice, partId)
- `VehicleIntelligence` (id, vehicleId, lastOilChange, lastService, nextService, kmInterval, timeInterval, alerts, createdAt, updatedAt)
- `VehicleSuggestion` (id, vehicleId, type, suggestion, priority, dismissed, createdAt)

**Integrações:**
- API RENAVAN (consulta de dados do veículo)
- API de especificações de veículos
- Base de dados de compatibilidade de peças
- Manual do fabricante (digital)

**Limites por Plano:**
- Starter: Histórico básico + sugestões simples
- Professional: Histórico completo + sugestões inteligentes + integrações
- Enterprise: Histórico completo + IA avançada + múltiplas integrações

---

### 16. 🔍 BUSCA INTELIGENTE E AUTOMAÇÃO

**Funcionalidades:**
- ✅ **Busca Automática de Dados:**
  - Consulta RENAVAN por placa
  - Consulta VIN por chassis
  - Preenchimento automático de dados do veículo
  - Validação de documentos (CPF/CNPJ)
  - Busca de CEP automática

- ✅ **Automações:**
  - Criação automática de OS ao aprovar orçamento
  - Atualização automática de estoque ao finalizar OS
  - Geração automática de nota fiscal
  - Envio automático de emails
  - Criação automática de agendamentos
  - Alertas automáticos de manutenção

- ✅ **Regras de Negócio Inteligentes:**
  - Validação de compatibilidade de peças
  - Cálculo automático de preços
  - Sugestão de serviços baseado em histórico
  - Detecção de padrões
  - Previsão de necessidades

**Entidades:**
- `Automation` (id, tenantId, name, trigger, action, enabled, config, createdAt, updatedAt)
- `BusinessRule` (id, tenantId, name, type, condition, action, priority, enabled, createdAt, updatedAt)
- `DataLookup` (id, type, query, result, cachedAt, expiresAt)

**Limites por Plano:**
- Starter: Automações básicas
- Professional: Automações avançadas + regras customizadas
- Enterprise: Automações completas + IA + regras complexas

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### Schema Principal

```prisma
// Prisma Schema - Módulos

// ============================================
// CORE MODULES
// ============================================

model Tenant {
  id            String   @id @default(uuid())
  name          String
  documentType  String
  document      String
  subdomain     String   @unique
  adminEmail    String?
  plan          String
  status        String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  subscription  Subscription?
  users         User[]
  // ... outros relacionamentos
}

model Subscription {
  id                  String   @id @default(uuid())
  tenantId            String   @unique
  plan                String
  status              String
  stripeCustomerId    String?
  stripeSubscriptionId String?
  currentPeriodStart  DateTime?
  currentPeriodEnd    DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  
  tenant              Tenant   @relation(fields: [tenantId], references: [id])
}

// ============================================
// FEATURE MODULES
// ============================================

// ELEVATORS
model Elevator {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  number      String
  type        String
  capacity    Float
  status      String   @default("free") // free, occupied, maintenance, scheduled
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  usages      ElevatorUsage[]
  maintenance ElevatorMaintenance[]
  
  @@unique([tenantId, number])
}

model ElevatorUsage {
  id              String   @id @default(uuid())
  elevatorId      String
  serviceOrderId  String?
  startTime       DateTime
  endTime         DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  
  elevator        Elevator @relation(fields: [elevatorId], references: [id])
  serviceOrder    ServiceOrder? @relation(fields: [serviceOrderId], references: [id])
}

// INVENTORY
model Part {
  id            String   @id @default(uuid())
  tenantId      String
  code          String
  name          String
  description   String?
  categoryId    String?
  unit          String
  minStock      Int      @default(0)
  currentStock  Int      @default(0)
  costPrice     Decimal
  sellPrice     Decimal
  supplierId    String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  category      PartCategory? @relation(fields: [categoryId], references: [id])
  supplier      Supplier? @relation(fields: [supplierId], references: [id])
  movements     InventoryMovement[]
  alerts        StockAlert[]
  
  @@unique([tenantId, code])
  @@index([tenantId, categoryId])
}

model InventoryMovement {
  id          String   @id @default(uuid())
  partId      String
  type        String   // entry, exit, adjustment, return
  quantity    Int
  unitPrice   Decimal
  totalValue  Decimal
  reason      String?
  userId      String
  createdAt   DateTime @default(now())
  
  part        Part     @relation(fields: [partId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  
  @@index([partId, createdAt])
}

// SERVICE ORDERS
model ServiceOrder {
  id            String   @id @default(uuid())
  tenantId      String
  number        String   // Sequencial automático
  customerId   String
  vehicleId     String
  status        String   @default("pending") // pending, in_progress, waiting_parts, completed, cancelled
  mechanicId    String?
  elevatorId    String?
  startDate     DateTime?
  endDate       DateTime?
  totalValue    Decimal  @default(0)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  customer      Customer @relation(fields: [customerId], references: [id])
  vehicle       Vehicle  @relation(fields: [vehicleId], references: [id])
  mechanic      User?    @relation(fields: [mechanicId], references: [id])
  elevator      Elevator? @relation(fields: [elevatorId], references: [id])
  items         ServiceOrderItem[]
  attachments   ServiceOrderAttachment[]
  statusHistory ServiceOrderStatusHistory[]
  quotes        Quote[]
  appointments  Appointment[]
  
  @@unique([tenantId, number])
  @@index([tenantId, status])
  @@index([customerId])
  @@index([vehicleId])
}

model ServiceOrderItem {
  id          String   @id @default(uuid())
  serviceOrderId String
  type        String   // service, part
  description String
  quantity    Decimal  @default(1)
  unitPrice   Decimal
  totalPrice  Decimal
  partId      String?
  createdAt   DateTime @default(now())
  
  serviceOrder ServiceOrder @relation(fields: [serviceOrderId], references: [id])
  part         Part?        @relation(fields: [partId], references: [id])
}

// QUOTES
model Quote {
  id            String   @id @default(uuid())
  tenantId      String
  number        String
  customerId   String
  vehicleId     String
  status        String   @default("pending") // pending, approved, rejected, expired
  validUntil    DateTime
  totalValue    Decimal  @default(0)
  discount      Decimal  @default(0)
  finalValue    Decimal  @default(0)
  notes         String?
  serviceOrderId String? // Se convertido em OS
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  customer      Customer @relation(fields: [customerId], references: [id])
  vehicle       Vehicle  @relation(fields: [vehicleId], references: [id])
  serviceOrder  ServiceOrder? @relation(fields: [serviceOrderId], references: [id])
  items         QuoteItem[]
  documents     QuoteDocument[]
  
  @@unique([tenantId, number])
  @@index([tenantId, status])
}

model QuoteItem {
  id          String   @id @default(uuid())
  quoteId     String
  type        String   // service, part
  description String
  quantity    Decimal  @default(1)
  unitPrice   Decimal
  totalPrice  Decimal
  partId      String?
  createdAt   DateTime @default(now())
  
  quote       Quote    @relation(fields: [quoteId], references: [id])
  part        Part?    @relation(fields: [partId], references: [id])
}

model QuoteDocument {
  id          String   @id @default(uuid())
  quoteId     String
  documentUrl String
  templateId  String?
  generatedAt DateTime @default(now())
  generatedBy String
  
  quote       Quote    @relation(fields: [quoteId], references: [id])
  template    DocumentTemplate? @relation(fields: [templateId], references: [id])
}

// CUSTOMERS
model Customer {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  documentType String
  document    String
  email       String?
  phone       String?
  address     String?
  city        String?
  state       String?
  zipCode    String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  vehicles    Vehicle[]
  serviceOrders ServiceOrder[]
  quotes      Quote[]
  appointments Appointment[]
  notes       CustomerNote[]
  loyalty     CustomerLoyalty?
  payments    Payment[]
  receivables Receivable[]
  
  @@unique([tenantId, document])
  @@index([tenantId, name])
}

// VEHICLES
model Vehicle {
  id          String   @id @default(uuid())
  tenantId    String
  customerId  String
  plate       String
  renavan     String?  // RENAVAN para busca automática
  vin         String?  // VIN/Chassis para busca automática
  brand       String
  model       String
  year        Int
  color       String?
  km          Int?
  chassis     String?
  engine      String?
  fuelType    String?
  oilType     String?  // Tipo de óleo recomendado
  oilCapacity Float?   // Capacidade de óleo em litros
  notes       String?
  dataSource  String?  // 'manual', 'renavan', 'vin', 'api'
  lastDataSync DateTime? // Última sincronização de dados
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  customer    Customer @relation(fields: [customerId], references: [id])
  serviceOrders ServiceOrder[]
  quotes      Quote[]
  appointments Appointment[]
  documents   VehicleDocument[]
  photos      VehiclePhoto[]
  maintenanceAlerts VehicleMaintenanceAlert[]
  history     VehicleHistory[]
  intelligence VehicleIntelligence?
  
  @@unique([tenantId, plate])
  @@index([tenantId, customerId])
  @@index([tenantId, renavan])
  @@index([tenantId, vin])
}

// APPOINTMENTS
model Appointment {
  id            String   @id @default(uuid())
  tenantId      String
  customerId   String
  vehicleId     String
  serviceOrderId String?
  date          DateTime
  startTime     DateTime
  endTime       DateTime
  status        String   @default("scheduled") // scheduled, confirmed, in_progress, completed, cancelled
  elevatorId    String?
  mechanicId    String?
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  customer      Customer @relation(fields: [customerId], references: [id])
  vehicle       Vehicle  @relation(fields: [vehicleId], references: [id])
  serviceOrder  ServiceOrder? @relation(fields: [serviceOrderId], references: [id])
  elevator      Elevator? @relation(fields: [elevatorId], references: [id])
  mechanic      User?    @relation(fields: [mechanicId], references: [id])
  reminders     AppointmentReminder[]
  
  @@index([tenantId, date])
  @@index([elevatorId, date])
  @@index([mechanicId, date])
}

// DOCUMENTS
model Document {
  id          String   @id @default(uuid())
  tenantId    String
  type        String   // quote, service_order, invoice, receipt
  entityId    String   // ID da entidade relacionada
  templateId  String?
  fileUrl     String
  generatedAt DateTime @default(now())
  generatedBy String
  sentAt      DateTime?
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  template    DocumentTemplate? @relation(fields: [templateId], references: [id])
  
  @@index([tenantId, type, entityId])
}

model DocumentTemplate {
  id          String   @id @default(uuid())
  tenantId    String
  type        String
  name        String
  htmlTemplate String  @db.Text
  variables   Json?    // Variáveis disponíveis no template
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  documents   Document[]
  quoteDocuments QuoteDocument[]
  
  @@unique([tenantId, type, name])
}

// INVOICES (NOTA FISCAL)
model Invoice {
  id            String   @id @default(uuid())
  tenantId      String
  serviceOrderId String?
  number        String
  series        String   @default("1")
  accessKey     String?  // Chave de acesso NFe
  status        String   @default("draft") // draft, issued, cancelled, corrected
  issueDate     DateTime?
  totalValue    Decimal  @default(0)
  taxes         Decimal  @default(0)
  xmlUrl        String?
  pdfUrl        String?
  sefazStatus   String?  // Status na SEFAZ
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  serviceOrder  ServiceOrder? @relation(fields: [serviceOrderId], references: [id])
  items         InvoiceItem[]
  taxes         InvoiceTax[]
  cancellations InvoiceCancellation[]
  
  @@unique([tenantId, number, series])
  @@index([tenantId, accessKey])
}

model InvoiceItem {
  id          String   @id @default(uuid())
  invoiceId   String
  description String
  quantity    Decimal
  unitPrice   Decimal
  totalPrice  Decimal
  ncm         String?  // Nomenclatura Comum do Mercosul
  cst         String?  // Código de Situação Tributária
  cfop        String?  // Código Fiscal de Operações
  createdAt   DateTime @default(now())
  
  invoice     Invoice  @relation(fields: [invoiceId], references: [id])
}

model InvoiceTax {
  id          String   @id @default(uuid())
  invoiceId   String
  type        String   // ICMS, IPI, PIS, COFINS, etc.
  baseValue   Decimal
  rate        Decimal
  value       Decimal
  createdAt   DateTime @default(now())
  
  invoice     Invoice  @relation(fields: [invoiceId], references: [id])
}

model InvoiceCancellation {
  id          String   @id @default(uuid())
  invoiceId   String
  reason      String
  cancelledAt DateTime @default(now())
  cancelledBy String
  
  invoice     Invoice  @relation(fields: [invoiceId], references: [id])
}

// BILLING/PAYMENTS
model Payment {
  id            String   @id @default(uuid())
  tenantId      String
  serviceOrderId String?
  customerId    String
  type          String   // income, expense
  method        String   // cash, pix, card, boleto, transfer, check
  amount        Decimal
  installments  Int      @default(1)
  status        String   @default("pending") // pending, paid, cancelled, overdue
  dueDate       DateTime
  paidDate      DateTime?
  transactionId String?  // ID da transação no gateway
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  serviceOrder  ServiceOrder? @relation(fields: [serviceOrderId], references: [id])
  customer      Customer @relation(fields: [customerId], references: [id])
  installments  PaymentInstallment[]
  
  @@index([tenantId, status])
  @@index([customerId])
  @@index([dueDate])
}

model PaymentInstallment {
  id          String   @id @default(uuid())
  paymentId   String
  number      Int
  amount      Decimal
  dueDate     DateTime
  paidDate    DateTime?
  status      String   @default("pending") // pending, paid, overdue
  createdAt   DateTime @default(now())
  
  payment     Payment  @relation(fields: [paymentId], references: [id])
  
  @@unique([paymentId, number])
}

model PaymentMethod {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  type        String   // cash, pix, card, boleto, transfer, check
  enabled     Boolean  @default(true)
  config      Json?    // Configurações específicas (gateway, etc.)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, type])
}

model Receivable {
  id            String   @id @default(uuid())
  tenantId      String
  customerId    String
  serviceOrderId String?
  amount        Decimal
  dueDate       DateTime
  paidDate      DateTime?
  status        String   @default("pending") // pending, paid, overdue, cancelled
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  customer      Customer @relation(fields: [customerId], references: [id])
  serviceOrder  ServiceOrder? @relation(fields: [serviceOrderId], references: [id])
  
  @@index([tenantId, status])
  @@index([dueDate])
}

// VEHICLE HISTORY INTELLIGENCE
model VehicleHistory {
  id            String   @id @default(uuid())
  vehicleId     String
  type          String   // service, maintenance, repair, inspection, diagnostic
  serviceOrderId String?
  description   String
  date          DateTime
  km            Int?
  cost          Decimal?
  notes         String?
  createdAt     DateTime @default(now())
  
  vehicle       Vehicle  @relation(fields: [vehicleId], references: [id])
  serviceOrder  ServiceOrder? @relation(fields: [serviceOrderId], references: [id])
  items         VehicleHistoryItem[]
  
  @@index([vehicleId, date])
  @@index([vehicleId, type])
}

model VehicleHistoryItem {
  id          String   @id @default(uuid())
  historyId   String
  type        String   // service, part, labor
  description String
  quantity    Decimal
  unitPrice   Decimal
  totalPrice  Decimal
  partId      String?
  createdAt   DateTime @default(now())
  
  history     VehicleHistory @relation(fields: [historyId], references: [id])
  part        Part?          @relation(fields: [partId], references: [id])
}

model VehicleIntelligence {
  id              String   @id @default(uuid())
  vehicleId       String   @unique
  lastOilChange   DateTime?
  lastOilChangeKm Int?
  lastService     DateTime?
  lastServiceKm   Int?
  nextService     DateTime?
  nextServiceKm   Int?
  kmInterval      Int?     // Intervalo de KM para próxima manutenção
  timeInterval    Int?     // Intervalo de tempo em dias
  recommendedOil  String?  // Óleo recomendado
  alerts          Json?    // Alertas ativos
  suggestions     Json?    // Sugestões pendentes
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  vehicle         Vehicle  @relation(fields: [vehicleId], references: [id])
  suggestions    VehicleSuggestion[]
}

model VehicleSuggestion {
  id          String   @id @default(uuid())
  vehicleId   String
  intelligenceId String
  type        String   // oil_change, maintenance, part_replacement, inspection
  suggestion  String
  priority    String   @default("medium") // low, medium, high, critical
  dismissed   Boolean  @default(false)
  dismissedAt DateTime?
  createdAt   DateTime @default(now())
  
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  intelligence VehicleIntelligence @relation(fields: [intelligenceId], references: [id])
  
  @@index([vehicleId, dismissed])
}

// AUTOMATIONS
model Automation {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  trigger     String   // event, schedule, condition
  action      String   // create_os, update_stock, send_email, generate_invoice
  enabled     Boolean  @default(true)
  config      Json?    // Configurações específicas
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, enabled])
}

model BusinessRule {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  type        String   // validation, calculation, suggestion, alert
  condition   Json     // Condição da regra
  action      Json     // Ação a ser executada
  priority    Int      @default(0)
  enabled     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, enabled, priority])
}

model DataLookup {
  id          String   @id @default(uuid())
  type        String   // renavan, vin, cep, cpf, cnpj
  query       String
  result      Json
  cachedAt    DateTime @default(now())
  expiresAt   DateTime
  
  @@index([type, query])
  @@index([expiresAt])
}
```

---

## 🔐 PERMISSÕES E ROLES

### Roles do Sistema

```typescript
enum UserRole {
  ADMIN = 'admin',           // Acesso total
  MANAGER = 'manager',       // Gestão operacional
  MECHANIC = 'mechanic',     // Mecânico (criar/editar ROs)
  RECEPTIONIST = 'receptionist', // Recepção (clientes, agendamentos)
  STOCK_KEEPER = 'stock_keeper',  // Estoque
  VIEWER = 'viewer',         // Apenas visualização
}
```

### Matriz de Permissões

| Funcionalidade | Admin | Manager | Mechanic | Receptionist | Stock Keeper | Viewer |
|----------------|-------|---------|---------|--------------|--------------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Elevadores | ✅ | ✅ | ✅ | ✅ | ❌ | 👁️ |
| Inventário | ✅ | ✅ | ❌ | ❌ | ✅ | 👁️ |
| ROs | ✅ | ✅ | ✅ | ✅ | ❌ | 👁️ |
| Orçamentos | ✅ | ✅ | ❌ | ✅ | ❌ | 👁️ |
| Clientes | ✅ | ✅ | 👁️ | ✅ | ❌ | 👁️ |
| Veículos | ✅ | ✅ | 👁️ | ✅ | ❌ | 👁️ |
| Agendamentos | ✅ | ✅ | ❌ | ✅ | ❌ | 👁️ |
| Relatórios | ✅ | ✅ | ❌ | ❌ | ❌ | 👁️ |
| Configurações | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🗺️ ROADMAP DE IMPLEMENTAÇÃO

### Fase 1: Fundação (Sprint 1-2)
- [ ] Sistema de Feature Flags
- [ ] Módulo de Elevadores (CRUD básico)
- [ ] Módulo de Inventário (CRUD básico)
- [ ] Módulo de Clientes (CRUD básico)
- [ ] Módulo de Veículos (CRUD básico + busca automática RENAVAN/VIN)
- [ ] Sistema de Histórico Automático (base)

### Fase 2: Operações (Sprint 3-4)
- [ ] Módulo de Ordens de Serviço (CRUD completo)
- [ ] Módulo de Orçamentos (CRUD completo)
- [ ] Geração básica de documentos (PDF)
- [ ] Módulo de Agendamentos
- [ ] Sistema Inteligente de Sugestões (óleo, peças, serviços)
- [ ] Histórico Automático Completo

### Fase 3: Financeiro (Sprint 5-6)
- [ ] Módulo de Cobranças (múltiplas formas de pagamento)
- [ ] Módulo de Nota Fiscal (emissão básica)
- [ ] Integração com gateways de pagamento
- [ ] Contas a receber
- [ ] Relatórios financeiros

### Fase 4: Avançado (Sprint 7-8)
- [ ] Templates de documentos customizáveis
- [ ] Módulo de Diagnósticos OBD2
- [ ] Módulo de Relatórios Avançados
- [ ] Módulo de Fornecedores
- [ ] Catálogo de Peças
- [ ] Nota Fiscal completa (SEFAZ, XML, cancelamento)
- [ ] Automações avançadas

### Fase 5: Integrações e IA (Sprint 9-10)
- [ ] API REST completa
- [ ] Webhooks
- [ ] Integrações externas (RENAVAN, VIN, CEP)
- [ ] IA para sugestões inteligentes
- [ ] White Label (Enterprise)
- [ ] Sistema de regras de negócio customizáveis

---

## 📝 PRÓXIMOS PASSOS

1. **Criar migrations do Prisma** para todas as entidades
2. **Implementar FeatureFlagsService** para controle de módulos
3. **Criar módulos base** (Elevators, Inventory, ServiceOrders, Quotes)
4. **Implementar geração de documentos** (PDF com templates)
5. **Criar testes unitários** para cada módulo
6. **Documentar APIs** (Swagger/OpenAPI)

---

**Status:** 📋 Planejamento Completo
**Próxima Ação:** Implementar Fase 1 - Fundação

