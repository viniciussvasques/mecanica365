# Estrutura do Projeto - AutoVida

**Versão:** 2.0  
**Data:** 2024

---

## 📁 Estrutura Completa

```
erp-dealer/
├── workshops/                  # 🏭 Sistema Oficinas (Completo)
│   ├── backend/               # NestJS Backend
│   ├── frontend/              # Next.js Frontend
│   ├── admin/                 # Next.js Admin Panel (específico oficinas)
│   └── docs/                  # Documentação específica oficinas
│
├── dealers/                   # 🚗 Sistema Dealers (Completo)
│   ├── backend/               # NestJS Backend
│   ├── frontend/              # Next.js Frontend
│   ├── admin/                 # Next.js Admin Panel (específico dealers)
│   └── docs/                  # Documentação específica dealers
│
├── vehicle-history-service/   # 🔍 Vehicle History Platform (Microserviço)
│   ├── backend/               # NestJS Backend (API compartilhada)
│   └── docs/                  # Documentação do serviço
│
├── shared/                    # 📦 Código Compartilhado
│   ├── types/                 # TypeScript types compartilhados
│   ├── schemas/               # Schemas de validação (Zod)
│   └── utils/                 # Utilitários compartilhados
│
└── docs/                      # 📚 Documentação Geral
    ├── planejamento/
    ├── backlog/
    ├── arquitetura/
    ├── desenvolvimento/
    └── produto/
```

---

## 🎯 Arquitetura de Sistemas

### 1. Sistema Workshops (Oficinas)

**Objetivo:** ERP completo para oficinas mecânicas

**Componentes:**
- **Backend:** NestJS (API REST)
- **Frontend:** Next.js (Interface para oficinas)
- **Admin:** Next.js (Painel admin específico)
- **Docs:** Documentação do sistema

**Módulos:**
- Service Orders (ROs)
- Agendamentos
- Estoque de Peças
- Clientes
- Faturamento
- Integração Vehicle History (escrita)

---

### 2. Sistema Dealers (Concessionárias)

**Objetivo:** ERP completo para concessionárias

**Componentes:**
- **Backend:** NestJS (API REST)
- **Frontend:** Next.js (Interface para dealers)
- **Admin:** Next.js (Painel admin específico)
- **Docs:** Documentação do sistema

**Módulos:**
- Inventory (Veículos)
- CRM & Leads
- Sales / Desking
- Service/RO
- Parts
- Dashboard
- Integração Vehicle History (leitura)

---

### 3. Vehicle History Service (Microserviço)

**Objetivo:** Plataforma de histórico de veículos (hub central)

**Componentes:**
- **Backend:** NestJS (API REST compartilhada)
- **Docs:** Documentação do serviço

**Funcionalidades:**
- Consulta por VIN/Placa
- Cache de consultas
- Health Score calculation
- Geração de PDF
- API para Workshops (escrita)
- API para Dealers (leitura)

**Por que separado:**
- ✅ É o core do negócio (diferencial competitivo)
- ✅ Precisa escalar independente (muitas consultas)
- ✅ Compartilhado entre os dois sistemas
- ✅ Pode ter seu próprio banco de dados
- ✅ Facilita cache e otimizações

---

## 🔄 Comunicação entre Sistemas

### Workshops → Vehicle History

```
Workshop finaliza RO
    ↓
POST /api/vehicle-history/update
    ↓
Vehicle History atualiza histórico
    ↓
Retorna sucesso
```

### Dealers → Vehicle History

```
Dealer consulta histórico
    ↓
GET /api/vehicle-history/query?vin=ABC123
    ↓
Vehicle History retorna histórico completo
    ↓
Dealer exibe para cliente
```

### Vehicle History → Workshops/Dealers

```
Vehicle History atualizado
    ↓
Webhook (opcional)
    ↓
Notifica sistema interessado
```

---

## 🚀 Ordem de Desenvolvimento

### Fase 1: Vehicle History Service (Base) ⭐

**Por que primeiro:**
- ✅ Base para os outros sistemas
- ✅ Define contratos de API
- ✅ Pode ser desenvolvido em paralelo

**Tempo estimado:** 3-4 semanas

---

### Fase 2: Sistema Workshops (Primeiro Sistema Completo)

**Componentes:**
1. Backend Workshops
2. Frontend Workshops
3. Admin Workshops
4. Integração Vehicle History

**Tempo estimado:** 8-10 semanas

---

### Fase 3: Sistema Dealers

**Componentes:**
1. Backend Dealers
2. Frontend Dealers
3. Admin Dealers
4. Integração Vehicle History

**Tempo estimado:** 10-12 semanas

---

## 🔧 Tecnologias

### Backends (Workshops, Dealers, Vehicle History)

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **ORM:** Prisma 5+
- **Database:** PostgreSQL 16+ (cada um pode ter seu próprio DB)
- **Cache:** Redis 7+ (compartilhado ou separado)
- **Validation:** class-validator + class-transformer
- **Documentation:** Swagger/OpenAPI

### Frontends (Workshops, Dealers, Admins)

- **Framework:** Next.js 14+
- **Language:** TypeScript 5+
- **UI:** Tailwind CSS + shadcn/ui
- **State:** Zustand + React Query
- **Forms:** React Hook Form + Zod

---

## 📦 Sistema Modular

Cada sistema tem seu próprio sistema de módulos baseado em planos:

- **Workshops:** Starter, Professional, Enterprise
- **Dealers:** Basic, Premium, Enterprise

Feature flags controlam acesso a módulos.

---

## 🗄️ Bancos de Dados

### Opção 1: Database por Sistema (Recomendado)

- `workshops_db` - Banco do sistema Workshops
- `dealers_db` - Banco do sistema Dealers
- `vehicle_history_db` - Banco do Vehicle History Service

**Vantagens:**
- ✅ Isolamento completo
- ✅ Escala independente
- ✅ Backup/restore independente

### Opção 2: Database Compartilhado (Alternativa)

- `autovida_db` - Banco único com schemas separados

**Vantagens:**
- ✅ Menos infraestrutura
- ✅ Transações cross-sistema (se necessário)

**Decisão:** Opção 1 (Database por Sistema)

---

## 🔐 Autenticação

### Opção 1: Auth Compartilhado (Recomendado)

- Auth0 ou Keycloak centralizado
- Todos os sistemas usam o mesmo provider
- SSO entre sistemas

### Opção 2: Auth por Sistema

- Cada sistema tem seu próprio auth
- Mais complexo de manter

**Decisão:** Opção 1 (Auth Compartilhado)

---

## 📋 Documentação por Sistema

Cada sistema tem sua própria documentação:

### Workshops
- `workshops/docs/README.md` - Visão geral
- `workshops/docs/API.md` - Documentação da API
- `workshops/docs/DEPLOY.md` - Guia de deploy
- `workshops/docs/DEVELOPMENT.md` - Guia de desenvolvimento

### Dealers
- `dealers/docs/README.md` - Visão geral
- `dealers/docs/API.md` - Documentação da API
- `dealers/docs/DEPLOY.md` - Guia de deploy
- `dealers/docs/DEVELOPMENT.md` - Guia de desenvolvimento

### Vehicle History Service
- `vehicle-history-service/docs/README.md` - Visão geral
- `vehicle-history-service/docs/API.md` - Documentação da API
- `vehicle-history-service/docs/INTEGRATION.md` - Guia de integração

---

## 🚀 Próximos Passos

1. ✅ Estrutura de pastas criada
2. ⏭️ Criar Vehicle History Service (base)
3. ⏭️ Criar Backend Workshops
4. ⏭️ Criar Frontend Workshops
5. ⏭️ Criar Admin Workshops
6. ⏭️ Documentação de cada sistema

---

**Documento criado em:** [Data]  
**Última atualização:** [Data]  
**Versão:** 2.0
