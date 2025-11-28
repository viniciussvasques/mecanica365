# Estrutura do Projeto - Backend Workshops

**Versão:** 1.0

---

## 📁 Estrutura Completa

```
workshops/backend/
├── src/
│   ├── main.ts                    # Bootstrap da aplicação
│   │
│   ├── app/                       # App Module (raiz)
│   │   ├── app.module.ts         # Root module
│   │   ├── app.controller.ts     # Controller raiz
│   │   ├── app.service.ts        # Service raiz
│   │   └── app.controller.spec.ts
│   │
│   ├── modules/                   # Feature modules
│   │   ├── core/                 # Módulos core (sempre ativos)
│   │   │   ├── auth/             # Autenticação e autorização
│   │   │   ├── tenants/           # Gerenciamento de tenants
│   │   │   ├── users/             # Gerenciamento de usuários
│   │   │   ├── billing/           # Assinaturas e billing
│   │   │   └── README.md
│   │   │
│   │   ├── workshops/             # Módulos específicos oficinas
│   │   │   ├── service-orders/    # ROs (Repair Orders)
│   │   │   ├── appointments/      # Agendamentos
│   │   │   ├── parts/             # Estoque de peças
│   │   │   ├── customers/         # Clientes
│   │   │   ├── invoicing/          # Faturamento
│   │   │   └── README.md
│   │   │
│   │   └── shared/               # Módulos compartilhados
│   │       ├── vehicle-history/   # Integração Vehicle History
│   │       └── README.md
│   │
│   ├── common/                    # Código compartilhado
│   │   ├── decorators/            # Decorators customizados
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Auth guards, feature flags
│   │   ├── interceptors/          # Interceptors (logging, transform)
│   │   ├── middleware/            # Middleware (tenant resolver)
│   │   ├── pipes/                 # Validation pipes
│   │   └── README.md
│   │
│   ├── config/                    # Configurações
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── app.config.ts
│   │   └── README.md
│   │
│   ├── database/                  # Database setup
│   │   ├── prisma.service.ts
│   │   ├── prisma.module.ts
│   │   └── README.md
│   │
│   └── health/                    # Health checks
│       ├── health.module.ts
│       └── README.md
│
├── prisma/
│   ├── schema.prisma              # Schema do Prisma
│   └── migrations/                # Migrations
│
├── test/                          # Testes
│   ├── e2e/                       # Testes E2E
│   └── unit/                      # Testes unitários
│
├── .env.example                   # Exemplo de variáveis de ambiente
├── .gitignore
├── package.json
├── tsconfig.json
├── nest-cli.json
├── README.md
└── ESTRUTURA.md                   # Este arquivo
```

---

## 📦 Organização por Módulo

Cada módulo segue a estrutura:

```
module-name/
├── module-name.module.ts          # Module definition
├── module-name.controller.ts      # Controller (endpoints)
├── module-name.service.ts          # Service (lógica de negócio)
├── module-name.repository.ts      # Repository (acesso a dados)
├── dto/                           # Data Transfer Objects
│   ├── create-module-name.dto.ts
│   └── update-module-name.dto.ts
├── entities/                      # Entities (Prisma types)
│   └── module-name.entity.ts
└── module-name.controller.spec.ts  # Testes
```

---

## 🎯 Próximos Passos

1. ✅ Estrutura de pastas criada e organizada
2. ⏭️ Configurar Prisma
3. ⏭️ Implementar módulos Core
4. ⏭️ Implementar Service Orders
5. ⏭️ Criar seeds

---

**Documento criado em:** [Data]  
**Versão:** 1.0
