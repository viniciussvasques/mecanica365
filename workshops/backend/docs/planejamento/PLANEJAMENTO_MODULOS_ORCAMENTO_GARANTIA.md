# 📋 Planejamento: Módulos Orçamento e Garantia

**Data:** 2024-11-28  
**Status:** Planejamento

---

## 🎯 Módulos Solicitados

### 1. 📝 Módulo Orçamento (Quotes)

**Objetivo:** Gerenciar orçamentos independentes que podem ser convertidos em Service Orders.

**Características:**
- Orçamento pode ser criado ANTES de um Service Order
- Orçamento pode ser convertido em Service Order
- Orçamento pode ter múltiplas versões/revisões
- Orçamento pode expirar
- Orçamento pode ser aprovado/rejeitado pelo cliente

**Estados:**
- `draft` - Rascunho
- `sent` - Enviado ao cliente
- `viewed` - Visualizado pelo cliente
- `accepted` - Aceito pelo cliente
- `rejected` - Rejeitado pelo cliente
- `expired` - Expirado
- `converted` - Convertido em Service Order

**Integrações:**
- ✅ Service Orders (conversão)
- ✅ Customers
- ✅ Parts (peças do orçamento)
- ✅ Workshop Services (serviços do orçamento)
- ✅ Invoices (quando convertido)

---

### 2. 🛡️ Módulo Garantia (Warranty)

**Objetivo:** Gerenciar garantias de serviços e peças realizados.

**Características:**
- Garantia vinculada a Service Order ou Invoice
- Garantia pode ser de serviço ou peça
- Garantia tem período (dias/quilometragem)
- Garantia pode ser reclamada
- Histórico de garantias

**Tipos:**
- `service` - Garantia de serviço (ex: 90 dias)
- `part` - Garantia de peça (ex: 1 ano)
- `labor` - Garantia de mão de obra (ex: 30 dias)
- `combined` - Garantia combinada

**Estados:**
- `active` - Ativa
- `expired` - Expirada
- `claimed` - Reclamada
- `honored` - Honrada (serviço/peça substituída)
- `denied` - Negada

**Integrações:**
- ✅ Service Orders (origem)
- ✅ Invoices (vinculação)
- ✅ Customers (cliente)
- ✅ Parts (peças com garantia)
- ✅ Service Orders (para reclamar garantia)

---

## 💡 Sugestões de Módulos Adicionais

### 3. 📢 Módulo Notificações (Notifications)

**Objetivo:** Centralizar todas as notificações do sistema.

**Características:**
- Notificações in-app
- Notificações por email
- Notificações por SMS (futuro)
- Templates de notificações
- Histórico de notificações

**Tipos:**
- `appointment_reminder` - Lembrete de agendamento
- `quote_sent` - Orçamento enviado
- `quote_expiring` - Orçamento expirando
- `warranty_expiring` - Garantia expirando
- `service_order_status` - Mudança de status do RO
- `invoice_ready` - Fatura pronta
- `payment_received` - Pagamento recebido
- `low_stock` - Estoque baixo
- `warranty_claim` - Reclamação de garantia

**Integrações:**
- ✅ Todos os módulos (para gerar notificações)
- ✅ Email Service
- ✅ SMS Service (futuro)

---

### 4. 📊 Módulo Relatórios (Reports)

**Objetivo:** Gerar relatórios e dashboards para análise.

**Características:**
- Dashboard principal
- Relatórios pré-configurados
- Relatórios customizáveis (futuro)
- Export (PDF, Excel, CSV)
- Agendamento de relatórios (futuro)

**Relatórios Sugeridos:**
- Dashboard: Resumo geral
- Relatório de Vendas (por período)
- Relatório de Serviços (por período)
- Relatório de Peças (consumo, estoque)
- Relatório de Garantias (ativas, expiradas, reclamadas)
- Relatório de Orçamentos (taxa de conversão)
- Relatório de Clientes (frequência, ticket médio)
- Relatório Financeiro (receitas, despesas)

**Integrações:**
- ✅ Todos os módulos (para dados)
- ✅ Charts/Graphs library

---

### 5. 🚗 Módulo Veículos (Vehicles)

**Objetivo:** Gerenciar veículos de forma centralizada.

**Características:**
- CRUD de veículos
- Histórico completo do veículo
- Integração com Vehicle History Service
- Fotos do veículo
- Documentos do veículo

**Integrações:**
- ✅ Customers (proprietário)
- ✅ Service Orders (histórico de serviços)
- ✅ Quotes (orçamentos)
- ✅ Warranty (garantias)
- ✅ Vehicle History Service (histórico externo)

**Benefícios:**
- Separar lógica de veículos de Customers
- Melhor rastreamento
- Histórico mais completo

---

### 6. 🏭 Módulo Fornecedores (Suppliers)

**Objetivo:** Gerenciar fornecedores de peças.

**Características:**
- CRUD de fornecedores
- Contatos do fornecedor
- Histórico de compras
- Avaliações de fornecedores
- Integração com Parts

**Integrações:**
- ✅ Parts (fornecedor da peça)
- ✅ Part Movements (compras)
- ✅ Invoices (notas fiscais)

---

### 7. 📄 Módulo Templates (Templates)

**Objetivo:** Gerenciar templates reutilizáveis.

**Características:**
- Templates de orçamento
- Templates de email
- Templates de SMS
- Templates de relatórios
- Variáveis dinâmicas

**Tipos:**
- `quote_template` - Template de orçamento
- `email_template` - Template de email
- `sms_template` - Template de SMS
- `report_template` - Template de relatório

**Integrações:**
- ✅ Quotes (aplicar template)
- ✅ Notifications (usar template)
- ✅ Email Service (usar template)

---

### 8. 📸 Módulo Anexos (Attachments)

**Objetivo:** Gerenciar arquivos e fotos do sistema.

**Características:**
- Upload de arquivos
- Armazenamento (local/S3)
- Fotos de veículos
- Fotos de inspeção
- Documentos (CPF, CNH, etc.)
- Fotos de peças

**Integrações:**
- ✅ Service Orders (fotos de inspeção)
- ✅ Customers (documentos)
- ✅ Vehicles (fotos)
- ✅ Quotes (anexos)
- ✅ Warranty (comprovantes)

---

## 🏗️ Estrutura Proposta

### Schema do Banco de Dados

#### Quote (Orçamento)
```prisma
model Quote {
  id              String         @id @default(uuid())
  tenantId        String
  number          String         // Sequencial único por tenant
  customerId      String?
  vehicleId       String?        // Referência a Vehicle (futuro)
  serviceOrderId  String?        // Se convertido de um RO
  status          String         @default("draft")
  version         Int            @default(1)
  parentQuoteId   String?        // Para versões/revisões
  
  // Valores
  laborCost       Decimal?
  partsCost       Decimal?
  totalCost       Decimal
  discount        Decimal        @default(0)
  taxAmount       Decimal        @default(0)
  
  // Validade
  expiresAt       DateTime?
  validUntil      DateTime?
  
  // Aprovação
  sentAt          DateTime?
  viewedAt        DateTime?
  acceptedAt      DateTime?
  rejectedAt      DateTime?
  rejectedReason  String?
  
  // Conversão
  convertedAt     DateTime?
  convertedToServiceOrderId String?
  
  // Relações
  items           QuoteItem[]
  attachments     Attachment[]
  warranties      Warranty[]
  
  createdAt       DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  
  @@unique([tenantId, number])
  @@index([tenantId, status])
  @@index([tenantId, customerId])
}

model QuoteItem {
  id              String         @id @default(uuid())
  quoteId         String
  type            String         // "service" | "part"
  serviceId       String?
  partId          String?
  name            String
  description     String?
  quantity        Int
  unitCost        Decimal
  totalCost       Decimal
  hours           Decimal?       // Para serviços
  
  quote           Quote          @relation(fields: [quoteId], references: [id], onDelete: Cascade)
  
  @@index([quoteId])
}
```

#### Warranty (Garantia)
```prisma
model Warranty {
  id                String         @id @default(uuid())
  tenantId          String
  number            String         // Sequencial único
  
  // Origem
  serviceOrderId    String
  invoiceId         String?
  quoteId           String?        // Se veio de um orçamento
  
  // Tipo
  type              String         // "service" | "part" | "labor" | "combined"
  partId            String?        // Se garantia de peça específica
  
  // Período
  periodDays        Int            // Dias de garantia
  periodKm          Int?           // Quilometragem de garantia
  startsAt          DateTime
  expiresAt         DateTime
  
  // Status
  status            String         @default("active")
  
  // Reclamação
  claimedAt         DateTime?
  claimedReason     String?
  claimedBy         String?        // User ID
  honoredAt         DateTime?
  deniedAt          DateTime?
  deniedReason      String?
  
  // Service Order de garantia (quando reclamada)
  warrantyServiceOrderId String?
  
  // Relações
  customer          Customer?      @relation(fields: [customerId], references: [id])
  customerId       String?
  vehicleId        String?
  
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt
  
  @@unique([tenantId, number])
  @@index([tenantId, status])
  @@index([tenantId, serviceOrderId])
  @@index([expiresAt])
}
```

---

## 🔄 Fluxos de Integração

### Fluxo: Orçamento → Service Order

```
1. Cliente solicita serviço
   ↓
2. Criar Quote (draft)
   ↓
3. Adicionar itens (serviços e peças)
   ↓
4. Calcular totais
   ↓
5. Enviar Quote ao cliente (sent)
   ↓
6. Cliente visualiza (viewed)
   ↓
7. Cliente aceita (accepted)
   ↓
8. Converter Quote em Service Order
   ↓
9. Quote status = converted
   ↓
10. Service Order criado com status = scheduled
```

### Fluxo: Service Order → Garantia

```
1. Service Order completado
   ↓
2. Invoice gerado
   ↓
3. Criar Warranty automaticamente
   ↓
4. Warranty vinculada a Service Order e Invoice
   ↓
5. Warranty ativa por X dias/Km
   ↓
6. (Se reclamada) Criar novo Service Order de garantia
```

### Fluxo: Reclamação de Garantia

```
1. Cliente reclama garantia
   ↓
2. Verificar se garantia está ativa
   ↓
3. Verificar se está dentro do período
   ↓
4. Criar Warranty Claim
   ↓
5. Analisar reclamação
   ↓
6. Se aprovada: Criar Service Order de garantia (gratuito)
   ↓
7. Se negada: Registrar motivo
```

---

## 📦 Estrutura de Módulos NestJS

```
src/modules/workshops/
├── quotes/
│   ├── quotes.module.ts
│   ├── quotes.service.ts
│   ├── quotes.controller.ts
│   ├── dto/
│   │   ├── create-quote.dto.ts
│   │   ├── update-quote.dto.ts
│   │   ├── quote-item.dto.ts
│   │   └── convert-quote.dto.ts
│   └── quotes.service.spec.ts
│
├── warranty/
│   ├── warranty.module.ts
│   ├── warranty.service.ts
│   ├── warranty.controller.ts
│   ├── dto/
│   │   ├── create-warranty.dto.ts
│   │   ├── claim-warranty.dto.ts
│   │   └── warranty-response.dto.ts
│   └── warranty.service.spec.ts
│
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.service.ts
│   ├── notifications.controller.ts
│   └── templates/
│
├── reports/
│   ├── reports.module.ts
│   ├── reports.service.ts
│   ├── reports.controller.ts
│   └── dashboards/
│
├── vehicles/
│   ├── vehicles.module.ts
│   ├── vehicles.service.ts
│   └── vehicles.controller.ts
│
├── suppliers/
│   ├── suppliers.module.ts
│   ├── suppliers.service.ts
│   └── suppliers.controller.ts
│
└── templates/
    ├── templates.module.ts
    ├── templates.service.ts
    └── templates.controller.ts
```

---

## 🎯 Priorização Sugerida

### Fase 1 (Alta Prioridade)
1. ✅ **Quotes Module** - Essencial para fluxo de vendas
2. ✅ **Warranty Module** - Diferencial competitivo
3. ✅ **Notifications Module** - Melhora UX significativamente

### Fase 2 (Média Prioridade)
4. ✅ **Vehicles Module** - Organiza melhor os dados
5. ✅ **Reports Module** - Insights importantes
6. ✅ **Attachments Module** - Necessário para fotos/documentos

### Fase 3 (Baixa Prioridade)
7. ✅ **Suppliers Module** - Útil mas não crítico
8. ✅ **Templates Module** - Otimização

---

## 🔗 Integrações Necessárias

### Quotes ↔ Service Orders
- Converter Quote em Service Order
- Copiar itens do Quote para Service Order
- Manter referência do Quote no Service Order

### Warranty ↔ Service Orders
- Criar Warranty automaticamente ao completar Service Order
- Criar Service Order de garantia ao reclamar
- Vincular Warranty ao Invoice

### Warranty ↔ Parts
- Rastrear peças com garantia
- Verificar se peça está em garantia

### Notifications ↔ Todos
- Notificar mudanças de status
- Notificar expirações
- Notificar eventos importantes

---

## 📊 Métricas e KPIs Sugeridos

### Quotes
- Taxa de conversão (quotes → service orders)
- Tempo médio de resposta
- Taxa de aceitação
- Ticket médio

### Warranty
- Taxa de reclamação
- Tempo médio de resolução
- Custo de garantias
- Satisfação do cliente

---

## ✅ Checklist de Implementação

### Quotes Module
- [ ] Schema Prisma (Quote, QuoteItem)
- [ ] Migration
- [ ] DTOs
- [ ] Service (CRUD + conversão)
- [ ] Controller
- [ ] Testes unitários
- [ ] Testes E2E
- [ ] Swagger docs
- [ ] Integração com Service Orders

### Warranty Module
- [ ] Schema Prisma (Warranty)
- [ ] Migration
- [ ] DTOs
- [ ] Service (CRUD + reclamação)
- [ ] Controller
- [ ] Testes unitários
- [ ] Testes E2E
- [ ] Swagger docs
- [ ] Integração com Service Orders
- [ ] Criação automática ao completar RO

---

**Última atualização:** 2024-11-28  
**Próximos passos:** Aprovação e início da implementação




