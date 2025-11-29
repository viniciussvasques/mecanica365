# 🔧 Fluxo de Uso de Elevadores - Mecânica365

## 📋 Visão Geral

Este documento descreve o fluxo completo de uso dos elevadores, desde o orçamento até a finalização da ordem de serviço.

---

## 🔄 Fluxo Completo

### **1. Cliente chega → Orçamento criado**
```
Cliente → Cria Orçamento → Elevador pode ser reservado (opcional)
```

**Status do Elevador:** `free` ou `scheduled` (se reservado)

### **2. Orçamento aprovado → Ordem de Serviço criada**
```
Orçamento Aprovado → OS Criada → Elevador reservado/ocupado
```

**Status do Elevador:** `scheduled` → `occupied`

### **3. OS iniciada → Elevador ocupado**
```
OS Iniciada → Elevador Ocupado → Veículo no elevador → Mecânico trabalhando
```

**Status do Elevador:** `occupied`

**Dados rastreados:**
- ✅ Qual elevador (Elevator)
- ✅ Qual veículo (CustomerVehicle)
- ✅ Qual OS (ServiceOrder)
- ✅ Qual mecânico (User/Technician)
- ✅ Horário de início (startTime)
- ✅ Observações (notes)

### **4. OS finalizada → Elevador liberado**
```
OS Finalizada → Elevador Liberado → Status volta para `free`
```

**Status do Elevador:** `free`

---

## 🗄️ Melhorias no Schema

### **1. Adicionar `vehicleId` ao ElevatorUsage**

```prisma
model ElevatorUsage {
  id             String           @id @default(uuid())
  elevatorId     String
  serviceOrderId String?
  vehicleId      String?          // NOVO: Para rastrear qual veículo está no elevador
  startTime      DateTime
  endTime        DateTime?
  notes          String?
  createdAt      DateTime         @default(now())
  elevator       Elevator         @relation(fields: [elevatorId], references: [id], onDelete: Cascade)
  serviceOrder   ServiceOrder?    @relation(fields: [serviceOrderId], references: [id], onDelete: SetNull)
  vehicle        CustomerVehicle? @relation(fields: [vehicleId], references: [id], onDelete: SetNull) // NOVO

  @@index([elevatorId])
  @@index([serviceOrderId])
  @@index([vehicleId]) // NOVO
  @@map("elevator_usages")
}
```

### **2. Adicionar relação em CustomerVehicle**

```prisma
model CustomerVehicle {
  // ... campos existentes
  elevatorUsages ElevatorUsage[] // NOVO
}
```

---

## 🔌 Novos Endpoints e Métodos

### **1. Iniciar Uso do Elevador**

**Endpoint:** `POST /api/elevators/:id/start-usage`

**Body:**
```json
{
  "serviceOrderId": "uuid-da-os",
  "vehicleId": "uuid-do-veiculo",
  "notes": "Observações opcionais"
}
```

**Comportamento:**
- ✅ Verifica se elevador está disponível (`free` ou `scheduled`)
- ✅ Cria registro em `ElevatorUsage` com `startTime = now()`
- ✅ Atualiza status do elevador para `occupied`
- ✅ Vincula com ServiceOrder e Vehicle

### **2. Finalizar Uso do Elevador**

**Endpoint:** `POST /api/elevators/:id/end-usage`

**Body:**
```json
{
  "usageId": "uuid-do-uso",
  "notes": "Observações finais"
}
```

**Comportamento:**
- ✅ Atualiza `ElevatorUsage.endTime = now()`
- ✅ Atualiza status do elevador para `free`
- ✅ Mantém histórico completo

### **3. Reservar Elevador (quando orçamento aprovado)**

**Endpoint:** `POST /api/elevators/:id/reserve`

**Body:**
```json
{
  "serviceOrderId": "uuid-da-os",
  "vehicleId": "uuid-do-veiculo",
  "scheduledStartTime": "2024-01-15T10:00:00Z"
}
```

**Comportamento:**
- ✅ Atualiza status do elevador para `scheduled`
- ✅ Cria registro em `ElevatorUsage` com `startTime` futuro
- ✅ Permite planejamento antecipado

### **4. Buscar Uso Atual do Elevador**

**Endpoint:** `GET /api/elevators/:id/current-usage`

**Resposta:**
```json
{
  "usage": {
    "id": "uuid",
    "serviceOrder": {
      "id": "uuid",
      "number": "OS-001",
      "customer": { "name": "João Silva" },
      "technician": { "name": "Mecânico X" }
    },
    "vehicle": {
      "id": "uuid",
      "placa": "ABC1234",
      "make": "Honda",
      "model": "Civic"
    },
    "startTime": "2024-01-15T10:00:00Z",
    "notes": "Observações"
  },
  "elevator": {
    "id": "uuid",
    "name": "Elevador 1",
    "status": "occupied"
  }
}
```

---

## 🔄 Integração com Service Orders

### **Quando OS é criada (orçamento aprovado):**

```typescript
// No ServiceOrdersService.create()
async create(tenantId: string, dto: CreateServiceOrderDto) {
  // ... criar OS
  
  // Se elevador foi especificado, reservar
  if (dto.elevatorId) {
    await this.elevatorsService.reserve(
      tenantId,
      dto.elevatorId,
      {
        serviceOrderId: serviceOrder.id,
        vehicleId: dto.vehicleId,
        scheduledStartTime: dto.appointmentDate,
      }
    );
  }
  
  return serviceOrder;
}
```

### **Quando OS é iniciada:**

```typescript
// No ServiceOrdersService.start()
async start(tenantId: string, id: string) {
  const serviceOrder = await this.findOne(tenantId, id);
  
  // Se elevador estava reservado, iniciar uso
  const activeUsage = await this.prisma.elevatorUsage.findFirst({
    where: {
      serviceOrderId: id,
      endTime: null,
    },
  });
  
  if (activeUsage && !activeUsage.startTime) {
    await this.elevatorsService.startUsage(
      tenantId,
      activeUsage.elevatorId,
      {
        usageId: activeUsage.id,
        serviceOrderId: id,
        vehicleId: serviceOrder.vehicleId,
      }
    );
  }
  
  // ... atualizar status da OS
}
```

### **Quando OS é finalizada:**

```typescript
// No ServiceOrdersService.complete()
async complete(tenantId: string, id: string) {
  // ... finalizar OS
  
  // Liberar elevador
  const activeUsage = await this.prisma.elevatorUsage.findFirst({
    where: {
      serviceOrderId: id,
      endTime: null,
    },
  });
  
  if (activeUsage) {
    await this.elevatorsService.endUsage(
      tenantId,
      activeUsage.elevatorId,
      {
        usageId: activeUsage.id,
      }
    );
  }
  
  return serviceOrder;
}
```

---

## 📊 Dashboard e Relatórios

### **1. Status dos Elevadores em Tempo Real**

**Endpoint:** `GET /api/elevators/status`

**Resposta:**
```json
{
  "elevators": [
    {
      "id": "uuid",
      "name": "Elevador 1",
      "status": "occupied",
      "currentUsage": {
        "serviceOrder": "OS-001",
        "vehicle": "ABC1234",
        "technician": "Mecânico X",
        "startTime": "2024-01-15T10:00:00Z",
        "duration": "2h 30min"
      }
    },
    {
      "id": "uuid",
      "name": "Elevador 2",
      "status": "free"
    }
  ]
}
```

### **2. Histórico de Uso**

**Endpoint:** `GET /api/elevators/:id/usage-history`

**Query Params:**
- `startDate` (opcional)
- `endDate` (opcional)
- `page`, `limit` (paginação)

---

## ✅ Benefícios

1. **Rastreabilidade Completa**
   - Sabe exatamente qual veículo está em qual elevador
   - Histórico completo de uso
   - Relacionamento com OS e mecânico

2. **Gestão de Capacidade**
   - Visualização em tempo real
   - Planejamento antecipado (reservas)
   - Otimização de uso

3. **Integração Automática**
   - Status atualizado automaticamente
   - Sem necessidade de atualização manual
   - Sincronizado com ciclo de vida da OS

4. **Relatórios e Analytics**
   - Tempo médio de uso por elevador
   - Taxa de ocupação
   - Eficiência de uso

---

## 🚀 Próximos Passos

1. ✅ Adicionar `vehicleId` ao schema Prisma
2. ✅ Criar migration
3. ✅ Implementar métodos no `ElevatorsService`:
   - `startUsage()`
   - `endUsage()`
   - `reserve()`
   - `getCurrentUsage()`
   - `getUsageHistory()`
4. ✅ Criar endpoints no `ElevatorsController`
5. ✅ Integrar com `ServiceOrdersService`
6. ✅ Criar testes unitários e E2E
7. ✅ Frontend: Dashboard de elevadores em tempo real

---

**Status:** 📝 Proposta - Aguardando Aprovação

