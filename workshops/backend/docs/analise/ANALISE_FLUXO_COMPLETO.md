# 🔄 Análise Completa do Fluxo do Sistema - Mecânica365

**Data:** 01/12/2025  
**Objetivo:** Mapear o fluxo completo do sistema, identificar gaps e módulos faltantes

---

## 📊 Fluxo Atual Mapeado

### 1. **Entrada do Cliente** ✅
```
Cliente chega → Cadastro do Cliente → Cadastro do Veículo
```
- ✅ **Módulo:** `CustomersModule` - Implementado
- ✅ **Módulo:** `VehiclesModule` - Implementado
- ✅ **Funcionalidades:** CRUD completo, validações, histórico

---

### 2. **Criação do Orçamento** ✅
```
Recepcionista cria orçamento → Status: DRAFT
```
- ✅ **Módulo:** `QuotesModule` - Implementado
- ✅ **Funcionalidades:**
  - Criação de orçamento
  - Vinculação com cliente e veículo
  - Problema relatado pelo cliente
  - Status: `DRAFT`

**Gaps Identificados:**
- ❌ **Faltando:** Upload de fotos do veículo no momento da criação
- ❌ **Faltando:** Checklist pré-diagnóstico

---

### 3. **Envio para Mecânico** ✅
```
Orçamento enviado → Status: AWAITING_DIAGNOSIS → Mecânico recebe notificação
```
- ✅ **Módulo:** `QuotesModule` - Implementado
- ✅ **Funcionalidades:**
  - Atribuição de mecânico (manual ou automática)
  - Status: `AWAITING_DIAGNOSIS`
  - Notificações para mecânicos

**Gaps Identificados:**
- ⚠️ **Parcial:** Sistema de fila para mecânicos (existe, mas pode melhorar
- ❌ **Faltando:** Visualização de fotos do veículo pelo mecânico

---

### 4. **Diagnóstico do Mecânico** ✅
```
Mecânico faz diagnóstico → Completa diagnóstico → Status: DIAGNOSED
```
- ✅ **Módulo:** `QuotesModule` - Implementado
- ✅ **Módulo:** `SharedModule/Diagnostic` - Implementado
- ✅ **Funcionalidades:**
  - Diagnóstico completo
  - Problema identificado
  - Sugestões de serviços/peças
  - Status: `DIAGNOSED`

**Gaps Identificados:**
- ❌ **Faltando:** Upload de fotos durante diagnóstico
- ❌ **Faltando:** Checklist de inspeção para mecânico
- ❌ **Faltando:** Campo de observações do mecânico no diagnóstico

---

### 5. **Retorno para Recepcionista** ✅
```
Diagnóstico completo → Recepcionista recebe notificação → Preenche valores
```
- ✅ **Módulo:** `QuotesModule` - Implementado
- ✅ **Funcionalidades:**
  - Notificação para recepcionista
  - Preenchimento automático de valores sugeridos
  - Edição de valores pelo recepcionista
  - Status: `DIAGNOSED`

**Gaps Identificados:**
- ⚠️ **Parcial:** Preenchimento automático de valores (existe, mas pode melhorar)

---

### 6. **Envio para Cliente** ✅
```
Recepcionista envia orçamento → Status: SENT → Cliente recebe link público
```
- ✅ **Módulo:** `QuotesModule` - Implementado
- ✅ **Funcionalidades:**
  - Geração de link público
  - Envio por email/WhatsApp
  - Status: `SENT`, `VIEWED`
  - PDF do orçamento

**Gaps Identificados:**
- ✅ **OK:** Sistema de link público funcionando

---

### 7. **Aprovação do Cliente** ✅
```
Cliente aprova → Status: ACCEPTED → Gera Service Order
```
- ✅ **Módulo:** `QuotesModule` - Implementado
- ✅ **Módulo:** `ServiceOrdersModule` - Implementado
- ✅ **Funcionalidades:**
  - Aprovação digital ou manual
  - Assinatura digital
  - Geração automática de Service Order
  - Status: `ACCEPTED`, `CONVERTED`

**Gaps Identificados:**
- ❌ **Faltando:** Sistema de agendamento automático após aprovação
- ❌ **Faltando:** Verificação de disponibilidade de elevador
- ❌ **Faltando:** Verificação de fila de serviços

---

### 8. **Agendamento do Serviço** ⚠️ **SCHEMA EXISTE, MÓDULO FALTANDO**
```
Service Order criada → Status: SCHEDULED → Precisa agendar
```
- ⚠️ **Schema:** Model `Appointment` existe no Prisma
- ❌ **Módulo:** `AppointmentsModule` - **NÃO IMPLEMENTADO** (diretório vazio)
- ⚠️ **Status Atual:** Service Order criada com status `SCHEDULED`, mas sem sistema de agendamento funcional

**Schema Existente:**
```prisma
model Appointment {
  id             String        @id @default(uuid())
  tenantId       String
  customerId     String?
  serviceOrderId String?
  assignedToId   String?
  date           DateTime
  duration       Int           @default(60)
  serviceType    String?
  notes          String?
  status         String        @default("scheduled")
  reminderSent   Boolean       @default(false)
  ...
}
```

**Gaps Identificados:**
- ❌ **Faltando:** Service, Controller, DTOs do AppointmentsModule
- ❌ **Faltando:** Verificação de disponibilidade de elevador
- ❌ **Faltando:** Verificação de fila de serviços
- ❌ **Faltando:** Calendário de disponibilidade
- ❌ **Faltando:** Notificações de agendamento
- ❌ **Faltando:** Integração automática após aprovação de orçamento

---

### 9. **Início do Trabalho** ✅
```
Mecânico inicia serviço → Status: IN_PROGRESS → Elevador ocupado
```
- ✅ **Módulo:** `ServiceOrdersModule` - Implementado
- ✅ **Módulo:** `ElevatorsModule` - Implementado
- ✅ **Funcionalidades:**
  - Início de serviço
  - Ocupação de elevador
  - Status: `IN_PROGRESS`
  - Registro de `startedAt`

**Gaps Identificados:**
- ❌ **Faltando:** Checklist pré-serviço para mecânico
- ⚠️ **Parcial:** Upload de fotos (campo `inspectionPhotos` existe, mas sem sistema de upload estruturado)

---

### 10. **Execução do Serviço** ⚠️ **PARCIAL**
```
Mecânico executa serviço → Registra serviços/peças → Atualiza progresso
```
- ✅ **Módulo:** `ServiceOrdersModule` - Implementado
- ✅ **Funcionalidades:**
  - Registro de serviços executados
  - Registro de peças utilizadas
  - Atualização de progresso

**Gaps Identificados:**
- ❌ **Faltando:** Checklist durante o serviço
- ⚠️ **Parcial:** Upload de fotos (campo `inspectionPhotos` existe, mas sem sistema de upload estruturado)
- ⚠️ **Parcial:** Campo de observações (existe `diagnosticNotes`, mas falta campo específico para observações durante execução)

---

### 11. **Finalização do Serviço** ⚠️ **PARCIAL**
```
Mecânico finaliza → Status: COMPLETED → Elevador liberado
```
- ✅ **Módulo:** `ServiceOrdersModule` - Implementado
- ✅ **Funcionalidades:**
  - Finalização de serviço
  - Liberação de elevador
  - Status: `COMPLETED`
  - Registro de `completedAt`

**Gaps Identificados:**
- ❌ **Faltando:** Checklist pós-serviço
- ⚠️ **Parcial:** Upload de fotos (campo `inspectionPhotos` existe, mas sem sistema de upload estruturado)
- ⚠️ **Parcial:** Campo de observações (existe `diagnosticNotes` e `inspectionNotes`, mas falta campo específico para observações finais)
- ❌ **Faltando:** Validação de checklist antes de finalizar

---

## 🔍 Análise de Gaps por Módulo

### ✅ Módulos Completos

1. **CustomersModule** ✅
   - CRUD completo
   - Validações
   - Histórico

2. **VehiclesModule** ✅
   - CRUD completo
   - Validações
   - Histórico

3. **QuotesModule** ✅
   - Fluxo completo de orçamento
   - Diagnóstico
   - Aprovação
   - Geração de PDF

4. **ServiceOrdersModule** ✅
   - CRUD completo
   - Início/finalização
   - Integração com elevadores

5. **ElevatorsModule** ✅
   - Gerenciamento de elevadores
   - Reservas
   - Uso em tempo real

---

### ⚠️ Módulos com Gaps

1. **QuotesModule** - Faltando:
   - ⚠️ Upload de fotos (campo `inspectionPhotos` existe como array de strings, mas sem sistema de upload)
   - ❌ Checklist pré-diagnóstico
   - ⚠️ Campo de observações (existe `diagnosticNotes`, mas pode melhorar)

2. **ServiceOrdersModule** - Faltando:
   - ❌ Checklist pré-serviço
   - ⚠️ Upload de fotos (campo `inspectionPhotos` existe como array de strings, mas sem sistema de upload)
   - ❌ Checklist durante o serviço
   - ❌ Checklist pós-serviço
   - ⚠️ Campo de observações (existe `diagnosticNotes` e `inspectionNotes`, mas falta campo específico para observações finais)
   - ❌ Validação de checklist antes de finalizar

---

### ❌ Módulos Faltando

1. **AppointmentsModule** 🔴 **PRIORIDADE ALTA**
   - ⚠️ **Schema existe** no Prisma (model `Appointment`)
   - ❌ **Faltando:** Service, Controller, DTOs
   - ❌ **Faltando:** Sistema de agendamento funcional
   - ❌ **Faltando:** Calendário de disponibilidade
   - ❌ **Faltando:** Verificação de fila
   - ❌ **Faltando:** Notificações de agendamento
   - ❌ **Faltando:** Integração automática após aprovação de orçamento

2. **AttachmentsModule** 🔴 **PRIORIDADE ALTA**
   - ⚠️ **Status:** Campos `inspectionPhotos` existem em Quote e ServiceOrder (array de strings)
   - ❌ **Faltando:** Sistema estruturado de upload
   - ❌ **Faltando:** Armazenamento (local/S3)
   - ❌ **Faltando:** Service, Controller, DTOs
   - ❌ **Faltando:** Integração com Quotes e Service Orders
   - ❌ **Faltando:** Fotos de veículos
   - ❌ **Faltando:** Documentos

3. **ChecklistsModule** 🔴 **PRIORIDADE ALTA**
   - Checklist pré-diagnóstico
   - Checklist pré-serviço
   - Checklist durante serviço
   - Checklist pós-serviço
   - Templates de checklist
   - Validação de checklist

---

## 📋 Funcionalidades Faltantes Detalhadas

### 1. Sistema de Fotos/Uploads

**Onde é necessário:**
- ✅ **Quote (Criação):** Fotos do veículo antes do diagnóstico
- ✅ **Quote (Diagnóstico):** Fotos durante diagnóstico
- ✅ **Service Order (Início):** Fotos antes do serviço
- ✅ **Service Order (Durante):** Fotos durante o serviço
- ✅ **Service Order (Finalização):** Fotos após o serviço

**Modelo Proposto:**
```prisma
model Attachment {
  id            String   @id @default(uuid())
  tenantId      String
  entityType    String   // 'quote', 'service_order', 'vehicle', 'customer'
  entityId      String   // ID da entidade relacionada
  attachmentType String  // 'photo_before', 'photo_during', 'photo_after', 'document', 'other'
  fileName      String
  filePath      String
  fileSize      Int
  mimeType      String
  uploadedBy    String?  // User ID
  uploadedAt    DateTime @default(now())
  description   String?
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  uploader      User?    @relation(fields: [uploadedBy], references: [id])
  
  @@index([tenantId, entityType, entityId])
  @@index([attachmentType])
  @@map("attachments")
}
```

---

### 2. Sistema de Checklist

**Onde é necessário:**
- ✅ **Quote (Pré-diagnóstico):** Checklist inicial do veículo
- ✅ **Service Order (Pré-serviço):** Checklist antes de iniciar
- ✅ **Service Order (Durante serviço):** Checklist de etapas
- ✅ **Service Order (Pós-serviço):** Checklist de validação final

**Modelo Proposto:**
```prisma
model Checklist {
  id            String   @id @default(uuid())
  tenantId      String
  entityType    String   // 'quote', 'service_order'
  entityId      String   // ID da entidade relacionada
  checklistType String   // 'pre_diagnosis', 'pre_service', 'during_service', 'post_service'
  name          String
  items         ChecklistItem[]
  completedAt   DateTime?
  completedBy   String?  // User ID
  
  tenant        Tenant   @relation(fields: [tenantId], references: [id])
  completer     User?    @relation(fields: [completedBy], references: [id])
  
  @@index([tenantId, entityType, entityId])
  @@index([checklistType])
  @@map("checklists")
}

model ChecklistItem {
  id          String   @id @default(uuid())
  checklistId String
  title       String
  description String?
  isRequired  Boolean  @default(false)
  isCompleted Boolean  @default(false)
  completedAt DateTime?
  notes       String?
  order       Int      @default(0)
  
  checklist   Checklist @relation(fields: [checklistId], references: [id], onDelete: Cascade)
  
  @@index([checklistId])
  @@map("checklist_items")
}
```

---

### 3. Sistema de Agendamento

**Funcionalidades necessárias:**
- ✅ Calendário de disponibilidade
- ✅ Verificação de fila de elevadores
- ✅ Verificação de serviços agendados
- ✅ Agendamento automático após aprovação
- ✅ Notificações de agendamento
- ✅ Reagendamento

**Modelo Proposto:**
```prisma
model Appointment {
  id              String   @id @default(uuid())
  tenantId        String
  serviceOrderId  String?  // Service Order relacionada
  customerId      String
  vehicleId       String?
  assignedTo      String?  // Mecânico responsável
  scheduledDate   DateTime
  scheduledTime   String?  // Horário específico
  duration        Int      @default(60) // Minutos
  status          String   @default("scheduled") // scheduled, confirmed, in_progress, completed, cancelled
  elevatorId      String?  // Elevador reservado
  notes           String?
  reminderSent    Boolean  @default(false)
  confirmedAt     DateTime?
  cancelledAt     DateTime?
  cancelledReason String?
  
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  serviceOrder    ServiceOrder? @relation(fields: [serviceOrderId], references: [id])
  customer        Customer @relation(fields: [customerId], references: [id])
  vehicle         CustomerVehicle? @relation(fields: [vehicleId], references: [id])
  mechanic        User?    @relation("AssignedTo", fields: [assignedTo], references: [id])
  elevator        Elevator? @relation(fields: [elevatorId], references: [id])
  
  @@index([tenantId, scheduledDate])
  @@index([serviceOrderId])
  @@index([assignedTo])
  @@index([status])
  @@map("appointments")
}
```

---

## 🎯 Plano de Implementação

### Fase 1: Funcionalidades Críticas (Prioridade Alta) 🔴

1. **AppointmentsModule** (2-3 semanas)
   - ✅ Schema Prisma já existe
   - ❌ Service, Controller, DTOs (implementar)
   - ❌ Integração com Service Orders
   - ❌ Calendário de disponibilidade
   - ❌ Verificação de fila
   - ❌ Notificações
   - ❌ Integração automática após aprovação de orçamento

2. **AttachmentsModule** (1-2 semanas)
   - ❌ Schema Prisma (criar model `Attachment`)
   - ❌ Service, Controller, DTOs
   - ❌ Upload de arquivos
   - ❌ Armazenamento local (já existe estrutura em `uploads/`)
   - ❌ Integração com Quotes e Service Orders (substituir arrays de strings por referências)

3. **ChecklistsModule** (1-2 semanas)
   - Schema Prisma
   - Service, Controller, DTOs
   - Templates de checklist
   - Integração com Quotes e Service Orders
   - Validação de checklist

### Fase 2: Melhorias nos Módulos Existentes (Prioridade Média) 🟡

4. **Melhorias no QuotesModule**
   - Adicionar campo de observações do mecânico
   - Integração com AttachmentsModule
   - Integração com ChecklistsModule

5. **Melhorias no ServiceOrdersModule**
   - Adicionar campo de observações do mecânico
   - Integração com AttachmentsModule
   - Integração com ChecklistsModule
   - Validação de checklist antes de finalizar

### Fase 3: Funcionalidades Adicionais (Prioridade Baixa) 🟢

6. **Melhorias no AppointmentsModule**
   - Reagendamento
   - Lembretes automáticos
   - Confirmação de agendamento

---

## 📊 Resumo de Gaps

### Por Tipo de Funcionalidade

| Funcionalidade | Status | Módulo | Prioridade |
|----------------|--------|--------|------------|
| Agendamento | ❌ Faltando | AppointmentsModule | 🔴 Alta |
| Upload de Fotos | ❌ Faltando | AttachmentsModule | 🔴 Alta |
| Checklist | ❌ Faltando | ChecklistsModule | 🔴 Alta |
| Observações do Mecânico | ⚠️ Parcial | QuotesModule, ServiceOrdersModule | 🟡 Média |
| Verificação de Fila | ❌ Faltando | AppointmentsModule | 🔴 Alta |

### Por Módulo

| Módulo | Status | Gaps | Prioridade |
|--------|--------|------|------------|
| AppointmentsModule | ❌ Não existe | Tudo | 🔴 Alta |
| AttachmentsModule | ❌ Não existe | Tudo | 🔴 Alta |
| ChecklistsModule | ❌ Não existe | Tudo | 🔴 Alta |
| QuotesModule | ✅ Existe | Fotos, Checklist, Observações | 🟡 Média |
| ServiceOrdersModule | ✅ Existe | Fotos, Checklist, Observações | 🟡 Média |

---

## 🔗 Dependências entre Módulos

```
AppointmentsModule
  └─> ServiceOrdersModule
  └─> CustomersModule
  └─> VehiclesModule
  └─> ElevatorsModule

AttachmentsModule
  └─> (independente, mas usado por)
      └─> QuotesModule
      └─> ServiceOrdersModule
      └─> VehiclesModule
      └─> CustomersModule

ChecklistsModule
  └─> (independente, mas usado por)
      └─> QuotesModule
      └─> ServiceOrdersModule
```

---

## ✅ Próximos Passos Recomendados

1. **Implementar AppointmentsModule** (primeiro)
   - Base para agendamento após aprovação
   - Integração com Service Orders
   - Verificação de fila

2. **Implementar AttachmentsModule** (segundo)
   - Upload de fotos em todos os pontos do fluxo
   - Armazenamento de arquivos

3. **Implementar ChecklistsModule** (terceiro)
   - Checklist em todos os pontos do fluxo
   - Validação antes de finalizar

4. **Melhorar módulos existentes**
   - Adicionar campos de observações
   - Integrar com novos módulos

---

**Última atualização:** 01/12/2025

