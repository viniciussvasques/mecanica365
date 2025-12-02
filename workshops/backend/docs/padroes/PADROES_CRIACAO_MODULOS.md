# 📐 Padrões de Criação de Módulos

**Data:** 30/11/2025  
**Status:** Ativo - Obrigatório para todos os novos módulos

---

## 🎯 ETAPA 1 — Planejamento

### Antes de criar qualquer arquivo, você define:

**1.1. Qual é a responsabilidade do módulo**

Exemplo:
- `auth`: login, tokens, refresh
- `user`: dados do usuário
- `subscription`: planos e pagamentos
- `inventory`: estoque
- `payments`: integração Stripe/Adyen

**⚠️ Regra:** Se tiver mais de 1 responsabilidade → divida em mais módulos.

---

## ✅ ETAPA 2 — Definição do Contrato (API / Interface)

### Antes do código, você define o que o módulo expõe:

**Para backend:**
- endpoints
- schemas
- events
- filas/topics
- DTOs
- use cases
- validações

**Para front-end:**
- componentes expostos
- props
- estados
- eventos
- serviços
- hooks

**👉 Você escreve o contrato sem implementar nada.**

---

## ✅ ETAPA 3 — Estrutura da Pasta do Módulo

### Padrão recomendado:

```
/module-name
    /domain
        entities/
        value-objects/
        services/
    /application
        use-cases/
        dto/
    /infra
        http/
        prisma/
        models/
        repositories/
    /tests
    index.ts
```

**Esse padrão deixa cada módulo independente e testável.**

---

## ✅ ETAPA 4 — Criação das Entidades (Domain)

### Agora você cria:

- entidades (User, Product, Machine)
- regras de negócio
- validações
- value objects
- services de domínio

**⚠️ Aqui não existe banco de dados nem http ainda.**

---

## ✅ ETAPA 5 — Criar Use Cases (Application Layer)

### Cada caso de uso é isolado:

- CreateUser
- UpdateUser
- DeleteUser
- ListUsers
- LoginUser

### Cada use case:

- recebe um DTO
- executa a lógica da entidade
- chama repositórios via interface
- retorna resultado ou exceção

---

## ✅ ETAPA 6 — Implementar Infraestrutura

### Aqui você conecta o módulo com o mundo real:

**Exemplos:**
- Prisma (ou qualquer ORM)
- Repositório real
- Controllers
- Rotas
- Kafka/Rabbit
- Cache Redis
- Filas
- Webhooks

---

## ✅ ETAPA 7 — Testes

### Crie pelo menos:

**Unitários:**
- entidades
- services
- use-cases

**Integração:**
- db
- http
- mensagens

**E2E (opcional, mas recomendado em SaaS)**

---

## ✅ ETAPA 8 — Documentação

### Todo módulo precisa de:

- README
- fluxos
- diagramas
- contratos
- decisões arquiteturais

---

## ✅ ETAPA 9 — Versionamento e Integração

### Você integra o módulo:

- CI/CD
- testes automáticos
- geração automática de documentação
- validação de contratos
- lint
- verificação do padrão de pastas

---

## ✅ ETAPA 10 — Publicação (se for microserviço ou biblioteca)

- Dockerfile
- Helm chart
- npm publish (se biblioteca)
- version bump
- tag automática

---

## 📌 RESUMO CURTO PARA USAR NO DIA A DIA

1. ✅ Definir responsabilidade
2. ✅ Criar contrato do módulo
3. ✅ Criar estrutura de pastas
4. ✅ Criar domínio (entidades + regras)
5. ✅ Criar use cases
6. ✅ Implementar infraestrutura
7. ✅ Testar
8. ✅ Documentar
9. ✅ Integrar no sistema
10. ✅ Publicar / entregar

---

## 🔍 Checklist de Conformidade

Antes de considerar um módulo completo, verifique:

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

**Última atualização:** 30/11/2025

