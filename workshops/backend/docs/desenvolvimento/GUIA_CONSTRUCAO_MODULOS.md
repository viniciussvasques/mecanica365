# 🏗️ Guia de Construção de Módulos - Mecânica365

## 📋 Abordagem Recomendada: **API-First com Iterações Rápidas**

### 🎯 Princípio: **Backend → Frontend → Integração → Testes**

A melhor prática é construir **backend primeiro**, mas com **iterações rápidas** e **validação contínua**.

---

## 🔄 Fluxo de Desenvolvimento Recomendado

### **FASE 1: Backend Completo** (70% do tempo)
### **FASE 2: Frontend Completo** (25% do tempo)
### **FASE 3: Integração e Ajustes** (5% do tempo)

---

## 📐 Estrutura de Desenvolvimento por Módulo

### **ETAPA 1: Planejamento e Design** ⏱️ 10%

**Antes de começar a codificar:**

1. **Definir Entidades e Relacionamentos**
   - Criar/atualizar schema Prisma
   - Definir campos obrigatórios
   - Definir relacionamentos
   - Criar migration

2. **Definir Contratos de API**
   - Listar endpoints necessários
   - Definir DTOs (Data Transfer Objects)
   - Definir respostas esperadas
   - Documentar no Swagger

3. **Definir Regras de Negócio**
   - Validações
   - Permissões
   - Fluxos de estado
   - Exceções

**Entregáveis:**
- ✅ Schema Prisma atualizado
- ✅ Migration criada
- ✅ DTOs definidos
- ✅ Documentação de API (Swagger)

---

### **ETAPA 2: Backend - Camada de Dados** ⏱️ 15%

**Implementar acesso aos dados:**

1. **Prisma Schema**
   ```prisma
   model ServiceOrder {
     id        String   @id @default(uuid())
     tenantId  String
     number    Int      @unique
     status    String
     // ... outros campos
   }
   ```

2. **Migration**
   ```bash
   npx prisma migrate dev --name add_service_orders
   ```

3. **Validar Schema**
   ```bash
   npx prisma generate
   npx prisma validate
   ```

**Entregáveis:**
- ✅ Model no Prisma
- ✅ Migration aplicada
- ✅ Prisma Client gerado

---

### **ETAPA 3: Backend - Service Layer** ⏱️ 30%

**Implementar lógica de negócio:**

1. **Criar Service**
   ```typescript
   // service-orders.service.ts
   @Injectable()
   export class ServiceOrdersService {
     // Métodos CRUD
     async create(dto: CreateServiceOrderDto)
     async findAll(filters: ServiceOrderFilters)
     async findOne(id: string)
     async update(id: string, dto: UpdateServiceOrderDto)
     async delete(id: string)
     
     // Métodos de negócio
     async finalize(id: string)
     async cancel(id: string)
     async approve(id: string)
   }
   ```

2. **Implementar Regras de Negócio**
   - Validações
   - Permissões
   - Transações
   - Logs de auditoria

3. **Testes Unitários**
   ```typescript
   // service-orders.service.spec.ts
   describe('ServiceOrdersService', () => {
     it('deve criar OS com sucesso')
     it('deve validar campos obrigatórios')
     it('deve aplicar regras de negócio')
   })
   ```

**Entregáveis:**
- ✅ Service implementado
- ✅ Regras de negócio aplicadas
- ✅ Testes unitários (cobertura > 80%)
- ✅ Tratamento de erros

---

### **ETAPA 4: Backend - Controller Layer** ⏱️ 15%

**Implementar endpoints da API:**

1. **Criar Controller**
   ```typescript
   // service-orders.controller.ts
   @Controller('service-orders')
   @UseGuards(JwtAuthGuard, RolesGuard)
   export class ServiceOrdersController {
     @Post()
     @Roles(UserRole.ADMIN, UserRole.MANAGER)
     async create(@Body() dto: CreateServiceOrderDto)
     
     @Get()
     async findAll(@Query() filters: ServiceOrderFilters)
     
     @Get(':id')
     async findOne(@Param('id') id: string)
     
     @Patch(':id')
     async update(@Param('id') id: string, @Body() dto: UpdateServiceOrderDto)
     
     @Delete(':id')
     async delete(@Param('id') id: string)
   }
   ```

2. **Configurar Swagger**
   ```typescript
   @ApiTags('Service Orders')
   @ApiOperation({ summary: 'Criar ordem de serviço' })
   @ApiResponse({ status: 201, description: 'OS criada com sucesso' })
   ```

3. **Testes de Integração**
   ```typescript
   // service-orders.controller.spec.ts
   describe('ServiceOrdersController (e2e)', () => {
     it('/service-orders (POST) deve criar OS')
     it('/service-orders (GET) deve listar OSs')
   })
   ```

**Entregáveis:**
- ✅ Controller implementado
- ✅ Endpoints funcionando
- ✅ Swagger documentado
- ✅ Testes de integração
- ✅ Validação de DTOs

---

### **ETAPA 5: Backend - Guards e Permissões** ⏱️ 10%

**Implementar segurança e autorização:**

1. **Feature Flags**
   ```typescript
   @RequireFeature('service_orders')
   @Controller('service-orders')
   ```

2. **Permissões por Role**
   ```typescript
   @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.MECHANIC)
   @Post()
   ```

3. **Limites por Plano**
   ```typescript
   @PlanLimit('serviceOrdersLimit')
   @Post()
   ```

**Entregáveis:**
- ✅ Guards configurados
- ✅ Permissões aplicadas
- ✅ Feature flags funcionando
- ✅ Limites por plano funcionando

---

### **ETAPA 6: Frontend - Estrutura Base** ⏱️ 10%

**Criar estrutura básica do frontend:**

1. **Páginas/Componentes**
   ```
   app/
   ├── service-orders/
   │   ├── page.tsx (listagem)
   │   ├── [id]/
   │   │   ├── page.tsx (detalhes)
   │   │   └── edit/
   │   │       └── page.tsx (edição)
   │   └── new/
   │       └── page.tsx (criação)
   ```

2. **Componentes Reutilizáveis**
   ```
   components/
   ├── service-orders/
   │   ├── ServiceOrderCard.tsx
   │   ├── ServiceOrderForm.tsx
   │   ├── ServiceOrderTable.tsx
   │   └── ServiceOrderStatusBadge.tsx
   ```

3. **API Client**
   ```typescript
   // lib/api/service-orders.ts
   export const serviceOrdersApi = {
     create: (data: CreateServiceOrderDto) => api.post('/service-orders', data),
     findAll: (filters: ServiceOrderFilters) => api.get('/service-orders', { params: filters }),
     findOne: (id: string) => api.get(`/service-orders/${id}`),
     update: (id: string, data: UpdateServiceOrderDto) => api.patch(`/service-orders/${id}`, data),
     delete: (id: string) => api.delete(`/service-orders/${id}`),
   }
   ```

**Entregáveis:**
- ✅ Estrutura de pastas criada
- ✅ Componentes base criados
- ✅ API client configurado

---

### **ETAPA 7: Frontend - Implementação Completa** ⏱️ 15%

**Implementar funcionalidades completas:**

1. **Listagem**
   - Tabela com paginação
   - Filtros e busca
   - Ordenação
   - Ações rápidas

2. **Formulários**
   - Criação
   - Edição
   - Validação
   - Feedback visual

3. **Detalhes**
   - Visualização completa
   - Timeline
   - Anexos
   - Histórico

4. **Integração com Backend**
   - Chamadas de API
   - Tratamento de erros
   - Loading states
   - Notificações

**Entregáveis:**
- ✅ Páginas funcionais
- ✅ Formulários validados
- ✅ Integração com API
- ✅ UX polida

---

### **ETAPA 8: Testes e Validação** ⏱️ 5%

**Testar módulo completo:**

1. **Testes E2E**
   - Fluxo completo de criação
   - Fluxo de edição
   - Fluxo de finalização
   - Validações de permissões

2. **Validação Manual**
   - Testar todos os cenários
   - Validar regras de negócio
   - Verificar permissões
   - Testar limites por plano

3. **Ajustes Finais**
   - Correções de bugs
   - Melhorias de UX
   - Otimizações

**Entregáveis:**
- ✅ Testes E2E passando
- ✅ Validação manual completa
- ✅ Bugs corrigidos
- ✅ Documentação atualizada

---

## 🎯 Ordem de Prioridade dos Módulos

### **FASE 1: MVP (Prioridade Alta)**

1. **✅ Ordens de Serviço** (CRUD completo)
   - Backend: 2-3 dias
   - Frontend: 2-3 dias
   - **Total: 4-6 dias**

2. **✅ Orçamentos** (CRUD completo)
   - Backend: 2-3 dias
   - Frontend: 2-3 dias
   - **Total: 4-6 dias**

3. **Clientes** (CRUD básico)
   - Backend: 1-2 dias
   - Frontend: 1-2 dias
   - **Total: 2-4 dias**

4. **Veículos** (CRUD básico)
   - Backend: 1-2 dias
   - Frontend: 1-2 dias
   - **Total: 2-4 dias**

5. **Estoque** (CRUD básico)
   - Backend: 2-3 dias
   - Frontend: 2-3 dias
   - **Total: 4-6 dias**

6. **Elevadores** (CRUD básico)
   - Backend: 1-2 dias
   - Frontend: 1-2 dias
   - **Total: 2-4 dias**

---

## 📝 Checklist por Módulo

### Backend ✅

- [ ] Schema Prisma criado/atualizado
- [ ] Migration criada e aplicada
- [ ] DTOs criados (Create, Update, Response, Filters)
- [ ] Service implementado com todas as regras de negócio
- [ ] Controller implementado com todos os endpoints
- [ ] Guards e permissões configurados
- [ ] Feature flags configurados
- [ ] Limites por plano configurados
- [ ] Testes unitários (cobertura > 80%)
- [ ] Testes de integração
- [ ] Swagger documentado
- [ ] Tratamento de erros
- [ ] Logs de auditoria
- [ ] Validações implementadas

### Frontend ✅

- [ ] Estrutura de pastas criada
- [ ] Componentes base criados
- [ ] API client configurado
- [ ] Páginas de listagem implementadas
- [ ] Páginas de criação implementadas
- [ ] Páginas de edição implementadas
- [ ] Páginas de detalhes implementadas
- [ ] Formulários validados
- [ ] Filtros e busca funcionando
- [ ] Paginação implementada
- [ ] Loading states
- [ ] Tratamento de erros
- [ ] Notificações
- [ ] Responsividade
- [ ] Acessibilidade básica

### Integração ✅

- [ ] Endpoints testados via Postman/Insomnia
- [ ] Frontend integrado com backend
- [ ] Fluxos completos testados
- [ ] Permissões testadas
- [ ] Limites por plano testados
- [ ] Performance validada
- [ ] Documentação atualizada

---

## 🚀 Comandos Úteis

### Backend

```bash
# Criar migration
npx prisma migrate dev --name add_service_orders

# Gerar Prisma Client
npx prisma generate

# Executar testes
npm run test

# Executar testes com cobertura
npm run test:cov

# Executar lint
npm run lint

# Build
npm run build

# Swagger
# Acessar: http://localhost:3001/api
```

### Frontend

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Lint
npm run lint

# Testes
npm run test
```

---

## 📊 Métricas de Qualidade

### Backend
- ✅ Cobertura de testes > 80%
- ✅ Zero erros de linting
- ✅ Todos os endpoints documentados no Swagger
- ✅ Type safety completo (sem `any` desnecessário)
- ✅ Tratamento de erros adequado

### Frontend
- ✅ Componentes reutilizáveis
- ✅ Validação de formulários
- ✅ Tratamento de erros
- ✅ Loading states
- ✅ Responsividade
- ✅ Acessibilidade básica

---

## 🎯 Recomendação Final

### **✅ SIM: Backend Primeiro, Depois Frontend**

**Por quê?**

1. **Contratos Definidos**: API define o contrato entre frontend e backend
2. **Testes Independentes**: Backend pode ser testado sem frontend
3. **Validação Rápida**: Postman/Insomnia para testar API
4. **Menos Refatoração**: Frontend se adapta ao backend, não o contrário
5. **Paralelização**: Frontend pode começar quando API está 80% pronta

### **⚠️ MAS: Com Iterações Rápidas**

- Não espere backend 100% completo
- Frontend pode começar quando endpoints principais estão prontos
- Ajustes são esperados durante integração

### **🔄 Fluxo Ideal:**

```
1. Backend: Schema + Service + Controller (endpoints básicos)
   ↓
2. Frontend: Estrutura + Integração básica
   ↓
3. Backend: Ajustes baseados em feedback
   ↓
4. Frontend: Implementação completa
   ↓
5. Integração: Testes e ajustes finais
```

---

## 📚 Próximos Passos

1. **Escolher primeiro módulo** (recomendado: Ordens de Serviço)
2. **Seguir checklist completo**
3. **Documentar durante desenvolvimento**
4. **Testar cada etapa antes de avançar**
5. **Fazer commit após cada etapa completa**

---

**Status:** ✅ Guia Completo e Pronto para Uso
**Próxima Ação:** Escolher módulo e começar desenvolvimento seguindo este guia

