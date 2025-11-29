# 💰 Módulo Quotes (Orçamentos)

**Status:** ✅ Backend 100% Completo e Funcional | ⏳ Frontend Pendente

## 📋 Visão Geral

Módulo completo de gerenciamento de orçamentos para oficinas mecânicas. Permite criar, gerenciar, aprovar e converter orçamentos em ordens de serviço, com suporte a diagnóstico integrado, categorização de problemas e geração de PDF para assinatura do cliente.

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
quotes/
├── dto/
│   ├── create-quote.dto.ts
│   ├── update-quote.dto.ts
│   ├── quote-response.dto.ts
│   ├── quote-filters.dto.ts
│   ├── quote-item.dto.ts
│   ├── approve-quote.dto.ts
│   ├── quote-status.enum.ts
│   └── index.ts
├── pdf/
│   └── quote-pdf.service.ts
├── quotes.controller.ts
├── quotes.service.ts
├── quotes.module.ts
├── quotes.service.spec.ts
└── README.md
```

## 🔌 Endpoints da API

### `POST /api/quotes`
Cria um novo orçamento.

**Permissões:** `admin`, `manager`, `receptionist`, `mechanic`

**Body:**
```json
{
  "customerId": "123e4567-e89b-12d3-a456-426614174000",
  "vehicleId": "123e4567-e89b-12d3-a456-426614174000",
  "elevatorId": "123e4567-e89b-12d3-a456-426614174000",
  "reportedProblemCategory": "freios",
  "reportedProblemDescription": "Barulho no freio ao frear",
  "reportedProblemSymptoms": ["ruído no freio", "barulho ao frear"],
  "items": [
    {
      "type": "service",
      "name": "Troca de pastilhas de freio",
      "description": "Troca de pastilhas dianteiras",
      "quantity": 1,
      "unitCost": 300.0,
      "hours": 1.5
    }
  ],
  "laborCost": 200.0,
  "partsCost": 300.0,
  "discount": 0,
  "taxAmount": 0,
  "validUntil": "2024-12-31T23:59:59Z",
  "diagnosticNotes": "Pastilhas com 80% de desgaste",
  "inspectionNotes": "Discos ainda em bom estado",
  "recommendations": "Recomendada verificação do sistema completo"
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
- `inspectionNotes`: Notas de inspeção
- `inspectionPhotos`: Array de URLs de fotos da inspeção
- `recommendations`: Recomendações do mecânico

### `GET /api/quotes`
Lista orçamentos com filtros e paginação.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

**Query Parameters:**
- `status` (opcional): Filtrar por status (`draft`, `sent`, `viewed`, `accepted`, `rejected`, `expired`, `converted`)
- `customerId` (opcional): Filtrar por cliente
- `vehicleId` (opcional): Filtrar por veículo
- `reportedProblemCategory` (opcional): Filtrar por categoria de problema relatado
- `identifiedProblemCategory` (opcional): Filtrar por categoria de problema identificado
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)

### `GET /api/quotes/:id`
Busca um orçamento por ID.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

### `PATCH /api/quotes/:id`
Atualiza um orçamento.

**Permissões:** `admin`, `manager`, `receptionist`

**Body:** Mesmos campos do `POST /api/quotes` (todos opcionais)

### `POST /api/quotes/:id/approve`
Aprova um orçamento e converte automaticamente em ordem de serviço.

**Permissões:** `admin`, `manager`, `receptionist`

**Body:**
```json
{
  "elevatorId": "123e4567-e89b-12d3-a456-426614174000",
  "customerSignature": "base64_encoded_signature"
}
```

**Comportamento:**
- Atualiza status do orçamento para `accepted`
- Cria automaticamente uma `ServiceOrder` com status `scheduled`
- Reserva o elevador se `elevatorId` for fornecido
- Transfere todos os dados do orçamento para a OS

### `GET /api/quotes/:id/pdf`
Gera PDF do orçamento para impressão e assinatura.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

**Response:** PDF file (application/pdf)

### `DELETE /api/quotes/:id`
Remove um orçamento (apenas rascunhos).

**Permissões:** `admin`, `manager`

## 📊 Status do Orçamento

O orçamento passa por diferentes status durante seu ciclo de vida:

1. **`draft`** - Rascunho (padrão)
2. **`sent`** - Enviado ao cliente
3. **`viewed`** - Visualizado pelo cliente
4. **`accepted`** - Aprovado pelo cliente
5. **`rejected`** - Rejeitado pelo cliente
6. **`expired`** - Expirado
7. **`converted`** - Convertido em ordem de serviço

## 🔄 Integração com Outros Módulos

### Service Orders
- Orçamento aprovado → Cria automaticamente uma `ServiceOrder`
- Todos os dados são transferidos (problema relatado, identificado, recomendações)
- Elevador é reservado automaticamente se especificado

### Elevators
- Orçamento pode especificar um elevador onde será realizado o serviço
- Ao aprovar, o elevador é reservado automaticamente
- Status do elevador muda para `scheduled` → `occupied` quando OS inicia

### Diagnostic Service
- Integração com `DiagnosticService` para sugerir problemas baseado em sintomas
- `identifiedProblemId` referencia um `CommonProblem` quando identificado

## 🎯 Funcionalidades Principais

### 1. Diagnóstico Integrado
- **Problema Relatado:** Cliente descreve o problema com categoria e sintomas
- **Problema Identificado:** Mecânico identifica o problema real após inspeção
- **Sugestões Automáticas:** Sistema sugere problemas comuns baseado em sintomas

### 2. Categorização de Problemas
- 15 categorias pré-definidas (motor, freios, suspensão, elétrica, etc.)
- Facilita busca e relatórios
- Permite filtros por categoria

### 3. Geração de PDF
- PDF profissional para impressão
- Inclui todos os dados do orçamento
- Campo para assinatura do cliente
- Pode ser enviado por email ou impresso

### 4. Versionamento
- Suporte a versões/revisões do orçamento
- Mantém histórico de alterações
- `parentQuoteId` referencia versão anterior

### 5. Conversão Automática
- Ao aprovar, cria automaticamente a `ServiceOrder`
- Transfere todos os dados relevantes
- Reserva elevador se necessário

## 📝 Exemplo de Uso Completo

```typescript
// 1. Cliente chega e relata problema
const quote = await quotesService.create(tenantId, {
  customerId: "customer-id",
  vehicleId: "vehicle-id",
  reportedProblemCategory: "freios",
  reportedProblemDescription: "Barulho no freio ao frear",
  reportedProblemSymptoms: ["ruído no freio", "barulho ao frear"],
  items: [
    {
      type: "service",
      name: "Troca de pastilhas",
      quantity: 1,
      unitCost: 300.0,
      hours: 1.5
    }
  ],
  laborCost: 200.0,
  partsCost: 300.0
});

// 2. Mecânico faz diagnóstico e identifica problema
await quotesService.update(tenantId, quote.id, {
  identifiedProblemCategory: "freios",
  identifiedProblemDescription: "Pastilhas desgastadas",
  identifiedProblemId: "common-problem-id", // ID do CommonProblem
  diagnosticNotes: "Pastilhas com 80% de desgaste",
  recommendations: "Recomendada troca e verificação do sistema"
});

// 3. Gerar PDF e enviar ao cliente
const pdf = await quotesService.generatePdf(tenantId, quote.id);

// 4. Cliente aprova → Cria OS automaticamente
await quotesService.approve(tenantId, quote.id, {
  elevatorId: "elevator-id",
  customerSignature: "base64_signature"
});
```

## 🧪 Testes

- ✅ Testes unitários: `quotes.service.spec.ts`
- ✅ Testes E2E: `test/quotes.e2e-spec.ts`
- ✅ Cobertura: CRUD, aprovação, conversão, PDF, validações

## 📚 Referências

- [ELEVATOR_WORKFLOW.md](../elevators/ELEVATOR_WORKFLOW.md) - Fluxo de integração com elevadores
- [Diagnostic Service](../shared/services/diagnostic.service.ts) - Serviço de diagnóstico
- [Problem Categories](../shared/enums/problem-category.enum.ts) - Categorias de problemas

---

**Última atualização:** Dezembro 2024  
**Versão:** 1.0.0

