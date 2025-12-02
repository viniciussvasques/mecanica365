# 📅 AppointmentsModule

Módulo responsável pelo gerenciamento de agendamentos de serviços, verificação de disponibilidade de mecânicos e elevadores, e integração com ordens de serviço.

---

## 🎯 Responsabilidade

- **Agendamento de serviços:** Criar, atualizar, cancelar e remover agendamentos
- **Verificação de disponibilidade:** Verificar conflitos de horário para mecânicos e elevadores
- **Integração automática:** Criar agendamento automaticamente quando uma ordem de serviço é criada após aprovação de orçamento
- **Calendário:** Listar agendamentos com filtros por data, mecânico, cliente, etc.

---

## 📋 Endpoints

### `POST /api/appointments`
Cria um novo agendamento.

**Body:**
```json
{
  "customerId": "uuid",
  "serviceOrderId": "uuid",
  "assignedToId": "uuid",
  "date": "2024-12-15T10:00:00Z",
  "duration": 60,
  "serviceType": "Manutenção preventiva",
  "notes": "Cliente prefere manhã",
  "status": "scheduled"
}
```

### `GET /api/appointments`
Lista agendamentos com filtros e paginação.

**Query Parameters:**
- `customerId` (opcional)
- `serviceOrderId` (opcional)
- `assignedToId` (opcional)
- `status` (opcional)
- `startDate` (opcional)
- `endDate` (opcional)
- `page` (padrão: 1)
- `limit` (padrão: 10)

### `GET /api/appointments/check-availability`
Verifica disponibilidade para agendamento.

**Query Parameters:**
- `date` (obrigatório)
- `duration` (opcional, padrão: 60)
- `elevatorId` (opcional)

### `GET /api/appointments/:id`
Busca um agendamento por ID.

### `PUT /api/appointments/:id`
Atualiza um agendamento.

### `DELETE /api/appointments/:id`
Remove um agendamento (apenas se não estiver em progresso ou completo).

### `POST /api/appointments/:id/cancel`
Cancela um agendamento (apenas se não estiver completo).

---

## 🔄 Status do Agendamento

- `scheduled`: Agendado
- `confirmed`: Confirmado
- `in_progress`: Em progresso
- `completed`: Completo
- `cancelled`: Cancelado
- `no_show`: Cliente não compareceu

---

## ✅ Regras de Negócio

1. **Data não pode ser no passado:** Ao criar ou atualizar, a data deve ser futura
2. **Conflito de horário:** Não é possível agendar um mecânico no mesmo horário de outro agendamento ativo
3. **Disponibilidade de elevador:** Verifica se o elevador está disponível no horário solicitado
4. **Remoção:** Não é possível remover agendamentos em progresso ou completos
5. **Cancelamento:** Não é possível cancelar agendamentos já completos

---

## 🔗 Integrações

### ServiceOrdersModule
- Quando uma ordem de serviço é criada após aprovação de orçamento, um agendamento é criado automaticamente
- O agendamento é vinculado à ordem de serviço através do `serviceOrderId`

### ElevatorsModule
- Verifica disponibilidade de elevadores antes de criar agendamento
- Integra com `ElevatorUsage` para verificar conflitos de horário

---

## 📊 Fluxo de Uso

### 1. Cliente aprova orçamento
```
Quote aprovado → Service Order criada → Appointment criado automaticamente
```

### 2. Agendamento manual
```
Receptionist cria Appointment → Verifica disponibilidade → Cria agendamento
```

### 3. Verificação de disponibilidade
```
GET /check-availability → Retorna conflitos (mecânico, elevador)
```

---

## 🧪 Testes

Execute os testes:
```bash
npm run test -- appointments.service.spec.ts
```

**Cobertura:** 12 testes unitários cobrindo:
- Criação de agendamento
- Validações (data passada, cliente não existe, conflito de horário)
- Busca por ID
- Cancelamento
- Remoção

---

## 📝 Notas Importantes

1. **Schema Prisma:** O model `Appointment` já existe no schema
2. **Integração Automática:** Implementada no `QuotesService.approve()` para criar Appointment quando Service Order é criada
3. **Verificação de Conflito:** Usa algoritmo de sobreposição de intervalos para verificar conflitos de horário

---

**Última atualização:** 01/12/2025

