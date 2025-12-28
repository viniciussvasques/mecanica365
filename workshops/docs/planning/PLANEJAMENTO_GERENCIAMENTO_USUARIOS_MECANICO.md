# 📋 PLANEJAMENTO: Gerenciamento de Usuários e Tela do Mecânico

**Data:** Dezembro 2024  
**Status:** Planejamento Completo  
**Prioridade:** Alta

---

## 🎯 OBJETIVO

Implementar sistema completo de gerenciamento de usuários e criar interface específica para mecânicos, permitindo que:

1. **Admin/Manager** possam criar e gerenciar usuários (incluindo mecânicos)
2. **Mecânicos** tenham uma tela dedicada onde recebem notificações de orçamentos atribuídos
3. **Mecânicos** possam fazer diagnóstico de orçamentos atribuídos a eles
4. **Sistema** notifique mecânicos quando orçamentos são atribuídos

---

## 📊 ANÁLISE DO ESTADO ATUAL

### ✅ O que JÁ EXISTE (Backend)

#### 1. **Módulo de Usuários (Core)**
- ✅ CRUD completo de usuários (`/api/users`)
- ✅ Roles definidas: `admin`, `manager`, `technician`, `receptionist`, `accountant`
- ✅ Validação de email único por tenant
- ✅ Hash de senha com bcrypt
- ✅ Ativação/desativação de usuários
- ✅ Endpoints protegidos com roles guard

**Endpoints existentes:**
- `POST /api/users` - Criar usuário (admin, manager)
- `GET /api/users` - Listar usuários (admin, manager, receptionist)
- `GET /api/users/:id` - Buscar usuário (admin, manager, receptionist)
- `PATCH /api/users/:id` - Atualizar usuário (admin, manager)
- `DELETE /api/users/:id` - Remover usuário (admin)

**Problema identificado:**
- Role no DTO é `TECHNICIAN`, mas no código de quotes usa `mechanic`
- **Solução:** Padronizar para `mechanic` em todo o sistema

#### 2. **Módulo de Orçamentos (Quotes)**
- ✅ Sistema de atribuição de mecânicos (`assignMechanic`)
- ✅ Histórico de atribuições (`QuoteAssignmentHistory`)
- ✅ Status `AWAITING_DIAGNOSIS` quando atribuído
- ✅ Endpoint `POST /api/quotes/:id/assign-mechanic`
- ✅ Endpoint `POST /api/quotes/:id/complete-diagnosis`
- ✅ Validação de permissões (mecânico só pode ver seus próprios orçamentos)

**Fluxo atual:**
1. Orçamento criado com status `DRAFT`
2. Admin/Manager atribui mecânico → status muda para `AWAITING_DIAGNOSIS`
3. Mecânico completa diagnóstico → status muda para `DIAGNOSED`
4. Admin/Manager aprova → cria Service Order

#### 3. **Sistema de Notificações**
- ✅ `NotificationsService` implementado
- ✅ Tipo `QUOTE_ASSIGNED` para notificar mecânicos
- ✅ Método `notifyAllMechanics()` para notificar todos
- ✅ Método `findByUser()` para buscar notificações
- ✅ Marcar como lida (`markAsRead`, `markAllAsRead`)

**Notificações disponíveis:**
- `QUOTE_ASSIGNED` - Orçamento atribuído ao mecânico
- `QUOTE_AVAILABLE` - Orçamento disponível para pegar
- `QUOTE_DIAGNOSIS_COMPLETED` - Diagnóstico concluído
- `QUOTE_APPROVED` - Orçamento aprovado
- `SERVICE_ORDER_STARTED` - OS iniciada
- `SERVICE_ORDER_COMPLETED` - OS finalizada

### ⏳ O que FALTA (Frontend)

#### 1. **Gerenciamento de Usuários**
- ❌ Página de listagem de usuários (`/users`)
- ❌ Página de criação de usuário (`/users/new`)
- ❌ Página de edição de usuário (`/users/[id]/edit`)
- ❌ Página de visualização de usuário (`/users/[id]`)
- ❌ API client para usuários (`lib/api/users.ts`)
- ❌ Componentes de formulário (CreateUserForm, UpdateUserForm)
- ❌ Validação de roles e permissões

#### 2. **Tela do Mecânico**
- ❌ Dashboard específico para mecânicos (`/mechanic/dashboard`)
- ❌ Lista de orçamentos atribuídos ao mecânico (`/mechanic/quotes`)
- ❌ Notificações em tempo real
- ❌ Badge de notificações não lidas
- ❌ Integração com sistema de notificações existente
- ❌ Filtros por status (aguardando diagnóstico, diagnosticado, etc.)

#### 3. **Integração com Orçamentos**
- ⚠️ Página `/quotes/pending-diagnosis` existe mas não filtra por mecânico
- ❌ Botão "Pegar para mim" para mecânicos pegarem orçamentos disponíveis
- ❌ Visualização diferenciada para mecânicos (só vê seus orçamentos)
- ❌ Botão de atribuição de mecânico na tela de detalhes do orçamento

#### 4. **Sistema de Notificações (Frontend)**
- ⚠️ `NotificationProvider` existe mas não está integrado com backend
- ❌ API client para notificações (`lib/api/notifications.ts`)
- ❌ Componente de lista de notificações
- ❌ Badge de contador de não lidas
- ❌ Polling ou WebSocket para atualização em tempo real

---

## 🏗️ ARQUITETURA DA SOLUÇÃO

### 1. ESTRUTURA DE PASTAS (Frontend)

```
workshops/frontend/
├── app/
│   ├── users/                    # NOVO: Gerenciamento de usuários
│   │   ├── page.tsx              # Lista de usuários
│   │   ├── new/
│   │   │   └── page.tsx          # Criar usuário
│   │   └── [id]/
│   │       ├── page.tsx          # Visualizar usuário
│   │       └── edit/
│   │           └── page.tsx      # Editar usuário
│   │
│   ├── mechanic/                 # NOVO: Área do mecânico
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Dashboard do mecânico
│   │   ├── quotes/
│   │   │   └── page.tsx          # Orçamentos do mecânico
│   │   └── notifications/
│   │       └── page.tsx          # Notificações do mecânico
│   │
│   └── quotes/
│       ├── [id]/
│       │   └── assign/
│       │       └── page.tsx      # NOVO: Atribuir mecânico
│       └── ... (já existe)
│
├── lib/
│   └── api/
│       ├── users.ts              # NOVO: API client de usuários
│       └── notifications.ts      # NOVO: API client de notificações
│
└── components/
    ├── users/                    # NOVO: Componentes de usuários
    │   ├── UserList.tsx
    │   ├── UserForm.tsx
    │   ├── UserCard.tsx
    │   └── RoleBadge.tsx
    │
    ├── mechanic/                 # NOVO: Componentes do mecânico
    │   ├── MechanicDashboard.tsx
    │   ├── AssignedQuotesList.tsx
    │   └── QuoteCard.tsx
    │
    └── notifications/            # NOVO: Componentes de notificações
        ├── NotificationList.tsx
        ├── NotificationItem.tsx
        └── NotificationBadge.tsx
```

### 2. FLUXO DE ATRIBUIÇÃO DE ORÇAMENTO

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN/MANAGER cria orçamento                            │
│    Status: DRAFT                                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ADMIN/MANAGER atribui mecânico                          │
│    POST /api/quotes/:id/assign-mechanic                     │
│    Status: DRAFT → AWAITING_DIAGNOSIS                       │
│    Notificação: QUOTE_ASSIGNED enviada ao mecânico          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MECÂNICO recebe notificação                              │
│    - Badge de notificação aparece                           │
│    - Orçamento aparece em /mechanic/quotes                 │
│    - Status: AWAITING_DIAGNOSIS                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. MECÂNICO clica em "Fazer Diagnóstico"                   │
│    - Vai para /quotes/:id/diagnose                          │
│    - Preenche diagnóstico                                    │
│    - POST /api/quotes/:id/complete-diagnosis               │
│    - Status: AWAITING_DIAGNOSIS → DIAGNOSED                │
│    - Notificação: QUOTE_DIAGNOSIS_COMPLETED                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ADMIN/MANAGER aprova orçamento                           │
│    POST /api/quotes/:id/approve                             │
│    Status: DIAGNOSED → ACCEPTED                             │
│    Service Order criada automaticamente                     │
└─────────────────────────────────────────────────────────────┘
```

### 3. PERMISSÕES POR ROLE

| Ação | Admin | Manager | Receptionist | Mechanic |
|------|-------|---------|--------------|----------|
| **Usuários** |
| Criar usuário | ✅ | ✅ | ❌ | ❌ |
| Editar usuário | ✅ | ✅ | ❌ | ❌ |
| Listar usuários | ✅ | ✅ | ✅ | ❌ |
| Remover usuário | ✅ | ❌ | ❌ | ❌ |
| **Orçamentos** |
| Criar orçamento | ✅ | ✅ | ✅ | ✅ |
| Atribuir mecânico | ✅ | ✅ | ✅ | ❌ |
| Ver todos orçamentos | ✅ | ✅ | ✅ | ❌ |
| Ver meus orçamentos | ✅ | ✅ | ✅ | ✅ |
| Fazer diagnóstico | ✅ | ✅ | ❌ | ✅ |
| Aprovar orçamento | ✅ | ✅ | ✅ | ❌ |
| **Notificações** |
| Ver notificações | ✅ | ✅ | ✅ | ✅ |
| Marcar como lida | ✅ | ✅ | ✅ | ✅ |

---

## 📝 DETALHAMENTO DAS IMPLEMENTAÇÕES

### FASE 1: Correções no Backend

#### 1.1 Padronizar Role "mechanic"

**Problema:** DTO usa `TECHNICIAN`, mas código usa `mechanic`

**Solução:**
```typescript
// workshops/backend/src/modules/core/users/dto/create-user.dto.ts
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MECHANIC = 'mechanic',        // Mudar de TECHNICIAN para MECHANIC
  RECEPTIONIST = 'receptionist',
  ACCOUNTANT = 'accountant',
}
```

**Arquivos a alterar:**
- `dto/create-user.dto.ts`
- `dto/update-user.dto.ts`
- `dto/user-response.dto.ts`
- Atualizar testes

#### 1.2 Endpoint para buscar mecânicos

**Novo endpoint:**
```typescript
GET /api/users?role=mechanic&isActive=true
```

**Uso:** Para popular dropdown de seleção de mecânico na tela de atribuição

#### 1.3 Endpoint de notificações

**Endpoints necessários:**
```typescript
GET /api/notifications                    # Listar notificações do usuário
GET /api/notifications/unread-count     # Contador de não lidas
POST /api/notifications/:id/read        # Marcar como lida
POST /api/notifications/read-all        # Marcar todas como lidas
```

**Status:** Já existe `NotificationsService`, falta criar controller

---

### FASE 2: API Clients (Frontend)

#### 2.1 API Client de Usuários

**Arquivo:** `workshops/frontend/lib/api/users.ts`

```typescript
export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'mechanic' | 'receptionist' | 'accountant';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;
  role: User['role'];
  isActive?: boolean;
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  password?: string;
  role?: User['role'];
  isActive?: boolean;
}

export const usersApi = {
  findAll: (params?: { role?: string; isActive?: boolean }) => {
    // GET /api/users
  },
  findOne: (id: string) => {
    // GET /api/users/:id
  },
  create: (data: CreateUserDto) => {
    // POST /api/users
  },
  update: (id: string, data: UpdateUserDto) => {
    // PATCH /api/users/:id
  },
  remove: (id: string) => {
    // DELETE /api/users/:id
  },
};
```

#### 2.2 API Client de Notificações

**Arquivo:** `workshops/frontend/lib/api/notifications.ts`

```typescript
export interface Notification {
  id: string;
  tenantId: string;
  userId: string | null;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export const notificationsApi = {
  findAll: (params?: { unreadOnly?: boolean; limit?: number }) => {
    // GET /api/notifications
  },
  getUnreadCount: () => {
    // GET /api/notifications/unread-count
  },
  markAsRead: (id: string) => {
    // POST /api/notifications/:id/read
  },
  markAllAsRead: () => {
    // POST /api/notifications/read-all
  },
};
```

---

### FASE 3: Gerenciamento de Usuários (Frontend)

#### 3.1 Página de Listagem (`/users`)

**Funcionalidades:**
- Tabela com todos os usuários do tenant
- Filtros: por role, por status (ativo/inativo)
- Busca por nome ou email
- Ações: Ver, Editar, Ativar/Desativar, Remover
- Badge de role colorido
- Indicador de status (ativo/inativo)

**Componentes:**
- `UserList.tsx` - Componente principal
- `UserCard.tsx` - Card de usuário (alternativa à tabela)
- `RoleBadge.tsx` - Badge colorido por role
- `UserFilters.tsx` - Filtros e busca

**Permissões:**
- Acesso: `admin`, `manager`, `receptionist`
- Ações de edição/remoção: apenas `admin`, `manager`

#### 3.2 Página de Criação (`/users/new`)

**Funcionalidades:**
- Formulário completo de criação
- Validação de email único
- Seleção de role (dropdown)
- Geração de senha temporária (opcional)
- Preview de permissões por role

**Componentes:**
- `UserForm.tsx` - Formulário reutilizável
- `RoleSelector.tsx` - Seletor de role com descrição
- `PasswordGenerator.tsx` - Gerador de senha (opcional)

**Validações:**
- Email válido e único no tenant
- Nome mínimo 3 caracteres
- Senha mínimo 8 caracteres
- Role obrigatória

#### 3.3 Página de Edição (`/users/[id]/edit`)

**Funcionalidades:**
- Formulário pré-preenchido
- Edição de todos os campos (exceto email, se já usado em login)
- Troca de senha (opcional)
- Ativação/desativação
- Histórico de alterações (futuro)

**Componentes:**
- `UserForm.tsx` - Mesmo componente, modo edição
- `ChangePasswordModal.tsx` - Modal para trocar senha

#### 3.4 Página de Visualização (`/users/[id]`)

**Funcionalidades:**
- Informações completas do usuário
- Estatísticas (quantos orçamentos atribuídos, etc.)
- Histórico de atividades (futuro)
- Ações rápidas (Editar, Ativar/Desativar)

**Componentes:**
- `UserDetails.tsx` - Componente principal
- `UserStats.tsx` - Estatísticas do usuário
- `UserActivity.tsx` - Histórico de atividades (futuro)

---

### FASE 4: Tela do Mecânico (Frontend)

#### 4.1 Dashboard do Mecânico (`/mechanic/dashboard`)

**Funcionalidades:**
- Cards com estatísticas:
  - Orçamentos aguardando diagnóstico
  - Orçamentos diagnosticados hoje
  - Orçamentos em andamento
  - Notificações não lidas
- Lista rápida de orçamentos recentes
- Gráfico de produtividade (futuro)

**Componentes:**
- `MechanicDashboard.tsx` - Componente principal
- `StatsCard.tsx` - Card de estatística
- `RecentQuotes.tsx` - Lista de orçamentos recentes

**Permissões:**
- Acesso: apenas `mechanic`
- Redirecionar outros roles para `/dashboard`

#### 4.2 Lista de Orçamentos do Mecânico (`/mechanic/quotes`)

**Funcionalidades:**
- Lista de orçamentos atribuídos ao mecânico logado
- Filtros: por status (aguardando, diagnosticado, etc.)
- Busca por número, cliente, veículo
- Ações: Ver detalhes, Fazer diagnóstico
- Badge de urgência (se próximo do vencimento)
- Indicador visual de status

**Componentes:**
- `AssignedQuotesList.tsx` - Componente principal
- `QuoteCard.tsx` - Card de orçamento
- `QuoteStatusBadge.tsx` - Badge de status
- `QuoteFilters.tsx` - Filtros

**Integração:**
- Usar endpoint existente: `GET /api/quotes?assignedMechanicId={userId}`

#### 4.3 Página de Notificações (`/mechanic/notifications`)

**Funcionalidades:**
- Lista de todas as notificações do mecânico
- Filtro: todas / não lidas
- Marcar como lida (individual ou todas)
- Link direto para o orçamento relacionado
- Badge de contador de não lidas

**Componentes:**
- `NotificationList.tsx` - Componente principal
- `NotificationItem.tsx` - Item de notificação
- `NotificationBadge.tsx` - Badge de contador

---

### FASE 5: Integrações e Melhorias

#### 5.1 Integração de Notificações em Tempo Real

**Opções:**
1. **Polling** (mais simples)
   - Poll a cada 30 segundos
   - Atualizar badge e lista

2. **WebSocket** (melhor UX)
   - Conexão persistente
   - Notificações instantâneas
   - Implementação futura

**Implementação inicial:** Polling

**Componente:**
- `NotificationProvider.tsx` - Já existe, precisa integrar com API

#### 5.2 Melhorias na Página de Orçamentos

**Adicionar:**
- Botão "Atribuir Mecânico" na página de detalhes (`/quotes/[id]`)
- Modal de seleção de mecânico
- Lista de mecânicos disponíveis
- Botão "Pegar para mim" para mecânicos (auto-atribuição)

**Componentes:**
- `AssignMechanicModal.tsx` - Modal de atribuição
- `MechanicSelector.tsx` - Seletor de mecânico

#### 5.3 Sidebar com Notificações

**Melhorias:**
- Badge de notificações não lidas no menu
- Link para `/mechanic/notifications`
- Indicador visual quando há novas notificações

**Arquivo:**
- `components/Sidebar.tsx` - Adicionar badge e link

#### 5.4 Proteção de Rotas por Role

**Implementar:**
- Middleware para verificar role do usuário
- Redirecionar mecânicos para `/mechanic/dashboard`
- Bloquear acesso a rotas não permitidas

**Arquivo:**
- `middleware.ts` (Next.js middleware)

---

## 🔄 FLUXO COMPLETO DE USO

### Cenário 1: Admin cria mecânico e atribui orçamento

```
1. Admin acessa /users
2. Clica em "Novo Usuário"
3. Preenche formulário:
   - Nome: "João Mecânico"
   - Email: "joao@oficina.com"
   - Senha: "Senha123"
   - Role: "Mecânico"
4. Salva → Usuário criado
5. Admin acessa /quotes
6. Seleciona um orçamento
7. Clica em "Atribuir Mecânico"
8. Seleciona "João Mecânico"
9. Salva → Orçamento atribuído
10. Sistema envia notificação para João
```

### Cenário 2: Mecânico recebe e faz diagnóstico

```
1. João (mecânico) faz login
2. É redirecionado para /mechanic/dashboard
3. Vê badge de notificação (1 não lida)
4. Clica em notificação → Vai para /mechanic/quotes
5. Vê orçamento atribuído a ele
6. Clica em "Fazer Diagnóstico"
7. Vai para /quotes/:id/diagnose
8. Preenche diagnóstico:
   - Problema identificado
   - Categoria
   - Notas
   - Recomendações
9. Salva → Diagnóstico concluído
10. Status muda para DIAGNOSED
11. Admin recebe notificação de diagnóstico concluído
```

### Cenário 3: Mecânico pega orçamento disponível

```
1. Admin cria orçamento (status: DRAFT)
2. Admin envia para diagnóstico (status: AWAITING_DIAGNOSIS)
3. Sistema notifica TODOS os mecânicos (QUOTE_AVAILABLE)
4. João vê notificação
5. Clica em "Pegar para mim"
6. Sistema atribui automaticamente a João
7. Status continua AWAITING_DIAGNOSIS
8. João pode fazer diagnóstico
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Backend

- [ ] **Fase 1.1:** Padronizar role `mechanic` em todos os DTOs
- [ ] **Fase 1.2:** Adicionar filtro `role` no endpoint `GET /api/users`
- [ ] **Fase 1.3:** Criar `NotificationsController` com endpoints:
  - [ ] `GET /api/notifications`
  - [ ] `GET /api/notifications/unread-count`
  - [ ] `POST /api/notifications/:id/read`
  - [ ] `POST /api/notifications/read-all`
- [ ] Atualizar testes unitários
- [ ] Atualizar testes E2E

### Frontend - API Clients

- [ ] **Fase 2.1:** Criar `lib/api/users.ts`
- [ ] **Fase 2.2:** Criar `lib/api/notifications.ts`

### Frontend - Gerenciamento de Usuários

- [ ] **Fase 3.1:** Criar `/users` (listagem)
  - [ ] Componente `UserList.tsx`
  - [ ] Componente `UserCard.tsx`
  - [ ] Componente `RoleBadge.tsx`
  - [ ] Componente `UserFilters.tsx`
- [ ] **Fase 3.2:** Criar `/users/new` (criação)
  - [ ] Componente `UserForm.tsx`
  - [ ] Componente `RoleSelector.tsx`
- [ ] **Fase 3.3:** Criar `/users/[id]/edit` (edição)
  - [ ] Reutilizar `UserForm.tsx` em modo edição
  - [ ] Componente `ChangePasswordModal.tsx`
- [ ] **Fase 3.4:** Criar `/users/[id]` (visualização)
  - [ ] Componente `UserDetails.tsx`
  - [ ] Componente `UserStats.tsx`

### Frontend - Tela do Mecânico

- [ ] **Fase 4.1:** Criar `/mechanic/dashboard`
  - [ ] Componente `MechanicDashboard.tsx`
  - [ ] Componente `StatsCard.tsx`
  - [ ] Componente `RecentQuotes.tsx`
- [ ] **Fase 4.2:** Criar `/mechanic/quotes`
  - [ ] Componente `AssignedQuotesList.tsx`
  - [ ] Componente `QuoteCard.tsx`
  - [ ] Componente `QuoteStatusBadge.tsx`
- [ ] **Fase 4.3:** Criar `/mechanic/notifications`
  - [ ] Componente `NotificationList.tsx`
  - [ ] Componente `NotificationItem.tsx`
  - [ ] Componente `NotificationBadge.tsx`

### Frontend - Integrações

- [ ] **Fase 5.1:** Integrar `NotificationProvider` com API
  - [ ] Polling de notificações (30s)
  - [ ] Atualizar badge em tempo real
- [ ] **Fase 5.2:** Melhorar página de orçamentos
  - [ ] Adicionar botão "Atribuir Mecânico"
  - [ ] Criar `AssignMechanicModal.tsx`
  - [ ] Adicionar botão "Pegar para mim" (mecânicos)
- [ ] **Fase 5.3:** Melhorar Sidebar
  - [ ] Adicionar badge de notificações
  - [ ] Adicionar link para notificações
- [ ] **Fase 5.4:** Proteção de rotas
  - [ ] Criar middleware de role
  - [ ] Redirecionar mecânicos para `/mechanic/dashboard`

### Testes

- [ ] Testes E2E de criação de usuário
- [ ] Testes E2E de atribuição de orçamento
- [ ] Testes E2E de diagnóstico pelo mecânico
- [ ] Testes de notificações

### Documentação

- [ ] Atualizar README do módulo de usuários
- [ ] Documentar endpoints de notificações
- [ ] Criar guia de uso para mecânicos

---

## 🎨 DESIGN E UX

### Cores por Role

- **Admin:** `#FF4E3D` (vermelho)
- **Manager:** `#3ABFF8` (azul)
- **Mechanic:** `#00E0B8` (verde)
- **Receptionist:** `#FFCB2B` (amarelo)
- **Accountant:** `#9B59B6` (roxo)

### Componentes Reutilizáveis

- **Badge de Role:** Componente padrão com cor por role
- **Card de Usuário:** Layout consistente
- **Formulário:** Validação e feedback visual
- **Lista de Notificações:** Design limpo e funcional

### Responsividade

- Mobile-first
- Tabelas responsivas (scroll horizontal em mobile)
- Cards em grid responsivo
- Menu adaptável

---

## 🚀 PRIORIZAÇÃO

### Alta Prioridade (Fazer Primeiro)

1. ✅ Padronizar role `mechanic` no backend
2. ✅ Criar `NotificationsController`
3. ✅ Criar API clients (users, notifications)
4. ✅ Criar página de listagem de usuários (`/users`)
5. ✅ Criar página de criação de usuário (`/users/new`)
6. ✅ Criar dashboard do mecânico (`/mechanic/dashboard`)
7. ✅ Integrar notificações no frontend

### Média Prioridade

8. ✅ Criar página de edição de usuário
9. ✅ Criar lista de orçamentos do mecânico
10. ✅ Adicionar botão de atribuição na página de orçamentos
11. ✅ Melhorar Sidebar com notificações

### Baixa Prioridade (Futuro)

12. ⏳ WebSocket para notificações em tempo real
13. ⏳ Estatísticas avançadas do mecânico
14. ⏳ Histórico de atividades do usuário
15. ⏳ Gráficos de produtividade

---

## 📊 ESTIMATIVA DE TEMPO

### Backend
- Correções e novos endpoints: **4-6 horas**

### Frontend - API Clients
- Users API: **1 hora**
- Notifications API: **1 hora**

### Frontend - Páginas
- Listagem de usuários: **3-4 horas**
- Criação de usuário: **2-3 horas**
- Edição de usuário: **2-3 horas**
- Dashboard do mecânico: **3-4 horas**
- Lista de orçamentos do mecânico: **2-3 horas**
- Página de notificações: **2-3 horas**

### Frontend - Integrações
- Notificações em tempo real: **2-3 horas**
- Melhorias em orçamentos: **2-3 horas**
- Proteção de rotas: **1-2 horas**

### Testes e Documentação
- Testes E2E: **4-6 horas**
- Documentação: **2-3 horas**

**TOTAL ESTIMADO: 30-45 horas**

---

## ✅ CONCLUSÃO

Este planejamento cobre:

1. ✅ **Gerenciamento completo de usuários** (CRUD)
2. ✅ **Tela dedicada para mecânicos** (dashboard, orçamentos, notificações)
3. ✅ **Sistema de notificações integrado**
4. ✅ **Fluxo completo de atribuição e diagnóstico**
5. ✅ **Proteção de rotas por role**
6. ✅ **UX consistente e responsiva**

**Próximo passo:** Revisar este planejamento e começar implementação pela Fase 1 (Backend).

---

**Documento criado em:** Dezembro 2024  
**Versão:** 1.0  
**Status:** ✅ Planejamento Completo - Pronto para Implementação

