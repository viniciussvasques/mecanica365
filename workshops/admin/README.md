# 🔧 Mecânica365 - Painel Administrativo

Painel de administração separado para o gerenciamento do sistema SaaS Mecânica365.

## 📋 Funcionalidades

- **Dashboard** - Visão geral do sistema (tenants, jobs, atividade)
- **Tenants** - Gerenciamento completo de oficinas (CRUD, ativar, suspender, cancelar)
- **Billing** - Planos, MRR, ARR, distribuição por plano
- **Auditoria** - Logs de atividade do sistema
- **Jobs** - Monitoramento de tarefas em background
- **Webhooks** - Configuração de webhooks para integrações
- **Integrações** - Configuração de APIs externas (RENAVAN, VIN, SMS, etc.)
- **Automações** - Regras de automação (triggers e ações)
- **Configurações** - Configurações gerais do sistema

## 🚀 Instalação

```bash
cd workshops/admin
npm install
```

## 💻 Desenvolvimento

```bash
npm run dev
```

O painel estará disponível em http://localhost:3002

## 🔐 Acesso

O painel é restrito aos administradores do sistema (Super Admin).

Credenciais de teste:
- Email: admin@mecanica365.com
- Senha: (definida no backend)

## 📁 Estrutura

```
workshops/admin/
├── app/
│   ├── (dashboard)/        # Páginas autenticadas
│   │   ├── dashboard/      # Dashboard principal
│   │   ├── tenants/        # Gerenciamento de tenants
│   │   ├── billing/        # Planos e faturamento
│   │   ├── audit/          # Logs de auditoria
│   │   ├── jobs/           # Monitoramento de jobs
│   │   ├── webhooks/       # Configuração de webhooks
│   │   ├── integrations/   # Integrações externas
│   │   ├── automations/    # Automações
│   │   └── settings/       # Configurações
│   ├── login/              # Página de login
│   └── layout.tsx          # Layout principal
├── components/
│   └── Sidebar.tsx         # Menu lateral
├── lib/
│   └── api.ts              # APIs do painel admin
└── package.json
```

## 🔗 Portas

- **Backend API**: http://localhost:3001
- **Frontend Oficinas**: http://localhost:3000
- **Painel Admin**: http://localhost:3002

## 📝 Notas

- Este painel é SEPARADO do sistema das oficinas
- Usa APIs específicas sem tenantId
- Apenas Super Admins têm acesso
- Tema visual diferente (vermelho/escuro)

