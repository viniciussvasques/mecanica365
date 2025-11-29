# 🏗️ Módulo Elevators (Elevadores)

**Status:** ✅ Backend 100% Completo e Funcional | ✅ Integração com Service Orders e Quotes Completa | ⏳ Frontend Pendente

## 📋 Visão Geral

Módulo completo de gerenciamento de elevadores para oficinas mecânicas. Permite cadastro, controle de status em tempo real, histórico completo de uso (elevador, veículo, mecânico, OS) e integração automática com ordens de serviço e orçamentos.

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
elevators/
├── dto/
│   ├── create-elevator.dto.ts
│   ├── update-elevator.dto.ts
│   ├── elevator-response.dto.ts
│   ├── elevator-filters.dto.ts
│   └── index.ts
├── elevators.controller.ts
├── elevators.service.ts
├── elevators.module.ts
└── README.md
```

## 🔌 Endpoints da API

### `POST /api/elevators`
Cria um novo elevador.

**Permissões:** `admin`, `manager`, `receptionist`

**Body:**
```json
{
  "name": "Elevador 1",
  "number": "ELEV-001",
  "type": "hydraulic",
  "capacity": 3.5,
  "status": "free",
  "location": "Setor A - Box 1",
  "notes": "Revisão anual em dezembro"
}
```

**Validações:**
- Nome: obrigatório, máximo 100 caracteres
- Número: obrigatório, máximo 50 caracteres, único por tenant
- Tipo: `hydraulic`, `pneumatic` ou `scissor` (padrão: `hydraulic`)
- Capacidade: obrigatória, maior que 0 (em toneladas)
- Status: `free`, `occupied`, `maintenance` ou `scheduled` (padrão: `free`)

### `GET /api/elevators`
Lista elevadores com filtros e paginação.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

**Query Parameters:**
- `name` (opcional): Busca por nome (parcial)
- `number` (opcional): Busca por número (parcial)
- `type` (opcional): Filtrar por tipo (`hydraulic`, `pneumatic`, `scissor`)
- `status` (opcional): Filtrar por status (`free`, `occupied`, `maintenance`, `scheduled`)
- `page` (opcional, padrão: 1): Número da página
- `limit` (opcional, padrão: 10): Itens por página (máx: 100)

**Resposta:**
```json
{
  "data": [...],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

### `GET /api/elevators/:id`
Busca um elevador por ID.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

### `PATCH /api/elevators/:id`
Atualiza um elevador.

**Permissões:** `admin`, `manager`, `receptionist`

**Body:** (todos os campos opcionais)
```json
{
  "name": "Elevador 1 - Atualizado",
  "status": "occupied",
  "location": "Setor B - Box 2"
}
```

### `DELETE /api/elevators/:id`
Remove um elevador.

**Permissões:** `admin`, `manager`

**Validações:**
- Não é possível remover elevador com uso ativo (endTime null)

### `POST /api/elevators/:id/reserve`
Reserva um elevador (quando orçamento é aprovado).

**Permissões:** `admin`, `manager`, `receptionist`

**Body:**
```json
{
  "serviceOrderId": "uuid",
  "vehicleId": "uuid",
  "scheduledStartTime": "2024-01-15T10:00:00Z",
  "notes": "Reservado para manutenção"
}
```

**Resultado:** Elevador status = `scheduled`

### `POST /api/elevators/:id/start-usage`
Inicia uso do elevador (quando OS é iniciada).

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

**Body:**
```json
{
  "serviceOrderId": "uuid",
  "vehicleId": "uuid",
  "notes": "Iniciando serviço de freio"
}
```

**Resultado:** 
- Elevador status = `occupied`
- Histórico completo salvo (elevador, veículo, mecânico, OS)

### `POST /api/elevators/:id/end-usage`
Finaliza uso do elevador (quando OS é finalizada).

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

**Body:**
```json
{
  "usageId": "uuid",
  "notes": "Serviço concluído"
}
```

**Resultado:**
- Elevador status = `free`
- Duração calculada automaticamente
- Histórico preservado

### `GET /api/elevators/:id/current-usage`
Busca uso atual do elevador.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

**Resposta:** Retorna uso ativo com todos os dados relacionados (veículo, OS, mecânico) ou `null` se livre.

### `GET /api/elevators/:id/usage-history`
Busca histórico completo de uso do elevador.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

**Query Parameters:**
- `startDate` (opcional): Data inicial
- `endDate` (opcional): Data final
- `page` (opcional, padrão: 1)
- `limit` (opcional, padrão: 10)

**Resposta:** Lista paginada com histórico completo (elevador, veículo, mecânico, OS, tempos, duração).

### `GET /api/elevators/status/overview`
Dashboard: Status de todos os elevadores em tempo real.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

**Resposta:** Lista todos os elevadores com uso atual (se houver), mostrando veículo, mecânico e tempo de uso.

## 📊 Modelo de Dados

### Elevator
- `id`: UUID
- `tenantId`: UUID (relacionamento com Tenant)
- `name`: String (nome do elevador)
- `number`: String (número único por tenant)
- `type`: Enum (`hydraulic`, `pneumatic`, `scissor`)
- `capacity`: Decimal (capacidade em toneladas)
- `status`: Enum (`free`, `occupied`, `maintenance`, `scheduled`)
- `location`: String? (localização na oficina)
- `notes`: String? (observações)
- `createdAt`: DateTime
- `updatedAt`: DateTime

### ElevatorUsage ✅ Implementado
- Registro completo de uso do elevador
- Relacionado com: Elevator, ServiceOrder (opcional), CustomerVehicle
- Campos: `startTime`, `endTime`, `notes`, `durationMinutes` (calculado)
- **Histórico completo preservado permanentemente**

### ElevatorMaintenance (Futuro)
- Agendamento e histórico de manutenções

## 🔐 Permissões

| Ação | admin | manager | mechanic | receptionist |
|------|-------|---------|----------|--------------|
| Criar | ✅ | ✅ | ❌ | ✅ |
| Listar | ✅ | ✅ | ✅ | ✅ |
| Visualizar | ✅ | ✅ | ✅ | ✅ |
| Atualizar | ✅ | ✅ | ❌ | ✅ |
| Remover | ✅ | ✅ | ❌ | ❌ |

## ✅ Funcionalidades Implementadas

- ✅ CRUD completo de elevadores
- ✅ Controle de status em tempo real
- ✅ Reserva de elevadores
- ✅ Início e fim de uso
- ✅ Histórico completo (elevador, veículo, mecânico, OS)
- ✅ Dashboard em tempo real
- ✅ Validações e segurança
- ✅ Testes unitários

## 🔄 Integração com Outros Módulos

### Service Orders
- ✅ **Integração Completa:** OS pode especificar elevador ao criar
- ✅ **Reserva Automática:** Elevador é reservado quando OS é criada (se especificado)
- ✅ **Ocupação Automática:** Elevador é ocupado quando OS é iniciada
- ✅ **Liberação Automática:** Elevador é liberado quando OS é finalizada/cancelada
- ✅ **Histórico Completo:** Todas as OS ficam registradas no histórico de uso

### Quotes (Orçamentos)
- ✅ **Reserva no Orçamento:** Orçamento pode especificar elevador
- ✅ **Conversão Automática:** Ao aprovar orçamento, elevador é reservado automaticamente
- ✅ **Integração com OS:** Quando orçamento vira OS, elevador é transferido

## 🎯 Funcionalidades Principais

### 1. Gestão Completa de Status
- **`free`**: Livre e disponível
- **`occupied`**: Em uso (veículo no elevador, mecânico trabalhando)
- **`scheduled`**: Reservado para uso futuro
- **`maintenance`**: Em manutenção

### 2. Histórico Completo
- Rastreamento de todos os usos do elevador
- Dados preservados: elevador, veículo, mecânico, OS, tempos, duração
- Consulta por período, veículo, mecânico ou OS
- Dashboard em tempo real

### 3. Integração Automática
- Reserva automática ao criar OS/Orçamento
- Ocupação automática ao iniciar OS
- Liberação automática ao finalizar/cancelar OS
- Sem necessidade de chamadas manuais

## 🧪 Testes

- ✅ Testes unitários: `elevators.service.spec.ts`
- ✅ Testes E2E: `test/elevators.e2e-spec.ts`
- ✅ Cobertura: CRUD, reserva, uso, histórico, validações, integração

## 📚 Referências

- [ELEVATOR_WORKFLOW.md](./ELEVATOR_WORKFLOW.md) - Fluxo completo de uso
- [Service Orders README](../service-orders/README.md) - Módulo de ordens de serviço
- [Quotes README](../quotes/README.md) - Módulo de orçamentos

## 🚀 Próximos Passos

- [ ] Frontend: Listagem de elevadores
- [ ] Frontend: Criação e edição
- [ ] Frontend: Dashboard com status em tempo real
- [ ] Agendamento de manutenção
- [ ] Notificações em tempo real (WebSocket)

---

**Última atualização:** Dezembro 2024  
**Versão:** 1.0.0

