# 📋 TODO - Implementação de Módulos Faltantes

**Data:** 01/12/2025  
**Baseado em:** `PADROES_CRIACAO_MODULOS.md` e `ANALISE_FLUXO_COMPLETO.md`

---

## 🎯 Resumo Executivo

**Total de Tarefas:** 30 tarefas  
**Módulos Implementados:** 3 ✅ (AppointmentsModule, AttachmentsModule, ChecklistsModule)  
**Melhorias Implementadas:** 2 ✅ (QuotesModule, ServiceOrdersModule)  
**Integrações Implementadas:** 1 ✅ (Integração automática de appointments)  
**Pendente:** 1 (Migração de dados - opcional)

---

## 📦 Módulo 1: AppointmentsModule ✅ COMPLETO

### ETAPA 1: Planejamento ✅
- [x] **appointments-1:** Definir responsabilidade (agendamento de serviços, verificação de fila, calendário)

### ETAPA 2: Contrato ✅
- [x] **appointments-2:** Definir endpoints, DTOs, validações, use cases

### ETAPA 3: Estrutura ✅
- [x] **appointments-3:** Criar estrutura de pastas (domain, application, infra, tests)

### ETAPA 4: Domain ✅
- [x] **appointments-4:** Criar entidades, regras de negócio, validações (Appointment entity)
  - ⚠️ Schema Prisma já existe (model `Appointment`)

### ETAPA 5: Use Cases ✅
- [x] **appointments-5:** Criar use cases:
  - CreateAppointment
  - UpdateAppointment
  - ListAppointments
  - CheckAvailability
  - CancelAppointment

### ETAPA 6: Infraestrutura ✅
- [x] **appointments-6:** Implementar:
  - Service
  - Controller
  - Prisma repository
  - Integração com ServiceOrders
  - Integração com Elevators

### ETAPA 7: Testes ✅
- [x] **appointments-7:** Criar testes unitários (mínimo 80% cobertura) e testes de integração

### ETAPA 8: Documentação ✅
- [x] **appointments-8:** Criar README, fluxos, diagramas, contratos

### ETAPA 9: Integração ✅
- [x] **appointments-9:** Registrar no app.module.ts, validar lint, TypeScript, CI/CD

### ETAPA 10: Integração Automática ✅
- [x] **appointments-10:** Implementar criação automática após aprovação de orçamento

---

## 📦 Módulo 2: AttachmentsModule ✅ COMPLETO

### ETAPA 1: Planejamento ✅
- [x] **attachments-1:** Definir responsabilidade (upload, armazenamento, gerenciamento de fotos/arquivos)

### ETAPA 2: Contrato ✅
- [x] **attachments-2:** Definir endpoints, DTOs, tipos de anexos:
  - `photo_before` (antes do serviço)
  - `photo_during` (durante o serviço)
  - `photo_after` (após o serviço)
  - `document` (documentos)

### ETAPA 3: Estrutura ✅
- [x] **attachments-3:** Criar estrutura de pastas (domain, application, infra, tests)

### ETAPA 4: Domain ✅
- [x] **attachments-4:** Criar model `Attachment` no Prisma, entidades, regras de negócio, validações

### ETAPA 5: Use Cases ✅
- [x] **attachments-5:** Criar use cases:
  - UploadAttachment
  - ListAttachments
  - DeleteAttachment
  - GetAttachment

### ETAPA 6: Infraestrutura ✅
- [x] **attachments-6:** Implementar:
  - Service
  - Controller
  - Upload local/S3
  - Integração com Quotes
  - Integração com ServiceOrders

### ETAPA 7: Testes ✅
- [x] **attachments-7:** Criar testes unitários (mínimo 80% cobertura) e testes de integração

### ETAPA 8: Documentação ✅
- [x] **attachments-8:** Criar README, fluxos, tipos de anexos, integrações

### ETAPA 9: Integração ✅
- [x] **attachments-9:** Registrar no app.module.ts, migrar arrays de strings para referências, validar lint/TypeScript

---

## 📦 Módulo 3: ChecklistsModule ✅ COMPLETO

### ETAPA 1: Planejamento ✅
- [x] **checklists-1:** Definir responsabilidade:
  - Checklist pré-diagnóstico
  - Checklist pré-serviço
  - Checklist durante serviço
  - Checklist pós-serviço

### ETAPA 2: Contrato ✅
- [x] **checklists-2:** Definir endpoints, DTOs, tipos de checklist, templates, validações

### ETAPA 3: Estrutura ✅
- [x] **checklists-3:** Criar estrutura de pastas (domain, application, infra, tests)

### ETAPA 4: Domain ✅
- [x] **checklists-4:** Criar models `Checklist` e `ChecklistItem` no Prisma, entidades, regras de negócio

### ETAPA 5: Use Cases ✅
- [x] **checklists-5:** Criar use cases:
  - CreateChecklist
  - UpdateChecklist
  - CompleteChecklist
  - ValidateChecklist
  - ListChecklists

### ETAPA 6: Infraestrutura ✅
- [x] **checklists-6:** Implementar:
  - Service
  - Controller
  - Templates
  - Integração com Quotes
  - Integração com ServiceOrders

### ETAPA 7: Testes ✅
- [x] **checklists-7:** Criar testes unitários (mínimo 80% cobertura) e testes de integração

### ETAPA 8: Documentação ✅
- [x] **checklists-8:** Criar README, templates de checklist, fluxos, validações

### ETAPA 9: Integração ✅
- [x] **checklists-9:** Registrar no app.module.ts, validar lint, TypeScript, CI/CD

### ETAPA 10: Validação ✅
- [x] **checklists-10:** Implementar validação de checklist antes de finalizar Service Order

---

## 🔧 Melhorias em Módulos Existentes

### QuotesModule ✅ COMPLETO
- [x] **quotes-improvements:** 
  - Integrar com AttachmentsModule (substituir `inspectionPhotos` array)
  - Integrar com ChecklistsModule
  - Checklist pré-diagnóstico automático na criação

### ServiceOrdersModule ✅ COMPLETO
- [x] **service-orders-improvements:**
  - Adicionar campo `finalNotes` (observações finais do mecânico)
  - Integrar com AttachmentsModule (substituir `inspectionPhotos` array)
  - Integrar com ChecklistsModule
  - Validação de checklists antes de finalizar

---

## 🔄 Migrações e Integrações

### Migração de Dados
- [ ] **migration-attachments:** 
  - Substituir arrays `inspectionPhotos` em `Quote` e `ServiceOrder` por referências ao model `Attachment`
  - Criar migration do Prisma
  - Migrar dados existentes (se houver)

### Integração Automática ✅ COMPLETO
- [x] **integration-automatic-appointment:**
  - Implementar criação automática de `Appointment` após aprovação de `Quote`
  - Verificar disponibilidade de elevador
  - Verificar fila de serviços
  - Criar agendamento automaticamente quando Service Order é criada

---

## 📊 Estatísticas

### Por Módulo
- **AppointmentsModule:** 10 etapas
- **AttachmentsModule:** 9 etapas
- **ChecklistsModule:** 10 etapas
- **Melhorias:** 2 tarefas
- **Migrações/Integrações:** 2 tarefas

### Por Prioridade
- 🔴 **Alta:** AppointmentsModule (crítico para fluxo)
- 🔴 **Alta:** AttachmentsModule (necessário para fotos)
- 🔴 **Alta:** ChecklistsModule (necessário para validação)
- 🟡 **Média:** Melhorias em módulos existentes
- 🟡 **Média:** Migrações e integrações

---

## 🎯 Ordem de Implementação Recomendada

### Fase 1: AppointmentsModule (Primeiro)
**Motivo:** Crítico para o fluxo após aprovação de orçamento

1. Etapas 1-4: Planejamento, Contrato, Estrutura, Domain
2. Etapas 5-6: Use Cases e Infraestrutura
3. Etapas 7-8: Testes e Documentação
4. Etapas 9-10: Integração e Integração Automática

### Fase 2: AttachmentsModule (Segundo)
**Motivo:** Necessário para substituir arrays de strings e implementar upload estruturado

1. Etapas 1-4: Planejamento, Contrato, Estrutura, Domain
2. Etapas 5-6: Use Cases e Infraestrutura
3. Etapas 7-8: Testes e Documentação
4. Etapa 9: Integração e Migração

### Fase 3: ChecklistsModule (Terceiro)
**Motivo:** Necessário para validação antes de finalizar serviços

1. Etapas 1-4: Planejamento, Contrato, Estrutura, Domain
2. Etapas 5-6: Use Cases e Infraestrutura
3. Etapas 7-8: Testes e Documentação
4. Etapas 9-10: Integração e Validação

### Fase 4: Melhorias e Integrações
**Motivo:** Integrar novos módulos com existentes

1. Melhorias em QuotesModule
2. Melhorias em ServiceOrdersModule
3. Migração de dados (Attachments)
4. Integração automática (Appointments)

---

## ✅ Checklist de Conformidade (por Módulo)

Antes de considerar um módulo completo, verificar:

- [ ] Responsabilidade única e bem definida
- [ ] Contrato/Interface documentado
- [ ] Estrutura de pastas seguindo padrão
- [ ] Entidades de domínio criadas
- [ ] Use cases implementados
- [ ] Infraestrutura conectada
- [ ] Testes unitários (mínimo 80% cobertura)
- [ ] Testes de integração
- [ ] README completo
- [ ] Integrado no sistema principal
- [ ] Lint passando
- [ ] TypeScript sem erros

---

## 📝 Notas Importantes

1. **AppointmentsModule:** Schema Prisma já existe, apenas implementar Service, Controller, DTOs
2. **AttachmentsModule:** Substituir arrays de strings (`inspectionPhotos`) por referências ao model `Attachment`
3. **ChecklistsModule:** Criar do zero, incluindo schema Prisma
4. **Migração:** Criar migration para substituir arrays por referências (pode perder dados se não migrar corretamente)
5. **Integração Automática:** Implementar no `QuotesService.approve()` para criar Appointment automaticamente

---

**Última atualização:** 01/12/2025

