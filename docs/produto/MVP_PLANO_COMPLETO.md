# MVP ERP Concessionárias - Plano Completo de Desenvolvimento

**Versão:** 1.0  
**Data:** 2024  
**Status:** Planejamento Inicial

---

## 📋 Índice

1. [Visão Geral do MVP](#visão-geral-do-mvp)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Modelo Multi-Tenant e Multi-Loja](#modelo-multi-tenant-e-multi-loja)
4. [Módulos e Workflows Detalhados](#módulos-e-workflows-detalhados)
5. [Banco de Dados](#banco-de-dados)
6. [APIs e Integrações](#apis-e-integrações)
7. [Interface do Usuário (Telas)](#interface-do-usuário-telas)
8. [User Stories e Critérios de Aceitação](#user-stories-e-critérios-de-aceitação)
9. [Qualidade, Segurança e Compliance](#qualidade-segurança-e-compliance)
10. [Testes e QA](#testes-e-qa)
11. [Deploy e CI/CD](#deploy-e-cicd)
12. [Migração de Dados](#migração-de-dados)
13. [Operação e Suporte](#operação-e-suporte)
14. [Monetização e Pricing](#monetização-e-pricing)
15. [Roadmap Pós-MVP](#roadmap-pós-mvp)
16. [Método de Estimativa de Tempo](#método-de-estimativa-de-tempo)

---

## 🎯 Visão Geral do MVP

### Objetivo

Permitir que concessionárias brasileiras operem de forma completa através de uma plataforma SaaS multi-tenant, incluindo:

- **Vendas** (novos e usados)
- **Pós-venda** (oficina e service)
- **Peças** (estoque e vendas)
- **CRM** (gestão de leads e pipeline)
- **Consultoria Automática de Histórico** (módulo "Innexar Vehicle History™")
- **Contabilidade** (integração com sistemas contábeis)

### Escopo do MVP

O MVP deve entregar valor suficiente para fechar pilotos com **3-10 concessionárias independentes**, incluindo:

#### Funcionalidades Core

- ✅ Inventário de veículos (cadastro/edição/publicação)
- ✅ CRM simples (captura lead → pipeline → follow-up)
- ✅ Desking básico + trade-in
- ✅ Service / RO simples (agendamento, check-in, RO, faturamento)
- ✅ Parts (estoque básico, venda, reorder mínimo)
- ✅ Contabilidade mínima para fechamento e integração export QuickBooks/contábil
- ✅ Módulo de Vehicle History integrado (consulta por placa/VIN com cache)
- ✅ Autenticação + RBAC + subdomínio por dealer + multi-filial dentro de tenant
- ✅ Dashboard de KPIs básicos
- ✅ APIs públicas para integrações essenciais
- ✅ Processo de onboarding + migração simplificada (planilha CSV)
- ✅ Billing básico (Stripe/Pagar.me) e plans (Basic / Premium / Enterprise)

### Métricas de Sucesso

- **Onboarding:** < 2 horas para primeira concessionária estar operacional
- **Performance:** < 3s tempo de resposta para 95% das requisições
- **Disponibilidade:** 99.5% uptime no MVP
- **Adoção:** 80% dos usuários ativos semanalmente após onboarding

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológico

#### Frontend
- **Framework:** Next.js 14+ (App Router)
- **UI Library:** React 18+ com TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand / React Query
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts / Chart.js

#### Backend
- **API Principal:** NestJS (TypeScript) ou FastAPI (Python)
- **ORM:** Prisma / TypeORM (NestJS) ou SQLAlchemy (FastAPI)
- **Validation:** class-validator / Pydantic
- **Documentation:** Swagger/OpenAPI

#### Serviços Especializados
- **AI/ML Service:** Python (FastAPI) - microservice isolado
  - Pricing suggestions
  - Lead scoring
  - Computer vision (análise de imagens)
  - Vehicle Health Score

#### Banco de Dados
- **OLTP:** PostgreSQL (um por tenant ou schema-per-tenant)
- **Analytics:** ClickHouse ou BigQuery
- **Cache:** Redis (sessões, rate-limiting, cache de relatórios)
- **Search:** Elasticsearch / OpenSearch (busca full-text)

#### Infraestrutura
- **Containerização:** Docker
- **Orquestração:** Kubernetes (EKS/GKE) ou Docker Swarm (inicial)
- **IaC:** Terraform
- **CI/CD:** GitHub Actions / GitLab CI
- **Storage:** S3-compatible (MinIO / AWS S3 / DigitalOcean Spaces)
- **Queue/Events:** Kafka / RabbitMQ / Redis Streams
- **Service Mesh:** (opcional) Istio / Linkerd

#### Observabilidade
- **Metrics:** Prometheus
- **Visualization:** Grafana
- **Logging:** ELK Stack / OpenSearch
- **Tracing:** Jaeger / Zipkin
- **APM:** (opcional) New Relic / Datadog

#### Autenticação e Autorização
- **Provider:** Auth0 / Keycloak (multi-org)
- **Features:** SSO, MFA, SAML, OAuth2
- **Secrets:** HashiCorp Vault

#### Billing
- **Provider:** Stripe (subscriptions + metered billing)
- **Alternativa BR:** Pagar.me (para pagamentos locais)

### Diagrama de Arquitetura (Alto Nível)

```
┌─────────────────────────────────────────────────────────────┐
│                        CDN / Cloudflare                      │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Next.js Frontend                          │
│              (SSR + Static + API Routes)                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│              API Gateway / Load Balancer                     │
└──────┬──────────────┬──────────────┬───────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│  NestJS API │ │  FastAPI   │ │  Auth0     │
│  (Core)     │ │  (AI/ML)   │ │  (Auth)    │
└──────┬──────┘ └─────┬──────┘ └─────┬──────┘
       │              │              │
┌──────▼──────────────▼──────────────▼──────┐
│         Message Queue (Kafka/RabbitMQ)     │
└──────┬─────────────────────────────────────┘
       │
┌──────▼─────────────────────────────────────┐
│  PostgreSQL (Tenant DBs)                   │
│  Redis (Cache)                             │
│  ClickHouse (Analytics)                    │
│  S3 (Storage)                              │
└────────────────────────────────────────────┘
```

### Decisões Arquiteturais

#### 1. Multi-Tenancy Strategy

**Opção Recomendada: Database-per-Tenant**
- ✅ Isolamento completo de dados
- ✅ Escalabilidade independente
- ✅ Backup/restore por tenant
- ✅ Compliance facilitado (LGPD/GDPR)
- ⚠️ Custo maior de infraestrutura
- ⚠️ Migrations mais complexas

**Alternativa: Schema-per-Tenant**
- ✅ Custo menor
- ✅ Migrations centralizadas
- ⚠️ Menor isolamento
- ⚠️ Limitações de escalabilidade

**Decisão MVP:** Database-per-tenant com provisionamento automatizado via Terraform.

#### 2. Event-Driven Architecture

- Eventos críticos: Vehicle created, Sale completed, RO closed, Lead converted
- Pub/Sub para desacoplamento de serviços
- Event sourcing para auditoria (opcional no MVP)

#### 3. API Design

- RESTful APIs para operações CRUD
- GraphQL (opcional) para queries complexas
- Webhooks para integrações externas
- Rate limiting por tenant e por usuário

---

## 🏢 Modelo Multi-Tenant e Multi-Loja

### Estrutura Hierárquica

```
Tenant (Concessionária/Grupo)
  ├── Stores (Filiais/Lojas)
  │   ├── Users (Usuários)
  │   ├── Vehicles (Inventário)
  │   ├── Service Bays
  │   └── Parts Inventory
  └── Subscription (Plano)
```

### Subdomínios

- **Padrão:** `{tenant-slug}.innexar.com`
- **Exemplo:** `grupoabc.innexar.com`
- **DNS:** Provisionamento automático via Cloudflare API
- **SSL:** Certificados automáticos (Let's Encrypt via cert-manager)

### Roles e Permissões (RBAC)

| Role | Permissões |
|------|------------|
| **Tenant Admin** | Gerenciar tenant, stores, usuários, billing, configurações globais |
| **Regional Manager** | Visualizar múltiplas stores, relatórios consolidados, aprovar descontos |
| **Store Manager** | Gerenciar store específica, inventário, equipe, relatórios da loja |
| **Sales** | Criar/edit veículos, leads, quotes, vendas |
| **Service Tech** | Criar/edit ROs, checklists, finalizar serviços |
| **Parts Clerk** | Gerenciar estoque de peças, pedidos, recebimentos |
| **Accountant** | Acessar contabilidade, exportar dados, gerar NF-e |
| **Auditor** | Apenas leitura, logs de auditoria |

### Multi-Filial

- Inventário pode ser **centralizado** (todas as stores) ou **separado** (por store)
- Transferências entre stores
- Relatórios consolidados ou por store
- Permissões por store (usuário pode ter acesso a múltiplas stores)

---

## 🔄 Módulos e Workflows Detalhados

### 1. Onboarding / Provisionamento

#### Fluxo Automatizado

**Input:**
- Formulário de cadastro com:
  - Dados da concessionária (nome, CNPJ, endereço)
  - Plano escolhido (Basic/Premium/Enterprise)
  - Dados do admin inicial (nome, email, telefone)
  - Configurações iniciais (timezone, moeda, idioma)

**Actions Automáticas:**
1. Validar CNPJ (API ReceitaWS)
2. Criar tenant no sistema
3. Provisionar PostgreSQL database (via Terraform)
4. Rodar migrations iniciais
5. Criar bucket S3 para tenant
6. Criar subdomínio wildcard (DNS via Cloudflare API)
7. Configurar SSL (cert-manager)
8. Criar Organization no Auth0/Keycloak
9. Criar subscription no Stripe
10. Criar usuário admin inicial
11. Enviar email de boas-vindas com credenciais

**Output:**
- Email com link de acesso
- Credenciais temporárias (forçar troca no primeiro login)
- Link para onboarding wizard

**Tempo Estimado:** 5-10 minutos (provisionamento completo)

#### Onboarding Wizard (UI)

1. **Configuração Inicial**
   - Upload de logo
   - Configurar stores (filiais)
   - Definir moeda e timezone

2. **Migração de Dados (Opcional)**
   - Upload CSV (vehicles, customers, leads)
   - Mapeamento de campos
   - Preview e validação
   - Importação

3. **Integrações**
   - Configurar webhooks
   - Conectar marketplaces (opcional)
   - Configurar gateway de pagamento

4. **Treinamento**
   - Vídeos tutoriais
   - Tour guiado da plataforma

---

### 2. Inventory / Vehicle Lifecycle

#### Estados do Veículo

```
inbound → inspection → available → reserved → sold → delivered
           ↓
      rejected (retorna para inbound ou remove)
```

#### Fluxo Detalhado

**1. Entrada (Inbound)**
- Veículo é cadastrado no sistema
- Status: `inbound`
- Campos obrigatórios: VIN ou placa

**2. Inspeção/Recon (Inspection)**
- Checklist de inspeção
- Upload de fotos (mínimo 20)
- Anotação de danos/defeitos
- Custo de recon
- Status: `inspection`

**3. Publicação (Available)**
- Veículo publicado no inventário
- Preço definido
- Fotos publicadas
- Status: `available`
- Webhook para marketplaces (se configurado)

**4. Reserva (Reserved)**
- Cliente interessado (lead associado)
- Depósito recebido (opcional)
- Status: `reserved`
- Prazo de validade da reserva

**5. Venda (Sold)**
- Quote convertido em venda
- Contrato gerado
- Status: `sold`

**6. Entrega (Delivered)**
- Veículo entregue ao cliente
- Documentação finalizada
- Status: `delivered`

#### Eventos Automáticos

**Ao criar veículo:**
- Se VIN fornecido → fetch VIN decode (API externa) → auto-popula make/model/year/trim
- Se placa/VIN fornecido → dispara consulta Vehicle History (se módulo ativo)
- Gera preço sugerido via AI (se módulo ativo)

**Ao publicar:**
- Valida se tem fotos suficientes
- Valida se preço está definido
- Publica em marketplaces (webhook)

#### Telas

**Listagem de Veículos:**
- Filtros: status, make, model, year, price range, store
- Ordenação: preço, data entrada, days in inventory
- Visualização: grid ou lista
- Ações: editar, publicar, criar quote, ver histórico

**Ficha do Veículo:**
- Informações básicas (VIN, placa, make, model, year, trim, cor, km)
- Fotos (galeria)
- Documentos (CRLV, nota fiscal, etc.)
- Relatório Vehicle History (embedded)
- Preço sugerido (AI)
- Histórico de negociações
- Timeline de eventos
- Custos (compra, recon, total)

#### APIs

```typescript
POST /api/vehicles
GET /api/vehicles?status=available&make=Toyota
GET /api/vehicles/:id
PUT /api/vehicles/:id
POST /api/vehicles/:id/publish
POST /api/vehicles/:id/unpublish
POST /api/vehicles/:id/price-suggest
GET /api/vehicles/:id/history
```

---

### 3. Vehicle History (Módulo Crítico)

#### Visão Geral

Módulo "Innexar Vehicle History™" - consulta automática de histórico do veículo (equivalente ao CARFAX brasileiro).

#### Fontes de Dados

1. **APIs Parceiras** (Karfex-like)
2. **Detran** (quando legalmente permitido)
3. **Leilões** (quando disponível)
4. **Seguradoras** (parcerias)
5. **Sinistros** (quando disponível)

#### Fluxo de Consulta

```
1. Usuário solicita relatório (ao add veículo ou manual)
   ↓
2. Sistema consulta cache local (TTL configurável, padrão 30 dias)
   ↓
3. Se cache HIT → retorna relatório cached
   ↓
4. Se cache MISS:
   a. Verifica créditos do tenant (se plano pay-per-query)
   b. Consulta fontes (API parceira)
   c. Normaliza dados de diferentes fontes
   d. Gera vehicle_history (JSON estruturado)
   e. Calcula Vehicle Health Score (IA)
   f. Gera PDF Relatório Innexar
   g. Salva no cache
   h. Decrementa créditos (se aplicável)
   ↓
5. Retorna relatório completo
```

#### Estrutura de Dados

```json
{
  "vehicle_id": "uuid",
  "vin": "string",
  "placa": "string",
  "renavam": "string",
  "query_source": "partner_api",
  "query_date": "2024-01-15T10:30:00Z",
  "cached_until": "2024-02-14T10:30:00Z",
  "data": {
    "ownership_history": [...],
    "accidents": [...],
    "services": [...],
    "title_status": "clean/salvage/rebuilt",
    "odometer_readings": [...],
    "auction_history": [...],
    "insurance_claims": [...]
  },
  "health_score": 85,
  "health_score_breakdown": {
    "accidents": 20,
    "maintenance": 25,
    "ownership": 20,
    "title": 20
  },
  "red_flags": ["accident_reported", "multiple_owners"],
  "pdf_url": "https://s3.../report-123.pdf"
}
```

#### Vehicle Health Score

Algoritmo de scoring (0-100):
- **Acidentes reportados:** -20 pontos por acidente grave
- **Manutenção:** +25 pontos se histórico completo
- **Proprietários:** -5 pontos por proprietário adicional
- **Título:** -30 pontos se salvage/rebuilt
- **Odômetro:** Verificação de consistência

#### Cache Strategy

- **TTL padrão:** 30 dias
- **Invalidação:** Via webhook de parceiro (quando novo evento ocorre)
- **Storage:** Redis (cache rápido) + PostgreSQL (persistência)
- **Cache key:** `vehicle_history:{tenant_id}:{vin_or_placa}`

#### Monetização

- **Basic Plan:** Não inclui Vehicle History
- **Premium Plan:** 50 consultas/mês incluídas
- **Enterprise Plan:** Ilimitado
- **Add-on:** Créditos extras (R$ X por consulta)

#### APIs

```typescript
POST /api/vehicle-history/query
Body: { placa?: string, vin?: string, renavam?: string, vehicle_id?: uuid }
Response: { history_id, status: "pending" | "ready", estimated_time }

GET /api/vehicle-history/:id
Response: { ...vehicle_history_data }

GET /api/vehicle-history/:id/pdf
Response: PDF file download

GET /api/vehicle-history/credits
Response: { available, used, limit }
```

#### Banco de Dados

```sql
CREATE TABLE vehicle_histories (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  vehicle_id UUID,
  vin VARCHAR(17),
  placa VARCHAR(8),
  renavam VARCHAR(11),
  query_source VARCHAR(50),
  query_date TIMESTAMP,
  cached_until TIMESTAMP,
  data JSONB,
  health_score INTEGER,
  pdf_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_tenant_vin (tenant_id, vin),
  INDEX idx_tenant_placa (tenant_id, placa),
  INDEX idx_cached_until (cached_until)
);
```

---

### 4. CRM & Leads

#### Fluxo Completo

```
Captação → Dedupe → Lead Scoring → Nurturing → Desking → Sale
```

#### Captação de Leads

**Canais:**
- Site da concessionária (formulário)
- WhatsApp (integração)
- Marketplaces (OLX, Webmotors, etc.) - via webhook
- Telefone (manual)
- Walk-in (manual)
- Campanhas (import CSV)

#### Deduplicação

- Busca por email, telefone, CPF
- Merge automático de leads duplicados
- Manter histórico de interações

#### Lead Scoring (IA)

**Fatores:**
- Origem do lead (site = +10, walk-in = +20)
- Interesse (veículo específico = +15)
- Budget informado (alto = +10)
- Tempo de resposta (rápido = +5)
- Engajamento (abriu emails = +5)

**Score total:** 0-100
- **Hot (80-100):** Contato imediato
- **Warm (50-79):** Nurturing automático
- **Cold (0-49):** Lista de espera

#### Pipeline Customizável

Estágios padrão:
1. **Novo** (New)
2. **Contatado** (Contacted)
3. **Interessado** (Interested)
4. **Proposta Enviada** (Quote Sent)
5. **Negociando** (Negotiating)
6. **Fechado Ganho** (Won)
7. **Fechado Perdido** (Lost)

#### Automações

- **Email:** Sequência de nurturing (3-5 emails)
- **SMS/WhatsApp:** Lembretes, follow-ups
- **Atividades:** Tarefas automáticas para vendedores
- **Follow-up automático:** Se lead não responde em X dias

#### Telas

**Listagem de Leads:**
- Filtros: status, origem, score, vendedor, data
- Visualização: lista ou kanban board
- Ações: editar, adicionar nota, converter em quote

**Detalhe do Lead:**
- Informações do contato
- Histórico de interações
- Score e razão
- Veículos de interesse
- Atividades agendadas
- Timeline

#### APIs

```typescript
POST /api/leads
GET /api/leads?status=interested&score_min=50
GET /api/leads/:id
PUT /api/leads/:id
POST /api/leads/:id/note
POST /api/leads/:id/convert (cria quote)
POST /api/leads/import (CSV)
POST /api/leads/:id/score (recalcular)
```

---

### 5. Desking / Sales

#### Fluxo de Venda

```
1. Criar proposta (quote)
   ↓
2. Simular condições (financiamento, parcelamento)
   ↓
3. Trade-in evaluation (usa Vehicle History + price-suggest)
   ↓
4. Aprovação do cliente
   ↓
5. Gerar contrato
   ↓
6. Processar pagamento
   ↓
7. Finalizar venda
```

#### Quote Builder

**Campos:**
- Veículo (novo ou usado)
- Cliente (lead convertido ou novo)
- Preço de venda
- Desconto
- Trade-in (opcional)
  - Veículo do cliente
  - Avaliação (usa Vehicle History)
  - Valor oferecido
- Financiamento (opcional)
  - Valor financiado
  - Taxa
  - Prazo
  - Entrada
- Seguros (opcional)
- Acessórios (opcional)
- Impostos (calculados automaticamente)
- Total

#### Simulação de Condições

- Cálculo de parcelas
- Comparação de taxas (múltiplos bancos)
- Cálculo de impostos (ICMS, IPI, etc.)
- Margem de lucro

#### Trade-in Evaluation

1. Cliente informa veículo (placa/VIN)
2. Sistema consulta Vehicle History
3. AI sugere preço baseado em:
   - Histórico do veículo
   - Market value (tabela FIPE/KBB)
   - Condição visual (se fotos disponíveis)
4. Vendedor ajusta valor
5. Valor entra no quote como desconto

#### Contrato

- Geração automática de contrato (template)
- Assinatura digital (DocuSign-like ou simples)
- PDF para download

#### Pagamento

- Integração com gateways (Stripe, Pagar.me)
- PIX, boleto, cartão
- Parcelamento
- Tokenização (não armazenar cartão completo)

#### APIs

```typescript
POST /api/quotes
GET /api/quotes?status=draft
GET /api/quotes/:id
PUT /api/quotes/:id
POST /api/quotes/:id/convert (cria sale)
POST /api/quotes/:id/simulate
POST /api/quotes/:id/trade-in/evaluate
```

---

### 6. F&I (Finance & Insurance)

#### Funcionalidades MVP

- Simulação de financiamento
- Integração com parceiros de crédito (RouteOne-like no Brasil)
- Cálculo de seguros
- Propostas F&I

#### Integrações

- APIs de bancos/financeiras (quando disponível)
- Seguradoras (cotação automática)
- Calculadora de impostos

#### APIs

```typescript
POST /api/finance/simulate
POST /api/finance/apply (submete para aprovação)
GET /api/finance/status/:id
POST /api/insurance/quote
```

---

### 7. Service / Repair Order (RO)

#### Fluxo Completo

```
Agendamento → Check-in → Inspeção → Orçamento → Autorização → Execução → Finalização → Faturamento
```

#### Agendamento Online

- Cliente escolhe loja, serviço, data/hora
- Validação de disponibilidade (bays, técnicos)
- Confirmação por email/SMS
- Lembrete 24h antes

#### Check-in

- Cliente chega na loja
- Confirmação de identidade
- Verificação de veículo (fotos, km, combustível)
- Assinatura de termo

#### Inspeção

- Checklist de inspeção (móvel para técnico)
- Identificação de problemas
- Fotos de danos/defeitos
- Estimativa de tempo e custo

#### Orçamento

- Lista de serviços necessários
- Lista de peças necessárias
- Mão de obra
- Total
- Envio para aprovação do cliente

#### Autorização

- Cliente aprova orçamento (digital ou presencial)
- Pagamento antecipado (opcional)

#### Execução

- Técnico executa serviços
- Atualiza status em tempo real
- Registra horas trabalhadas
- Consome peças do estoque

#### Finalização

- Teste de qualidade
- Lavagem (opcional)
- Entrega ao cliente

#### Faturamento

- Gera nota fiscal (NF-e)
- Processa pagamento
- Envia comprovante

#### Telas

**Dashboard de Service:**
- Calendário de agendamentos
- Status dos bays (ocupado/disponível)
- ROs em andamento
- Próximos agendamentos

**RO Detail:**
- Informações do cliente e veículo
- Checklist de inspeção
- Serviços e peças
- Timeline de eventos
- Fotos
- Faturamento

#### APIs

```typescript
POST /api/service/ro
GET /api/service/ro?status=in_progress
GET /api/service/ro/:id
PUT /api/service/ro/:id
POST /api/service/ro/:id/check-in
POST /api/service/ro/:id/inspect
POST /api/service/ro/:id/authorize
POST /api/service/ro/:id/complete
POST /api/service/ro/:id/invoice
POST /api/service/appointments
```

---

### 8. Parts (Peças)

#### Funcionalidades

- **Estoque:** Controle de quantidade, localização, custo
- **Recebimento:** Entrada de mercadoria, validação de nota fiscal
- **Picking:** Separação de peças para ROs
- **Transferência:** Entre stores
- **Pedidos:** Para fornecedores
- **Integração:** Consulta preço e lead-time de fornecedores

#### Fluxo de Estoque

```
Pedido → Recebimento → Estoque → Picking → Consumo (RO) → Reorder
```

#### Reorder Point

- Mínimo configurável por peça
- Alerta automático quando abaixo do mínimo
- Sugestão de pedido (quantidade baseada em histórico)

#### APIs

```typescript
GET /api/parts?store_id=xxx
POST /api/parts
GET /api/parts/:id
PUT /api/parts/:id
POST /api/parts/receive (entrada de mercadoria)
POST /api/parts/transfer (entre stores)
POST /api/parts/order (pedido para fornecedor)
GET /api/parts/low-stock (alertas)
```

---

### 9. Accounting (Contabilidade)

#### Funcionalidades MVP

- **Chart of Accounts:** Plano de contas configurável
- **Lançamentos Automáticos:**
  - Vendas → Receita, Impostos, Custo
  - ROs → Receita de serviço, Custo de peças
  - Compras → Estoque, Fornecedores
- **Export:** CSV, OFX, QuickBooks format
- **Integração:** QuickBooks, Contmatic (quando disponível)

#### Notas Fiscais

- **NF-e / NFC-e:** Integração com provedor autorizado
- Certificado digital (A1 ou A3)
- Geração de XML
- Geração de PDF
- Envio para SEFAZ

#### APIs

```typescript
GET /api/accounting/ledger?start_date=xxx&end_date=xxx
POST /api/accounting/entries
GET /api/accounting/export?format=csv
POST /api/invoices/nfe (gerar NF-e)
GET /api/invoices/:id/xml
GET /api/invoices/:id/pdf
```

---

### 10. Dashboard & Reports

#### KPIs Principais

**Vendas:**
- Vendas no período
- Gross per vehicle
- Days in inventory
- Conversion rate (leads → sales)
- Average deal size

**Service:**
- RO hours
- Revenue per RO
- Customer satisfaction (NPS)
- Turnaround time

**Parts:**
- Parts turnover
- Gross margin
- Low stock alerts

**CRM:**
- Leads → Conversion
- Pipeline value
- Average time to close

#### Relatórios

- Customizáveis (filtros, agrupamentos)
- Export PDF/CSV
- Agendamento (email automático)
- Dashboards por role (Store Manager vê apenas sua loja)

#### APIs

```typescript
GET /api/dashboard/kpis?period=month&store_id=xxx
GET /api/reports/sales?start_date=xxx&end_date=xxx
GET /api/reports/service?start_date=xxx&end_date=xxx
POST /api/reports/custom
```

---

## 💾 Banco de Dados

### Schema Principal (Exemplo Simplificado)

#### Core Tables

```sql
-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  cnpj VARCHAR(14) UNIQUE NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL, -- basic, premium, enterprise
  status VARCHAR(50) NOT NULL, -- active, suspended, cancelled
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Stores (Filiais)
CREATE TABLE stores (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  auth0_id VARCHAR(255) UNIQUE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  store_ids UUID[], -- Array de stores que o usuário tem acesso
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID REFERENCES stores(id),
  vin VARCHAR(17),
  placa VARCHAR(8),
  renavam VARCHAR(11),
  make VARCHAR(100),
  model VARCHAR(100),
  year INTEGER,
  trim VARCHAR(100),
  color VARCHAR(50),
  mileage INTEGER,
  status VARCHAR(50) NOT NULL, -- inbound, inspection, available, reserved, sold, delivered
  price DECIMAL(10,2),
  cost DECIMAL(10,2),
  images TEXT[], -- Array de URLs S3
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_vin (vin),
  INDEX idx_placa (placa)
);

-- Vehicle Histories
CREATE TABLE vehicle_histories (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  vehicle_id UUID REFERENCES vehicles(id),
  vin VARCHAR(17),
  placa VARCHAR(8),
  renavam VARCHAR(11),
  query_source VARCHAR(50),
  query_date TIMESTAMP,
  cached_until TIMESTAMP,
  data JSONB,
  health_score INTEGER,
  pdf_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_tenant_vin (tenant_id, vin),
  INDEX idx_tenant_placa (tenant_id, placa)
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID REFERENCES stores(id),
  assigned_to UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  cpf VARCHAR(11),
  source VARCHAR(50), -- website, whatsapp, marketplace, etc.
  status VARCHAR(50) NOT NULL, -- new, contacted, interested, quote_sent, negotiating, won, lost
  score INTEGER DEFAULT 0,
  vehicle_interest UUID REFERENCES vehicles(id),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  INDEX idx_tenant_status (tenant_id, status),
  INDEX idx_score (score)
);

-- Quotes
CREATE TABLE quotes (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID REFERENCES stores(id),
  lead_id UUID REFERENCES leads(id),
  vehicle_id UUID REFERENCES vehicles(id),
  salesperson_id UUID REFERENCES users(id),
  status VARCHAR(50) NOT NULL, -- draft, sent, accepted, rejected, converted
  sale_price DECIMAL(10,2),
  discount DECIMAL(10,2),
  trade_in_value DECIMAL(10,2),
  financing_amount DECIMAL(10,2),
  total DECIMAL(10,2),
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Sales
CREATE TABLE sales (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID REFERENCES stores(id),
  quote_id UUID REFERENCES quotes(id),
  vehicle_id UUID REFERENCES vehicles(id),
  customer_id UUID, -- Referência a lead ou customer separado
  salesperson_id UUID REFERENCES users(id),
  sale_date DATE NOT NULL,
  sale_price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  gross_profit DECIMAL(10,2),
  payment_method VARCHAR(50),
  contract_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Service Orders
CREATE TABLE service_orders (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  customer_id UUID,
  vehicle_id UUID REFERENCES vehicles(id),
  technician_id UUID REFERENCES users(id),
  appointment_date TIMESTAMP,
  check_in_date TIMESTAMP,
  status VARCHAR(50) NOT NULL, -- scheduled, checked_in, inspecting, quoted, authorized, in_progress, completed, invoiced
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  labor_cost DECIMAL(10,2),
  parts_cost DECIMAL(10,2),
  total DECIMAL(10,2),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Parts
CREATE TABLE parts (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID REFERENCES stores(id),
  part_number VARCHAR(100),
  description TEXT,
  category VARCHAR(100),
  quantity INTEGER DEFAULT 0,
  min_quantity INTEGER DEFAULT 0,
  cost DECIMAL(10,2),
  price DECIMAL(10,2),
  supplier VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Inventory Movements
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID REFERENCES stores(id),
  part_id UUID REFERENCES parts(id),
  type VARCHAR(50) NOT NULL, -- receive, sale, transfer, adjustment, consumption
  quantity INTEGER NOT NULL,
  unit_cost DECIMAL(10,2),
  reference_id UUID, -- RO, sale, transfer, etc.
  notes TEXT,
  created_at TIMESTAMP
);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  store_id UUID REFERENCES stores(id),
  invoice_number VARCHAR(100) UNIQUE,
  type VARCHAR(50) NOT NULL, -- sale, service
  reference_id UUID, -- sale_id ou service_order_id
  customer_id UUID,
  total DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2),
  nfe_key VARCHAR(44), -- Chave da NF-e
  nfe_xml_url TEXT,
  nfe_pdf_url TEXT,
  status VARCHAR(50) NOT NULL, -- draft, issued, cancelled
  issued_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  stripe_subscription_id VARCHAR(255),
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL, -- active, cancelled, past_due
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  vehicle_history_credits INTEGER DEFAULT 0,
  vehicle_history_credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  changes JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP,
  INDEX idx_tenant_created (tenant_id, created_at),
  INDEX idx_user_created (user_id, created_at)
);
```

### Migrations

- Usar Prisma Migrate ou TypeORM Migrations
- Versionamento de schema
- Rollback suportado
- Migrations automáticas no provisionamento

---

## 🔌 APIs e Integrações

### Documentação

- **Swagger/OpenAPI 3.0**
- Endpoint: `/api/docs`
- Autenticação para acessar docs
- Exemplos de requests/responses

### Autenticação

```typescript
POST /api/auth/login
Body: { email, password }
Response: { access_token, refresh_token, expires_in }

POST /api/auth/refresh
Body: { refresh_token }
Response: { access_token, expires_in }

POST /api/auth/logout
Headers: { Authorization: Bearer <token> }
```

### Rate Limiting

- Por tenant: 1000 req/min
- Por usuário: 100 req/min
- Por endpoint crítico: 10 req/min (ex: vehicle-history/query)

### Webhooks

**Eventos disponíveis:**
- `vehicle.created`
- `vehicle.published`
- `lead.created`
- `lead.converted`
- `quote.created`
- `sale.completed`
- `service_order.completed`
- `invoice.issued`

**Configuração:**
- URL do webhook
- Eventos selecionados
- Secret para validação (HMAC)

### Integrações Externas

#### Marketplaces
- **OLX:** Webhook para publicar veículos
- **Webmotors:** API (quando disponível)
- **Autoline:** API (quando disponível)

#### Pagamento
- **Stripe:** Subscriptions, metered billing
- **Pagar.me:** Pagamentos locais (PIX, boleto)

#### Contabilidade
- **QuickBooks:** Export de dados
- **Contmatic:** Integração (quando disponível)

#### Detran/Veículos
- **ReceitaWS:** Validação de CNPJ
- **APIs de VIN decode:** Para popular dados do veículo
- **Parceiros Vehicle History:** APIs de consulta

---

## 🖥️ Interface do Usuário (Telas)

### Mapa de Telas Prioritárias MVP

#### Autenticação
- **Login / SSO**
  - Email/senha
  - SSO (Google, Microsoft)
  - MFA (se habilitado)

#### Admin
- **Tenant Admin Console**
  - Configurar stores
  - Gerenciar usuários
  - Billing e subscription
  - Configurações globais
  - Integrações

#### Dashboard
- **Dashboard Principal**
  - KPIs principais
  - Gráficos (vendas, service, leads)
  - Atividades recentes
  - Alertas (low stock, leads quentes)

#### Inventory
- **Listagem de Veículos**
  - Filtros e busca
  - Grid/lista
  - Ações rápidas

- **Ficha do Veículo**
  - Informações completas
  - Galeria de fotos
  - Relatório Vehicle History embedded
  - Preço sugerido (AI)
  - Timeline de eventos
  - Negociações

#### CRM
- **Listagem de Leads**
  - Filtros (status, score, origem)
  - Kanban board (opcional)
  - Ações rápidas

- **Detalhe do Lead**
  - Informações do contato
  - Histórico de interações
  - Score e razão
  - Veículos de interesse
  - Atividades

- **Pipeline Board**
  - Visualização kanban
  - Drag & drop entre estágios

#### Sales
- **Quote Builder**
  - Formulário step-by-step
  - Simulação de condições
  - Trade-in evaluation
  - Preview do contrato

- **Listagem de Quotes**
  - Filtros (status, vendedor, data)
  - Ações (editar, converter, enviar)

#### Service
- **Calendário de Agendamentos**
  - Vista mensal/semanal/diária
  - Bays e técnicos
  - Drag & drop para reagendar

- **RO Detail**
  - Informações do cliente/veículo
  - Checklist de inspeção
  - Serviços e peças
  - Timeline
  - Fotos
  - Faturamento

#### Parts
- **Estoque de Peças**
  - Listagem com filtros
  - Alertas de low stock
  - Ações (receber, transferir, pedir)

- **Pedido para Fornecedor**
  - Seleção de peças
  - Quantidades
  - Envio

#### Vehicle History
- **Viewer de Relatório**
  - Visualização completa
  - Breakdown do Health Score
  - Red flags destacados
  - Download PDF

#### Accounting
- **Ledger / Contabilidade**
  - Lançamentos
  - Filtros e busca
  - Export

- **Notas Fiscais**
  - Listagem
  - Geração NF-e
  - Download XML/PDF

#### Settings
- **Configurações**
  - Perfil
  - Notificações
  - Integrações
  - Webhooks
  - Automações

#### Onboarding
- **Wizard de Onboarding**
  - Step 1: Configuração inicial
  - Step 2: Migração de dados (CSV)
  - Step 3: Integrações
  - Step 4: Treinamento

#### Billing
- **Subscription & Billing**
  - Plano atual
  - Uso (créditos Vehicle History)
  - Histórico de pagamentos
  - Upgrade/downgrade

### Design System

- **Componentes:** shadcn/ui base
- **Cores:** Tema profissional (azul/cinza)
- **Responsividade:** Mobile-first
- **Acessibilidade:** WCAG 2.1 AA

---

## 📝 User Stories e Critérios de Aceitação

### Exemplos de User Stories

#### US-001: Criar Veículo no Inventário

**Como** Sales Manager  
**Quero** criar um veículo informando VIN/placa e fotos  
**Para que** eu possa disponibilizá-lo para venda

**Critérios de Aceitação:**
- ✅ Ao inserir VIN, sistema automaticamente popula make/model/year se encontrado
- ✅ Ao salvar, registro é persistido no DB com status `inbound`
- ✅ Se placa/VIN preenchido e tenant tiver módulo Vehicle History ativo → deve disparar consulta e anexar relatório (status `history_pending` → `history_ready`)
- ✅ Usuário vê preview do relatório e preço sugerido
- ✅ Upload de fotos (mínimo 1, máximo 50)
- ✅ Validação de VIN (formato correto)
- ✅ Validação de placa (formato brasileiro)

**Prioridade:** Alta  
**Estimativa:** 8 pontos

---

#### US-002: Consultar Vehicle History

**Como** Store Manager  
**Quero** gerar relatório por placa/VIN  
**Para que** validar histórico antes de aceitar trade-in

**Critérios de Aceitação:**
- ✅ Consulta retorna relatório JSON + PDF em até X segundos (variável da infra)
- ✅ Consulta decrementa créditos do tenant se plano é pay-per-query
- ✅ Relatório é gravado em `vehicle_histories` com `cached_until`
- ✅ Se cache HIT, retorna imediatamente sem decrementar créditos
- ✅ Health Score é calculado e exibido
- ✅ Red flags são destacados
- ✅ PDF é gerado e disponível para download

**Prioridade:** Crítica  
**Estimativa:** 13 pontos

---

#### US-003: Agendar Serviço

**Como** Cliente  
**Quero** agendar minha revisão pelo site  
**Para que** receber atendimento na oficina no horário escolhido

**Critérios de Aceitação:**
- ✅ Cliente escolhe loja, serviço, data/hora disponível
- ✅ RO é criado e aparece no calendário interno do tenant
- ✅ Email de confirmação é enviado
- ✅ Lembrete é enviado 24h antes
- ✅ Validação de disponibilidade (bay e técnico)
- ✅ Cliente pode cancelar/reagendar

**Prioridade:** Alta  
**Estimativa:** 5 pontos

---

#### US-004: Converter Lead em Quote

**Como** Sales  
**Quero** converter um lead interessado em uma proposta  
**Para que** formalizar a negociação

**Critérios de Aceitação:**
- ✅ Ao converter, quote é criado associado ao lead
- ✅ Veículo de interesse é pré-preenchido (se houver)
- ✅ Status do lead muda para `quote_sent`
- ✅ Email é enviado ao cliente com link da proposta
- ✅ Quote tem prazo de validade (configurável)

**Prioridade:** Alta  
**Estimativa:** 5 pontos

---

#### US-005: Finalizar RO e Faturar

**Como** Service Tech  
**Quero** finalizar um RO e gerar fatura  
**Para que** concluir o serviço e receber pagamento

**Critérios de Aceitação:**
- ✅ Ao finalizar, status muda para `completed`
- ✅ Fatura é gerada automaticamente
- ✅ NF-e é emitida (se configurado)
- ✅ Email é enviado ao cliente com fatura
- ✅ Peças consumidas são debitadas do estoque
- ✅ Horas trabalhadas são registradas

**Prioridade:** Alta  
**Estimativa:** 8 pontos

---

### Backlog Completo

O backlog completo terá **150+ user stories** organizadas por:
- Módulo (Inventory, CRM, Service, etc.)
- Prioridade (Crítica, Alta, Média, Baixa)
- Sprint/Milestone

**Formato de export:** CSV ou Jira import format

---

## 🔒 Qualidade, Segurança e Compliance

### Autenticação e Autorização

- **SSO:** Auth0/Keycloak com suporte a SAML, OAuth2
- **MFA:** Obrigatório para roles administrativos
- **RBAC:** Permissões granulares por role e por resource
- **Session Management:** Tokens JWT com refresh, expiração configurável

### Segurança de Dados

- **Criptografia:**
  - At-rest: AES-256 (banco de dados, S3)
  - In-transit: TLS 1.3 (todas as comunicações)
- **Secrets Management:** HashiCorp Vault
- **PCI Compliance:** Tokenização via Stripe (não armazenar cartão completo)

### Compliance

#### LGPD (Lei Geral de Proteção de Dados)

- **Consentimento:** Flows de consentimento para coleta de dados
- **DSAR (Data Subject Access Request):** Endpoint para usuário solicitar seus dados
- **Right to be Forgotten:** Funcionalidade de exclusão de dados
- **Privacy Policy:** Integrada na plataforma
- **Data Processing Agreement:** Template para clientes Enterprise

#### SOC 2

- **Políticas:** Documentação de políticas de segurança
- **Backups:** Automáticos e testados regularmente
- **Runbooks:** Procedimentos operacionais documentados
- **Incident Response:** Plano de resposta a incidentes

### Logging e Auditoria

- **Audit Logs:** Todas as ações relevantes são logadas
  - User, timestamp, IP, action, resource, changes
- **Retention:** Logs mantidos por 2 anos (configurável)
- **Access Logs:** Logs de acesso a APIs e recursos sensíveis

### Vulnerabilidades

- **SAST:** Análise estática de código (SonarQube, Snyk)
- **DAST:** Análise dinâmica (OWASP ZAP)
- **Dependency Scanning:** Verificação de dependências vulneráveis
- **Pentest:** Teste de penetração pré-launch (especialmente F&I e NF-e)

---

## 🧪 Testes e QA

### Estratégia de Testes

#### Unit Tests
- **Cobertura mínima:** 70%
- **Frameworks:**
  - Backend: Jest (NestJS) ou pytest (FastAPI)
  - Frontend: Jest + React Testing Library
- **CI:** Executados em cada PR

#### Integration Tests
- **APIs críticas:**
  - Autenticação
  - Criação de veículo
  - Consulta Vehicle History
  - Criação de quote
  - Finalização de RO
- **Frameworks:** Supertest (NestJS) ou pytest (FastAPI)

#### E2E Tests
- **Fluxos críticos:**
  - Lead → Quote → Sale
  - Agendamento → RO → Faturamento
  - Onboarding completo
- **Framework:** Playwright ou Cypress
- **CI:** Executados em staging antes de promote para production

#### Load Tests
- **Cenários:**
  - Multi-tenant (10+ tenants simultâneos)
  - Pico de consultas Vehicle History
  - Upload simultâneo de imagens
- **Ferramenta:** k6 ou Locust
- **Métricas:** Response time p95, p99, throughput

#### Security Tests
- **SAST/DAST:** Automatizados no CI
- **Pentest:** Manual pré-launch
- **Foco:** Módulos F&I e NF-e (dados sensíveis)

### QA Process

1. **Desenvolvimento:** Desenvolvedor escreve testes junto com código
2. **Code Review:** Revisor verifica testes
3. **CI:** Testes executados automaticamente
4. **Staging:** Deploy para ambiente de staging
5. **QA Manual:** Testes manuais de fluxos críticos
6. **Production:** Deploy após aprovação

---

## 🚀 Deploy e CI/CD

### CI/CD Pipeline

#### Continuous Integration (CI)

**Trigger:** Push para branch ou PR

**Steps:**
1. Lint (ESLint, Prettier)
2. Type check (TypeScript)
3. Unit tests
4. Build (frontend + backend)
5. Security scan (SAST)
6. Dependency scan

**Ferramenta:** GitHub Actions / GitLab CI

#### Continuous Deployment (CD)

**Estratégia:** Canary Deploy

**Fluxo:**
1. Deploy para staging
2. Smoke tests automatizados
3. Se passar → Deploy canary (10% do tráfego)
4. Monitor por 30 minutos
5. Se OK → Promote para 100%
6. Se problemas → Rollback automático

**Ferramentas:**
- Kubernetes (EKS/GKE)
- Helm (package management)
- ArgoCD (GitOps, opcional)

### Infrastructure as Code

**Terraform Modules:**
- Tenant provisioning (DB, bucket, DNS)
- Kubernetes cluster
- Load balancer
- Monitoring stack

**Versionamento:** Terraform state em S3 com locking (DynamoDB)

### Rollback Policy

- **Automático:** Se health checks falharem
- **Manual:** Via CLI ou dashboard
- **Estratégia:** Manter últimas 3 versões deployadas

### Ambientes

- **Development:** Local (Docker Compose)
- **Staging:** Ambiente de testes (1 tenant de teste)
- **Production:** Ambiente de produção (multi-tenant)

---

## 📦 Migração de Dados

### Processo de Migração

#### 1. Preparação

- **Templates CSV:** Fornecidos para cada tipo de dado
  - Vehicles
  - Customers
  - Leads
  - Parts Inventory
  - Service History

#### 2. Upload e Validação

- **Upload CSV:** Via interface web
- **Validação:**
  - Formato de campos
  - Dados obrigatórios
  - Duplicatas
  - Referências (ex: vehicle_id em sales)
- **Preview:** Usuário vê preview antes de importar

#### 3. Dry Run

- **Simulação:** Importação sem persistir dados
- **Relatório:** Mostra o que seria importado
- **Ajustes:** Usuário pode corrigir e re-validar

#### 4. Importação

- **Processamento:** Background job (queue)
- **Progresso:** Barra de progresso em tempo real
- **Logs:** Log de erros e sucessos
- **Relatório Final:** Resumo da importação

#### 5. Validação Pós-Importação

- **Verificação:** Usuário valida dados importados
- **Correções:** Ajustes manuais se necessário

### ETL para DMS Legados

**Serviço Premium (Enterprise):**
- Scripts customizados para DMS específicos
- Migração assistida por equipe técnica
- Validação e limpeza de dados

### APIs de Migração

```typescript
POST /api/migration/upload
Body: FormData (CSV file)
Response: { migration_id, status: "validating" }

GET /api/migration/:id/status
Response: { status, progress, errors, preview }

POST /api/migration/:id/import
Response: { job_id }

GET /api/migration/:id/result
Response: { imported, failed, errors }
```

---

## 🛠️ Operação e Suporte

### Monitoring e Observability

#### Health Dashboard

- **Tenants:** Status de cada tenant (active, suspended)
- **Jobs:** Status de background jobs
- **Queues:** Tamanho das filas
- **APIs:** Taxa de erro, latência
- **Database:** Connections, queries lentas

#### Alertas

- **Críticos:**
  - Downtime de API
  - Erro alto em Vehicle History
  - Database connection pool esgotado
- **Avisos:**
  - Alta latência
  - Queue crescendo
  - Disco quase cheio

### SLA por Plano

| Plano | Suporte | Response Time | Uptime |
|-------|---------|---------------|--------|
| Basic | Email (business hours) | 48h | 99.5% |
| Premium | Email + Chat (business hours) | 24h | 99.7% |
| Enterprise | 24/7 (email, chat, telefone) | 4h | 99.9% |

### Canais de Suporte

- **Chat in-app:** Widget de suporte
- **Email:** support@innexar.com
- **Telefone:** (apenas Enterprise)
- **Base de Conhecimento:** Documentação em PT-BR
- **Vídeos Tutoriais:** Centro de treinamento

### Centro de Treinamento

- **Vídeos:** Tutoriais por módulo
- **Documentação:** Guias passo a passo
- **Webinars:** Sessões ao vivo (mensais)
- **Certificação:** Programa de certificação para usuários avançados

---

## 💰 Monetização e Pricing

### Planos MVP

#### Basic Plan
- **Preço:** R$ X/mês por rooftop
- **Inclui:**
  - Inventário ilimitado
  - CRM básico
  - Service/RO
  - Parts (estoque básico)
  - Dashboard de KPIs
  - 1 loja
  - Suporte por email (business hours)
- **NÃO inclui:**
  - Vehicle History
  - Automações avançadas
  - API access
  - Migração assistida

#### Premium Plan
- **Preço:** R$ Y/mês por rooftop
- **Inclui:**
  - Tudo do Basic
  - Vehicle History (50 consultas/mês)
  - Automações (email, SMS, WhatsApp)
  - 3 lojas
  - Suporte por email + chat (business hours)
  - API access (rate limit)
- **Add-ons:**
  - Créditos extras Vehicle History (R$ Z por consulta)

#### Enterprise Plan
- **Preço:** Custom (sob consulta)
- **Inclui:**
  - Tudo do Premium
  - Vehicle History ilimitado
  - Multi-grupo (múltiplos tenants)
  - API access ilimitado
  - Migração assistida incluída
  - Suporte 24/7 (email, chat, telefone)
  - SLA 99.9%
  - Custom integrations
  - Dedicated account manager

### Add-ons (Todos os Planos)

- **AI Pricing:** Sugestão automática de preço (R$ X/mês)
- **Advanced BI:** Relatórios avançados e customizáveis (R$ Y/mês)
- **Marketplace Auto-Publish:** Publicação automática em marketplaces (R$ Z/mês)

### Billing

- **Stripe:** Subscriptions recorrentes
- **Pagar.me:** Pagamentos locais (PIX, boleto)
- **Metered Billing:** Para créditos Vehicle History (Premium)
- **Invoicing:** Notas fiscais automáticas

---

## 🗺️ Roadmap Pós-MVP

### Fase 2 (3-6 meses pós-MVP)

- ✅ Integrações avançadas com leilões e seguradoras
- ✅ Automação de recon (reconditioning workflows)
- ✅ Marketplaces auto-publishing (webhooks para OLX/Autoline/Carros.com)
- ✅ AI avançada (análise de imagens para dano estrutural)
- ✅ Mobile native apps para técnicos (iOS/Android)

### Fase 3 (6-12 meses)

- ✅ Finance & lending marketplace
- ✅ Integração com DMS legados (importação automática)
- ✅ Advanced analytics (ML para previsão de demanda)
- ✅ White-label (customização de marca por tenant)
- ✅ Marketplace próprio (plataforma de veículos)

### Fase 4 (12+ meses)

- ✅ Expansão internacional (outros países latino-americanos)
- ✅ Franchise management (gestão de franquias)
- ✅ B2C features (cliente final acessa portal)
- ✅ IoT integration (telemetria de veículos)

---

## ⏱️ Método de Estimativa de Tempo

### Por que não um prazo fixo?

O tempo de desenvolvimento depende de variáveis externas:
- Tamanho do time
- Experiência da equipe
- Disponibilidade (dedicação parcial vs full-time)
- Complexidade de integrações
- Requisitos regulatórios (NF-e, LGPD)
- Prioridade de escopo (o que cortar se necessário)
- Burocracia de parceiros de dados (APIs Vehicle History)
- Velocidade de aprovações internas

### Método de Estimativa

#### 1. Breakdown por Módulo

Cada módulo é quebrado em **tarefas** e estimado em **story points** (Fibonacci: 1, 2, 3, 5, 8, 13, 21).

**Exemplo: Módulo Vehicle History**

| Tarefa | Story Points | Dependências |
|--------|--------------|--------------|
| Design da API | 3 | - |
| Integração com parceiro | 8 | Design da API |
| Cache layer | 5 | Design da API |
| Health Score algorithm | 8 | - |
| Geração de PDF | 5 | Health Score |
| UI do viewer | 5 | Geração de PDF |
| Testes | 5 | Todas acima |
| **Total** | **44 pontos** | - |

#### 2. Velocidade do Time (Velocity)

**Como calcular:**
- Time faz sprint de 2 semanas
- Conta quantos pontos foram entregues
- Exemplo: Time entregou 40 pontos em 2 semanas = **20 pontos/semana**

#### 3. Estimativa Final

**Fórmula:**
```
Tempo Total (semanas) = Total de Story Points / Velocity do Time
```

**Exemplo:**
- Total do MVP: 500 story points
- Velocity: 20 pontos/semana
- **Tempo estimado: 25 semanas (~6 meses)**

#### 4. Ajustes e Buffer

**Fatores de ajuste:**
- **Complexidade técnica:** +20% se tecnologias novas
- **Integrações externas:** +30% se APIs não documentadas
- **Regulatório:** +15% se NF-e/LGPD complexos
- **Buffer geral:** +20% para imprevistos

**Fórmula ajustada:**
```
Tempo Ajustado = Tempo Base × (1 + Σ fatores de ajuste) × 1.2
```

#### 5. Priorização e MVP Mínimo

Se o tempo estimado for muito alto, **cortar escopo**:

**MVP Mínimo (Must Have):**
- Inventory básico
- CRM básico
- Vehicle History (core)
- Autenticação + RBAC
- Onboarding

**MVP Completo (Should Have):**
- Tudo acima +
- Service/RO
- Parts básico
- Desking
- Dashboard

**Nice to Have (pode cortar):**
- F&I avançado
- Accounting completo
- Integrações com marketplaces
- Mobile apps

### Planilha de Estimativa

Template Excel/Google Sheets:

| Módulo | Tarefas | Story Points | Dependências | Prioridade |
|--------|---------|--------------|--------------|------------|
| Onboarding | ... | 34 | - | Must |
| Inventory | ... | 55 | - | Must |
| Vehicle History | ... | 44 | Inventory | Must |
| CRM | ... | 40 | - | Must |
| ... | ... | ... | ... | ... |
| **Total** | - | **500** | - | - |

**Cálculos automáticos:**
- Total de pontos por prioridade
- Tempo estimado por módulo
- Tempo total do MVP
- Tempo do MVP Mínimo

### Como Usar com sua Equipe

1. **Sprint Planning:**
   - Time estima tarefas em story points
   - Prioriza baseado no backlog
   - Define o que entra no sprint

2. **Sprint Review:**
   - Conta pontos entregues
   - Atualiza velocity
   - Re-estima backlog restante

3. **Ajustes:**
   - Se velocity aumentar → prazo diminui
   - Se velocity diminuir → prazo aumenta
   - Se escopo mudar → re-estimar

### Exemplo Prático

**Cenário:**
- Time de 4 desenvolvedores full-time
- 1 designer part-time
- 1 QA part-time
- Velocity histórica: 25 pontos/semana

**MVP Completo:**
- Total: 500 pontos
- Tempo: 500 / 25 = 20 semanas
- Com buffer: 20 × 1.2 = **24 semanas (~6 meses)**

**MVP Mínimo:**
- Total: 250 pontos (cortando nice-to-have)
- Tempo: 250 / 25 = 10 semanas
- Com buffer: 10 × 1.2 = **12 semanas (~3 meses)**

---

## 📊 Resumo Executivo

### Escopo do MVP

- **10 módulos principais** (Inventory, CRM, Service, Parts, Vehicle History, etc.)
- **150+ user stories**
- **50+ APIs**
- **20+ telas principais**
- **Multi-tenant** com suporte a multi-loja
- **Integrações críticas** (Vehicle History, NF-e, billing)

### Arquitetura

- **Frontend:** Next.js + React + TypeScript
- **Backend:** NestJS ou FastAPI
- **AI Service:** Python (microservice)
- **Database:** PostgreSQL (por tenant) + Redis + ClickHouse
- **Infra:** Kubernetes + Terraform
- **Auth:** Auth0/Keycloak

### Tempo de Desenvolvimento

**Estimativa baseada em velocity do time:**
- **MVP Mínimo:** 12-16 semanas (3-4 meses)
- **MVP Completo:** 24-30 semanas (6-7 meses)

**Variáveis:**
- Tamanho do time
- Experiência
- Disponibilidade
- Complexidade de integrações

### Próximos Passos

1. **Validar escopo** com stakeholders
2. **Definir prioridades** (MVP Mínimo vs Completo)
3. **Montar equipe** e calcular velocity
4. **Re-estimar** usando método acima
5. **Criar backlog detalhado** (150+ user stories)
6. **Iniciar desenvolvimento** com YAC e Cursor

---

## 📎 Anexos

### A. Glossário

- **Tenant:** Concessionária ou grupo de concessionárias
- **Store:** Filial/loja dentro de um tenant
- **RO:** Repair Order (Ordem de Serviço)
- **VIN:** Vehicle Identification Number
- **F&I:** Finance & Insurance
- **DMS:** Dealer Management System
- **NF-e:** Nota Fiscal Eletrônica

### B. Referências

- Documentação de APIs (Swagger)
- Diagramas de arquitetura (draw.io)
- Mockups de telas (Figma)
- Modelo de dados completo (ERD)

### C. Contatos

- **Product Owner:** [Nome]
- **Tech Lead:** [Nome]
- **Design Lead:** [Nome]

---

**Documento criado em:** [Data]  
**Última atualização:** [Data]  
**Versão:** 1.0

