# Carvex Ecosystem - ERP para Mercado Automotivo

**Versão:** 1.0  
**Status:** Em desenvolvimento

---

## 🎯 Visão Geral

Carvex é um ecossistema SaaS multi-tenant com **três sistemas interligados**:

1. **Mecânica365** (mecanica365.app) - ERP para oficinas mecânicas
2. **VitrineAuto** (vitrineauto.app) - ERP para concessionárias
3. **Carvex** (carvex.app) - Plataforma de histórico de veículos (hub central)

---

## 📁 Estrutura do Projeto

```
erp-dealer/
├── workshops/                  # 🏭 Mecânica365 (Oficinas)
│   ├── backend/               # NestJS Backend
│   ├── frontend/              # Next.js Frontend
│   ├── admin/                 # Next.js Admin Panel
│   └── docs/                  # Documentação específica
│
├── dealers/                   # 🚗 VitrineAuto (Dealers)
│   ├── backend/               # NestJS Backend
│   ├── frontend/              # Next.js Frontend
│   ├── admin/                 # Next.js Admin Panel
│   └── docs/                  # Documentação específica
│
├── vehicle-history-service/   # 🔍 Carvex (Vehicle History)
│   ├── backend/               # NestJS Backend (Microserviço)
│   └── docs/                  # Documentação
│
├── shared/                    # 📦 Código Compartilhado
│   ├── types/                 # TypeScript types
│   ├── schemas/               # Schemas de validação
│   └── utils/                 # Utilitários
│
└── docs/                      # 📚 Documentação Geral
    ├── planejamento/
    ├── backlog/
    ├── arquitetura/
    ├── desenvolvimento/
    └── produto/
```

---

## 🚀 Quick Start

### Mecânica365 (Em desenvolvimento)

```bash
# Backend
cd workshops/backend
npm install
npm run dev

# Frontend
cd workshops/frontend
npm install
npm run dev
```

### VitrineAuto (Planejado)

```bash
# Backend
cd dealers/backend
npm install
npm run dev
```

### Carvex (Planejado)

```bash
# Backend
cd vehicle-history-service/backend
npm install
npm run dev
```

---

## 📚 Documentação

### Documentação Geral
- [Documentação Completa](./docs/README.md)
- [Estrutura do Projeto](./ESTRUTURA_PROJETO.md)

### Por Sistema
- [Mecânica365](./workshops/README.md) (mecanica365.app) - [Docs](./workshops/docs/)
- [VitrineAuto](./dealers/README.md) (vitrineauto.app) - [Docs](./dealers/docs/)
- [Carvex](./vehicle-history-service/README.md) (carvex.app) - [Docs](./vehicle-history-service/docs/)

---

## 🎯 Roadmap

### Fase 1: Vehicle History Service (Base)
- [ ] API de Consulta
- [ ] Cache Layer
- [ ] Health Score

### Fase 2: Sistema Workshops (Primeiro)
- [ ] Backend Core
- [ ] Service Orders
- [ ] Frontend
- [ ] Admin Panel

### Fase 3: Sistema Dealers
- [ ] Backend Core
- [ ] Inventory + CRM
- [ ] Frontend
- [ ] Admin Panel

---

## 🔧 Stack Tecnológico

### Backend
- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **ORM:** Prisma 5+
- **Database:** PostgreSQL 16+
- **Cache:** Redis 7+

### Frontend
- **Framework:** Next.js 14+
- **Language:** TypeScript 5+
- **UI:** Tailwind CSS + shadcn/ui
- **State:** Zustand + React Query

---

## 📋 Status

- ✅ Estrutura de pastas criada
- ✅ Documentação inicial
- ⏭️ Backend Workshops (próximo passo)

---

**Documento criado em:** [Data]  
**Versão:** 1.0
