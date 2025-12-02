# 🔄 Plano de Refatoração de Módulos Existentes

**Data:** 30/11/2025  
**Status:** Planejamento

---

## 🎯 Objetivo

Aplicar gradualmente os padrões DDD (Domain-Driven Design) nos módulos existentes, melhorando:
- Testabilidade
- Manutenibilidade
- Separação de responsabilidades
- Documentação

---

## 📊 Estratégia de Refatoração

### Fase 1: Melhorias Imediatas (Sem Quebrar Código Existente)

**Aplicar em TODOS os módulos:**
1. ✅ Adicionar README.md com:
   - Responsabilidade do módulo
   - Endpoints disponíveis
   - Exemplos de uso
   - Diagramas de fluxo

2. ✅ Adicionar testes unitários onde faltam:
   - Mínimo 80% de cobertura
   - Testar casos de sucesso e erro
   - Testar validações

3. ✅ Documentar contratos:
   - Swagger/OpenAPI completo
   - Exemplos de request/response
   - Códigos de erro

### Fase 2: Refatoração Gradual (Quando Houver Necessidade)

**Aplicar quando módulo precisar de manutenção significativa:**

1. **Isolar Use Cases:**
   - Extrair lógica do service para use cases
   - Cada use case em arquivo separado
   - Service vira orquestrador

2. **Criar Estrutura Domain:**
   - Extrair entidades do Prisma
   - Criar value objects
   - Mover regras de negócio para domain services

3. **Separar Infraestrutura:**
   - Repositórios abstraídos
   - Controllers apenas roteamento
   - Services apenas orquestração

---

## 📋 Priorização

### 🔴 Alta Prioridade (Módulos Críticos)
1. **AuthModule** - Segurança crítica
2. **UsersModule** - Base do sistema
3. **TenantsModule** - Multi-tenancy

### 🟡 Média Prioridade (Módulos de Negócio)
4. **QuotesModule** - Core business
5. **ServiceOrdersModule** - Core business
6. **PartsModule** - Novo, aplicar padrão desde o início

### 🟢 Baixa Prioridade (Módulos Auxiliares)
7. **WorkshopSettingsModule** - Configurações
8. **CustomersModule** - CRUD simples
9. **VehiclesModule** - CRUD simples
10. **ElevatorsModule** - Já bem documentado

---

## 🚀 Próximos Módulos (Aplicar Padrão Completo)

### AppointmentsModule
- ✅ Seguir estrutura DDD desde o início
- ✅ Use cases isolados
- ✅ Testes desde o início
- ✅ README completo

### InvoicingModule
- ✅ Seguir estrutura DDD desde o início
- ✅ Use cases isolados
- ✅ Testes desde o início
- ✅ README completo

### PaymentsModule
- ✅ Seguir estrutura DDD desde o início
- ✅ Use cases isolados
- ✅ Testes desde o início
- ✅ README completo

### WebhooksModule
- ✅ Seguir estrutura DDD desde o início
- ✅ Use cases isolados
- ✅ Testes desde o início
- ✅ README completo

---

## 📝 Template de README para Módulos

```markdown
# [Nome do Módulo]

## 📋 Responsabilidade
[Descrição clara da responsabilidade única do módulo]

## 🏗️ Arquitetura
[Diagrama ou descrição da arquitetura]

## 📡 Endpoints
[Lista de endpoints com exemplos]

## 🔧 Use Cases
[Lista de use cases implementados]

## 🧪 Testes
[Como executar testes, cobertura atual]

## 📚 Dependências
[Lista de dependências internas e externas]

## 🔄 Fluxos Principais
[Descrição dos fluxos principais]

## 🚨 Decisões Arquiteturais
[Decisões importantes tomadas e por quê]
```

---

**Última atualização:** 30/11/2025

