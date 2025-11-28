# Mecânica365 - Backend API

**Versão:** 1.0  
**Status:** Em desenvolvimento

---

## 🎯 Descrição

Backend API do sistema Mecânica365 - ERP para oficinas mecânicas.

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 20+ LTS
- PostgreSQL 16+
- Redis 7+
- npm ou yarn

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Configurar Prisma
npx prisma generate
npx prisma migrate dev

# Rodar seeds (dados iniciais)
npm run seed

# Iniciar desenvolvimento
npm run start:dev
```

API estará disponível em: `http://localhost:3001`

---

## 📁 Estrutura do Projeto

```
src/
├── main.ts                    # Bootstrap
├── app.module.ts             # Root module
│
├── modules/                   # Feature modules
│   ├── core/                 # Módulos core (sempre ativos)
│   │   ├── auth/
│   │   ├── tenants/
│   │   ├── users/
│   │   └── billing/
│   │
│   ├── workshops/            # Módulos específicos oficinas
│   │   ├── service-orders/
│   │   ├── appointments/
│   │   ├── parts/
│   │   ├── customers/
│   │   └── invoicing/
│   │
│   └── shared/               # Módulos compartilhados
│       └── vehicle-history/
│
├── common/                    # Código compartilhado
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── middleware/
│   └── pipes/
│
├── config/                    # Configurações
├── database/                  # Database setup (Prisma)
└── health/                    # Health checks
```

---

## 📦 Módulos

### Core
- **Auth** - Autenticação e autorização
- **Tenants** - Gerenciamento de tenants
- **Users** - Gerenciamento de usuários
- **Billing** - Assinaturas e billing

### Workshops
- **Service Orders** - ROs (Repair Orders)
- **Appointments** - Agendamentos
- **Parts** - Estoque de peças
- **Customers** - Clientes
- **Invoicing** - Faturamento

### Shared
- **Vehicle History** - Integração com Vehicle History Service

---

## 🔧 Scripts

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod

# Testes
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e

# Linting
npm run lint

# Formatação
npm run format

# Prisma
npx prisma generate
npx prisma migrate dev
npx prisma studio
```

---

## 📚 Documentação

- [API Documentation](./docs/API.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOY.md)

---

## 🔗 Integrações

- **Vehicle History Service:** `http://localhost:3002`
- **Stripe:** Pagamentos
- **Pagar.me:** Pagamentos (Brasil)
- **S3:** Storage de arquivos

---

**Documento criado em:** [Data]  
**Versão:** 1.0
