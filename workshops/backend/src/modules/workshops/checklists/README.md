# ✅ ChecklistsModule

**Módulo de Gerenciamento de Checklists**

## 📋 Descrição

O `ChecklistsModule` é responsável por gerenciar checklists de validação para orçamentos e ordens de serviço, garantindo que todos os processos sejam executados corretamente antes de finalizar um serviço.

## 🎯 Responsabilidades

- Criação de checklists personalizados
- Validação de processos (pré-diagnóstico, pré-serviço, durante serviço, pós-serviço)
- Marcação de itens como completos
- Validação de completude (todos os itens obrigatórios)
- Integração com Quotes e ServiceOrders

## 📦 Tipos de Checklist

O módulo suporta os seguintes tipos de checklist:

- `pre_diagnosis`: Checklist pré-diagnóstico (apenas para Quote)
- `pre_service`: Checklist pré-serviço (apenas para ServiceOrder)
- `during_service`: Checklist durante serviço (apenas para ServiceOrder)
- `post_service`: Checklist pós-serviço (apenas para ServiceOrder)

## 🔗 Relacionamentos

Os checklists podem estar relacionados a:

- **Quote** (`entityType: 'quote'`): Apenas checklist `pre_diagnosis`
- **ServiceOrder** (`entityType: 'service_order'`): Checklists `pre_service`, `during_service`, `post_service`

## 📊 Status do Checklist

- `pending`: Pendente (nenhum item completo)
- `in_progress`: Em progresso (alguns itens completos)
- `completed`: Completo (todos os itens obrigatórios completos)
- `cancelled`: Cancelado

## 🛠️ Endpoints

### POST `/api/checklists`
Criar um novo checklist.

**Body:**
```json
{
  "entityType": "quote",
  "entityId": "uuid",
  "checklistType": "pre_diagnosis",
  "name": "Checklist Pré-Diagnóstico",
  "description": "Checklist para verificação inicial",
  "items": [
    {
      "title": "Verificar nível de óleo",
      "description": "Verificar se o nível está entre mínimo e máximo",
      "isRequired": true,
      "order": 0
    }
  ]
}
```

**Resposta:**
```json
{
  "id": "uuid",
  "entityType": "quote",
  "entityId": "uuid",
  "checklistType": "pre_diagnosis",
  "name": "Checklist Pré-Diagnóstico",
  "status": "pending",
  "items": [...],
  "createdAt": "2025-12-01T10:00:00.000Z",
  "updatedAt": "2025-12-01T10:00:00.000Z"
}
```

### GET `/api/checklists`
Lista checklists com filtros e paginação.

**Query Parameters:**
- `entityType` (opcional): Filtrar por tipo de entidade (`quote` ou `service_order`)
- `entityId` (opcional): Filtrar por ID da entidade
- `checklistType` (opcional): Filtrar por tipo de checklist
- `status` (opcional): Filtrar por status
- `startDate` (opcional): Data inicial (ISO 8601)
- `endDate` (opcional): Data final (ISO 8601)
- `page` (opcional): Página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20, máximo: 100)

**Resposta:**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### GET `/api/checklists/:id`
Busca um checklist específico por ID.

**Resposta:**
```json
{
  "id": "uuid",
  "entityType": "quote",
  "checklistType": "pre_diagnosis",
  "name": "Checklist Pré-Diagnóstico",
  "status": "pending",
  "items": [...],
  ...
}
```

### PATCH `/api/checklists/:id`
Atualiza um checklist (metadados e itens).

**Body:**
```json
{
  "name": "Checklist Atualizado",
  "description": "Nova descrição",
  "items": [...]
}
```

**Nota:** Não é possível atualizar um checklist já completo.

### POST `/api/checklists/:id/complete`
Completa um checklist (marca itens como completos).

**Body:**
```json
{
  "items": [
    {
      "itemId": "uuid",
      "isCompleted": true,
      "notes": "Óleo verificado e aprovado"
    }
  ],
  "notes": "Todos os itens foram verificados"
}
```

**Resposta:**
```json
{
  "id": "uuid",
  "status": "completed",
  "completedAt": "2025-12-01T10:00:00.000Z",
  "completedById": "uuid",
  "items": [...]
}
```

### GET `/api/checklists/:id/validate`
Valida se um checklist está completo (todos os itens obrigatórios).

**Resposta:**
```json
{
  "isValid": true
}
```

### DELETE `/api/checklists/:id`
Remove um checklist.

**Resposta:** 204 No Content

## ✅ Validações

### Tipos de Checklist vs Entidades

- **Quote** só pode ter checklist do tipo `pre_diagnosis`
- **ServiceOrder** pode ter checklists `pre_service`, `during_service`, `post_service`
- **ServiceOrder** não pode ter checklist `pre_diagnosis`

### Status do Checklist

- Checklist `pending` pode ser atualizado
- Checklist `completed` não pode ser atualizado
- Checklist `completed` não pode ser completado novamente

### Itens Obrigatórios

- Todos os itens com `isRequired: true` devem estar completos para o checklist ser considerado válido
- Itens não obrigatórios podem estar incompletos

## 🔄 Integrações Futuras

### Validação Antes de Finalizar Service Order

Quando um Service Order for finalizado, o sistema deve validar se todos os checklists obrigatórios estão completos:

```typescript
// Exemplo de integração futura
const preServiceChecklist = await checklistsService.findAll(tenantId, {
  entityType: ChecklistEntityType.SERVICE_ORDER,
  entityId: serviceOrderId,
  checklistType: ChecklistType.PRE_SERVICE,
});

const isValid = await checklistsService.validate(
  tenantId,
  preServiceChecklist.data[0].id,
);

if (!isValid) {
  throw new BadRequestException(
    'Não é possível finalizar a ordem de serviço. Checklist pré-serviço não está completo.',
  );
}
```

### Templates de Checklist

No futuro, o sistema pode suportar templates de checklist pré-configurados:

- Template "Checklist Básico de Inspeção"
- Template "Checklist Completo de Manutenção"
- Template "Checklist de Revisão"

## 🧪 Testes

### Testes Unitários
- ✅ Criar checklist
- ✅ Listar checklists
- ✅ Buscar checklist
- ✅ Atualizar checklist
- ✅ Completar checklist
- ✅ Validar checklist
- ✅ Remover checklist
- ✅ Validação de tipos
- ✅ Validação de entidades

### Testes de Integração
- ✅ Integração com Quotes
- ✅ Integração com ServiceOrders
- ✅ Validação de completude

## 📝 Notas Importantes

1. **Validação de Tipos:** O sistema valida automaticamente se o tipo de checklist é compatível com o tipo de entidade.

2. **Itens Obrigatórios:** Apenas itens obrigatórios são considerados na validação de completude.

3. **Status Automático:** O status do checklist é atualizado automaticamente quando itens são marcados como completos:
   - `pending` → `in_progress` (quando pelo menos um item obrigatório é completado)
   - `in_progress` → `completed` (quando todos os itens obrigatórios são completados)

4. **Ordem dos Itens:** Os itens são ordenados pelo campo `order` (menor para maior).

5. **Histórico:** O sistema registra quem completou o checklist (`completedById`) e quando (`completedAt`).

## 🔗 Dependências

- `PrismaModule`: Acesso ao banco de dados

## 📚 Referências

- [Prisma Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [NestJS Validation](https://docs.nestjs.com/techniques/validation)

---

**Última atualização:** 02/12/2025

