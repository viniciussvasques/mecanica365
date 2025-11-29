# 🔧 Módulo Service Orders (Ordens de Serviço)

**Status:** ✅ Backend 100% Completo e Funcional | ⏳ Frontend Pendente

## 📋 Visão Geral

Módulo completo de gerenciamento de ordens de serviço para oficinas mecânicas. Permite criar, gerenciar, iniciar, finalizar e cancelar ordens de serviço, com integração completa com elevadores, diagnóstico de problemas e rastreamento completo do histórico.

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
service-orders/
├── dto/
│   ├── create-service-order.dto.ts
│   ├── update-service-order.dto.ts
│   ├── service-order-response.dto.ts
│   ├── service-order-filters.dto.ts
│   ├── service-order-status.enum.ts
│   └── index.ts
├── service-orders.controller.ts
├── service-orders.service.ts
├── service-orders.module.ts
├── service-orders.service.spec.ts
└── README.md
```

## 🔌 Endpoints da API

### `POST /api/service-orders`
Cria uma nova ordem de serviço.

**Permissões:** `admin`, `manager`, `receptionist`, `mechanic`

**Body:**
```json
{
  "customerId": "123e4567-e89b-12d3-a456-426614174000",
  "vehicleVin": "1HGBH41JXMN109186",
  "vehiclePlaca": "ABC1234",
  "vehicleMake": "Honda",
  "vehicleModel": "Civic",
  "vehicleYear": 2020,
  "vehicleMileage": 50000,
  "technicianId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "scheduled",
  "appointmentDate": "2024-12-30T10:00:00Z",
  "elevatorId": "123e4567-e89b-12d3-a456-426614174000",
  "reportedProblemCategory": "freios",
  "reportedProblemDescription": "Barulho no freio ao frear",
  "reportedProblemSymptoms": ["ruído no freio", "barulho ao frear"],
  "estimatedHours": 2.5,
  "laborCost": 200.0,
  "partsCost": 300.0,
  "discount": 0,
  "notes": "Cliente relatou barulho no freio"
}
```

**Campos de Problema Relatado:**
- `reportedProblemCategory`: Categoria do problema (motor, freios, suspensão, etc.)
- `reportedProblemDescription`: Descrição detalhada do problema relatado pelo cliente
- `reportedProblemSymptoms`: Array de sintomas relatados

**Campos de Problema Identificado:**
- `identifiedProblemCategory`: Categoria do problema identificado pelo mecânico
- `identifiedProblemDescription`: Descrição do problema identificado
- `identifiedProblemId`: ID do problema comum identificado (referência a CommonProblem)

**Campos de Diagnóstico:**
- `diagnosticNotes`: Observações do mecânico durante diagnóstico
- `inspectionNotes`: Notas de inspeção (campo `notes` também preenche este)
- `inspectionPhotos`: Array de URLs de fotos da inspeção
- `recommendations`: Recomendações do mecânico

### `GET /api/service-orders`
Lista ordens de serviço com filtros e paginação.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

**Query Parameters:**
- `number` (opcional): Busca por número (parcial)
- `status` (opcional): Filtrar por status (`scheduled`, `in_progress`, `completed`, `cancelled`)
- `customerId` (opcional): Filtrar por cliente
- `technicianId` (opcional): Filtrar por mecânico
- `vehiclePlaca` (opcional): Filtrar por placa
- `vehicleVin` (opcional): Filtrar por VIN
- `reportedProblemCategory` (opcional): Filtrar por categoria de problema relatado
- `identifiedProblemCategory` (opcional): Filtrar por categoria de problema identificado
- `startDate` (opcional): Filtrar por data de criação (início)
- `endDate` (opcional): Filtrar por data de criação (fim)
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)

### `GET /api/service-orders/:id`
Busca uma ordem de serviço por ID.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

### `PATCH /api/service-orders/:id`
Atualiza uma ordem de serviço.

**Permissões:** `admin`, `manager`, `receptionist`

**Body:** Mesmos campos do `POST /api/service-orders` (todos opcionais)

### `POST /api/service-orders/:id/start`
Inicia uma ordem de serviço.

**Permissões:** `admin`, `manager`, `mechanic`

**Comportamento:**
- Atualiza status para `in_progress`
- Registra `startedAt`
- Inicia uso do elevador se houver reserva
- Cria registro em `ElevatorUsage`

### `POST /api/service-orders/:id/complete`
Finaliza uma ordem de serviço.

**Permissões:** `admin`, `manager`, `mechanic`

**Comportamento:**
- Atualiza status para `completed`
- Registra `completedAt`
- Finaliza uso do elevador
- Libera elevador (status volta para `free`)

### `POST /api/service-orders/:id/cancel`
Cancela uma ordem de serviço.

**Permissões:** `admin`, `manager`

**Comportamento:**
- Atualiza status para `cancelled`
- Finaliza uso do elevador se houver
- Libera elevador

### `DELETE /api/service-orders/:id`
Remove uma ordem de serviço (apenas se não tiver fatura associada).

**Permissões:** `admin`, `manager`

## 📊 Status da Ordem de Serviço

A ordem de serviço passa por diferentes status durante seu ciclo de vida:

1. **`scheduled`** - Agendada (padrão)
2. **`in_progress`** - Em andamento
3. **`completed`** - Finalizada
4. **`cancelled`** - Cancelada

## 🔄 Integração com Outros Módulos

### Quotes (Orçamentos)
- Orçamento aprovado → Cria automaticamente uma `ServiceOrder`
- Todos os dados são transferidos (problema relatado, identificado, recomendações)
- Elevador é reservado automaticamente se especificado no orçamento

### Elevators
- OS pode especificar um elevador onde será realizado o serviço
- Ao iniciar, o elevador é ocupado automaticamente
- Ao finalizar/cancelar, o elevador é liberado
- Histórico completo de uso é mantido em `ElevatorUsage`

### Diagnostic Service
- Integração com `DiagnosticService` para sugerir problemas baseado em sintomas
- `identifiedProblemId` referencia um `CommonProblem` quando identificado
- Permite rastreamento de problemas comuns e suas soluções

### Customers & Vehicles
- OS pode ser criada com ou sem cliente/veículo cadastrado
- Se veículo não estiver cadastrado, pode ser informado via VIN/Placa
- Dados do veículo são salvos na OS para histórico

## 🎯 Funcionalidades Principais

### 1. Diagnóstico Integrado
- **Problema Relatado:** Cliente descreve o problema com categoria e sintomas
- **Problema Identificado:** Mecânico identifica o problema real após inspeção
- **Sugestões Automáticas:** Sistema sugere problemas comuns baseado em sintomas
- **Recomendações:** Mecânico pode adicionar recomendações (troca de peças, manutenção preventiva, etc.)

### 2. Categorização de Problemas
- 15 categorias pré-definidas (motor, freios, suspensão, elétrica, etc.)
- Facilita busca e relatórios
- Permite filtros por categoria
- Rastreamento de problemas mais comuns

### 3. Gestão de Elevadores
- Reserva automática ao criar OS (se especificado)
- Ocupação automática ao iniciar OS
- Liberação automática ao finalizar/cancelar
- Histórico completo de uso (elevador, veículo, mecânico, OS)

### 4. Rastreamento Completo
- Histórico de todas as OS por cliente
- Histórico de todas as OS por veículo
- Histórico de todas as OS por mecânico
- Histórico de uso de elevadores

### 5. Check-in do Veículo
- Registro de quilometragem no check-in
- Registro de nível de combustível
- Fotos da inspeção
- Notas de inspeção

## 📝 Exemplo de Uso Completo

```typescript
// 1. Criar OS (pode vir de orçamento aprovado ou direto)
const serviceOrder = await serviceOrdersService.create(tenantId, {
  customerId: "customer-id",
  vehicleVin: "1HGBH41JXMN109186",
  technicianId: "technician-id",
  elevatorId: "elevator-id",
  reportedProblemCategory: "freios",
  reportedProblemDescription: "Barulho no freio",
  reportedProblemSymptoms: ["ruído no freio"],
  estimatedHours: 2.5,
  laborCost: 200.0,
  partsCost: 300.0
});

// 2. Mecânico faz diagnóstico e identifica problema
await serviceOrdersService.update(tenantId, serviceOrder.id, {
  identifiedProblemCategory: "freios",
  identifiedProblemDescription: "Pastilhas desgastadas",
  identifiedProblemId: "common-problem-id",
  diagnosticNotes: "Pastilhas com 80% de desgaste",
  recommendations: "Recomendada troca e verificação"
});

// 3. Iniciar OS → Elevador ocupado
await serviceOrdersService.start(tenantId, serviceOrder.id);

// 4. Finalizar OS → Elevador liberado
await serviceOrdersService.complete(tenantId, serviceOrder.id);
```

## 🔄 Fluxo Completo

```
1. Cliente chega → OS criada (status: scheduled)
   └─ Problema relatado registrado
   └─ Elevador reservado (se especificado)

2. Mecânico faz diagnóstico → OS atualizada
   └─ Problema identificado registrado
   └─ Recomendações adicionadas

3. OS iniciada → Status: in_progress
   └─ Elevador ocupado
   └─ Histórico de uso criado

4. OS finalizada → Status: completed
   └─ Elevador liberado
   └─ Histórico completo mantido
```

## 🧪 Testes

- ✅ Testes unitários: `service-orders.service.spec.ts`
- ✅ Testes E2E: `test/service-orders.e2e-spec.ts`
- ✅ Cobertura: CRUD, start, complete, cancel, validações, integração com elevadores

## 📚 Referências

- [ELEVATOR_WORKFLOW.md](../elevators/ELEVATOR_WORKFLOW.md) - Fluxo de integração com elevadores
- [Quotes README](../quotes/README.md) - Módulo de orçamentos
- [Diagnostic Service](../shared/services/diagnostic.service.ts) - Serviço de diagnóstico
- [Problem Categories](../shared/enums/problem-category.enum.ts) - Categorias de problemas

---

**Última atualização:** Dezembro 2024  
**Versão:** 1.0.0

