# Backlog de User Stories - MVP ERP Concessionárias

**Versão:** 1.0  
**Total de Stories:** 150+  
**Formato:** Compatível com Jira/Linear/Asana

---

## 📋 Legenda

- **Prioridade:** Crítica | Alta | Média | Baixa
- **Estimativa:** Story Points (Fibonacci: 1, 2, 3, 5, 8, 13, 21)
- **Módulo:** Inventory | CRM | Service | Parts | Vehicle History | Accounting | Admin | Billing

---

## 🚗 Módulo: Inventory (Veículos)

### US-001: Criar Veículo no Inventário
**Como** Sales Manager  
**Quero** criar um veículo informando VIN/placa e fotos  
**Para que** eu possa disponibilizá-lo para venda

**Critérios de Aceitação:**
- Ao inserir VIN, sistema automaticamente popula make/model/year se encontrado
- Ao salvar, registro é persistido no DB com status `inbound`
- Se placa/VIN preenchido e tenant tiver módulo Vehicle History ativo → deve disparar consulta
- Upload de fotos (mínimo 1, máximo 50)
- Validação de VIN (formato correto)
- Validação de placa (formato brasileiro)

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Inventory

---

### US-002: Editar Veículo
**Como** Sales Manager  
**Quero** editar informações de um veículo existente  
**Para que** atualizar dados quando necessário

**Critérios de Aceitação:**
- Edição de todos os campos (exceto VIN após criação)
- Histórico de alterações é mantido (audit log)
- Validações aplicadas na edição
- Fotos podem ser adicionadas/removidas

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Inventory

---

### US-003: Publicar Veículo
**Como** Sales Manager  
**Quero** publicar um veículo no inventário  
**Para que** ele fique disponível para venda

**Critérios de Aceitação:**
- Validação: veículo deve ter status `inspection` ou `available`
- Validação: mínimo de 5 fotos
- Validação: preço deve estar definido
- Status muda para `available`
- Webhook disparado para marketplaces (se configurado)
- Veículo aparece na listagem pública

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Inventory

---

### US-004: Listar Veículos com Filtros
**Como** Sales  
**Quero** listar veículos com filtros avançados  
**Para que** encontrar rapidamente o que procuro

**Critérios de Aceitação:**
- Filtros: status, make, model, year, price range, store, km
- Ordenação: preço, data entrada, days in inventory
- Visualização: grid ou lista
- Paginação (50 por página)
- Export CSV

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Inventory

---

### US-005: Visualizar Ficha Completa do Veículo
**Como** Sales  
**Quero** ver todas as informações de um veículo  
**Para que** ter contexto completo para venda

**Critérios de Aceitação:**
- Informações básicas (VIN, placa, make, model, year, trim, cor, km)
- Galeria de fotos (lightbox)
- Documentos (CRLV, nota fiscal, etc.)
- Relatório Vehicle History embedded
- Preço sugerido (AI)
- Histórico de negociações
- Timeline de eventos
- Custos (compra, recon, total)

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Inventory

---

### US-006: Processo de Inspeção/Recon
**Como** Service Manager  
**Quero** realizar inspeção completa do veículo  
**Para que** avaliar condição e custos de recon

**Critérios de Aceitação:**
- Checklist de inspeção (danos, defeitos, itens faltando)
- Upload de fotos durante inspeção
- Anotação de custos de recon
- Status muda para `inspection` → `available` ou `rejected`
- Histórico de inspeções mantido

**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Módulo:** Inventory

---

### US-007: Reservar Veículo
**Como** Sales  
**Quero** reservar um veículo para um cliente  
**Para que** garantir a venda

**Critérios de Aceitação:**
- Status muda para `reserved`
- Lead/cliente associado
- Depósito pode ser registrado (opcional)
- Prazo de validade da reserva (configurável)
- Notificação automática quando reserva expira

**Prioridade:** Média  
**Estimativa:** 3 pontos  
**Módulo:** Inventory

---

### US-008: Sugestão de Preço via IA
**Como** Sales Manager  
**Quero** receber sugestão de preço baseada em IA  
**Para que** precificar competitivamente

**Critérios de Aceitação:**
- Sugestão baseada em: make/model/year, km, condição, mercado
- Exibe range de preço (mínimo, sugerido, máximo)
- Justificativa da sugestão
- Pode ser ajustada manualmente

**Prioridade:** Média  
**Estimativa:** 13 pontos  
**Módulo:** Inventory

---

## 🔍 Módulo: Vehicle History

### US-009: Consultar Vehicle History por Placa/VIN
**Como** Store Manager  
**Quero** gerar relatório por placa/VIN  
**Para que** validar histórico antes de aceitar trade-in

**Critérios de Aceitação:**
- Consulta retorna relatório JSON + PDF em até X segundos
- Consulta decrementa créditos do tenant se plano é pay-per-query
- Relatório é gravado com `cached_until` (30 dias padrão)
- Se cache HIT, retorna imediatamente sem decrementar créditos
- Health Score é calculado e exibido
- Red flags são destacados
- PDF é gerado e disponível para download

**Prioridade:** Crítica  
**Estimativa:** 13 pontos  
**Módulo:** Vehicle History

---

### US-010: Visualizar Relatório Vehicle History
**Como** Sales  
**Quero** visualizar relatório completo de histórico  
**Para que** apresentar ao cliente

**Critérios de Aceitação:**
- Visualização completa do relatório
- Breakdown do Health Score (acidentes, manutenção, proprietários, título)
- Red flags destacados
- Timeline de eventos
- Download PDF
- Compartilhamento (link temporário)

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Vehicle History

---

### US-011: Consulta Automática ao Criar Veículo
**Como** Sistema  
**Quero** consultar Vehicle History automaticamente ao criar veículo  
**Para que** ter histórico disponível imediatamente

**Critérios de Aceitação:**
- Se placa/VIN fornecido e módulo ativo → dispara consulta
- Status: `history_pending` → `history_ready` ou `history_failed`
- Notificação quando relatório estiver pronto
- Relatório anexado automaticamente ao veículo

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Vehicle History

---

### US-012: Gerenciar Créditos Vehicle History
**Como** Tenant Admin  
**Quero** ver uso de créditos Vehicle History  
**Para que** controlar custos

**Critérios de Aceitação:**
- Dashboard mostra: disponível, usado, limite
- Histórico de consultas
- Alertas quando créditos baixos
- Comprar créditos extras (add-on)

**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Módulo:** Vehicle History

---

## 👥 Módulo: CRM & Leads

### US-013: Criar Lead
**Como** Sales  
**Quero** criar um novo lead  
**Para que** iniciar processo de venda

**Critérios de Aceitação:**
- Campos: nome, email, telefone, CPF (opcional), origem, interesse
- Deduplicação automática (busca por email/telefone)
- Lead scoring automático
- Status inicial: `new`
- Associação a vendedor (opcional)

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** CRM

---

### US-014: Listar Leads com Filtros
**Como** Sales Manager  
**Quero** listar leads com filtros  
**Para que** gerenciar pipeline

**Critérios de Aceitação:**
- Filtros: status, origem, score, vendedor, data, loja
- Visualização: lista ou kanban board
- Ordenação: score, data criação, última interação
- Paginação

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** CRM

---

### US-015: Visualizar Detalhe do Lead
**Como** Sales  
**Quero** ver todas as informações de um lead  
**Para que** ter contexto completo

**Critérios de Aceitação:**
- Informações do contato
- Histórico de interações (chamadas, emails, notas)
- Score e razão do score
- Veículos de interesse
- Atividades agendadas
- Timeline completa
- Pipeline (estágio atual)

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** CRM

---

### US-016: Adicionar Nota ao Lead
**Como** Sales  
**Quero** adicionar nota a um lead  
**Para que** registrar interações

**Critérios de Aceitação:**
- Campo de texto (rich text)
- Anexos (opcional)
- Timestamp automático
- Aparece na timeline

**Prioridade:** Alta  
**Estimativa:** 3 pontos  
**Módulo:** CRM

---

### US-017: Converter Lead em Quote
**Como** Sales  
**Quero** converter um lead interessado em proposta  
**Para que** formalizar negociação

**Critérios de Aceitação:**
- Quote é criado associado ao lead
- Veículo de interesse é pré-preenchido (se houver)
- Status do lead muda para `quote_sent`
- Email é enviado ao cliente com link da proposta

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** CRM

---

### US-018: Lead Scoring Automático
**Como** Sistema  
**Quero** calcular score automático de leads  
**Para que** priorizar follow-ups

**Critérios de Aceitação:**
- Score calculado baseado em: origem, interesse, budget, tempo de resposta, engajamento
- Score 0-100
- Categorias: Hot (80-100), Warm (50-79), Cold (0-49)
- Recalcular quando houver nova interação

**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Módulo:** CRM

---

### US-019: Pipeline Kanban Board
**Como** Sales Manager  
**Quero** visualizar leads em formato kanban  
**Para que** gerenciar pipeline visualmente

**Critérios de Aceitação:**
- Colunas por estágio do pipeline
- Drag & drop entre estágios
- Cards mostram: nome, score, veículo de interesse
- Filtros aplicáveis

**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Módulo:** CRM

---

### US-020: Importar Leads via CSV
**Como** Sales Manager  
**Quero** importar leads de uma planilha  
**Para que** migrar dados de sistema antigo

**Critérios de Aceitação:**
- Upload de CSV
- Mapeamento de colunas
- Validação de dados
- Preview antes de importar
- Relatório de importação (sucessos, erros)

**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Módulo:** CRM

---

### US-021: Automação de Nurturing
**Como** Sistema  
**Quero** enviar sequência de emails automaticamente  
**Para que** nutrir leads sem intervenção manual

**Critérios de Aceitação:**
- Sequência configurável (3-5 emails)
- Templates de email
- Pausa se lead responder
- Tracking de abertura/clique

**Prioridade:** Baixa  
**Estimativa:** 13 pontos  
**Módulo:** CRM

---

## 💰 Módulo: Sales / Desking

### US-022: Criar Quote (Proposta)
**Como** Sales  
**Quero** criar uma proposta de venda  
**Para que** formalizar oferta ao cliente

**Critérios de Aceitação:**
- Seleção de veículo
- Seleção de cliente (lead ou novo)
- Preço de venda
- Desconto
- Trade-in (opcional)
- Financiamento (opcional)
- Seguros (opcional)
- Acessórios (opcional)
- Cálculo automático de impostos
- Total calculado

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Sales

---

### US-023: Simular Condições de Financiamento
**Como** Sales  
**Quero** simular diferentes condições de financiamento  
**Para que** apresentar opções ao cliente

**Critérios de Aceitação:**
- Valor financiado
- Taxa de juros
- Prazo (meses)
- Entrada
- Cálculo de parcelas
- Comparação de múltiplas opções

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Sales

---

### US-024: Avaliar Trade-in
**Como** Sales  
**Quero** avaliar veículo do cliente para trade-in  
**Para que** oferecer desconto na compra

**Critérios de Aceitação:**
- Cliente informa veículo (placa/VIN)
- Sistema consulta Vehicle History
- IA sugere preço baseado em histórico, market value, condição
- Vendedor pode ajustar valor
- Valor entra no quote como desconto

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Sales

---

### US-025: Converter Quote em Venda
**Como** Sales  
**Quero** converter uma proposta aceita em venda  
**Para que** finalizar transação

**Critérios de Aceitação:**
- Quote deve estar com status `accepted`
- Sale é criado
- Veículo status muda para `sold`
- Lead status muda para `won`
- Contrato é gerado
- Notificação é enviada

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Sales

---

### US-026: Gerar Contrato de Venda
**Como** Sistema  
**Quero** gerar contrato automaticamente  
**Para que** formalizar venda

**Critérios de Aceitação:**
- Template de contrato configurável
- Preenchimento automático de dados
- Assinatura digital (opcional)
- PDF para download
- Envio por email

**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Módulo:** Sales

---

### US-027: Processar Pagamento
**Como** Sales  
**Quero** processar pagamento da venda  
**Para que** receber valor

**Critérios de Aceitação:**
- Integração com gateway (Stripe, Pagar.me)
- Suporte: PIX, boleto, cartão
- Parcelamento
- Tokenização (não armazenar cartão completo)
- Confirmação de pagamento

**Prioridade:** Alta  
**Estimativa:** 13 pontos  
**Módulo:** Sales

---

## 🔧 Módulo: Service / RO

### US-028: Agendar Serviço Online
**Como** Cliente  
**Quero** agendar minha revisão pelo site  
**Para que** receber atendimento no horário escolhido

**Critérios de Aceitação:**
- Cliente escolhe loja, serviço, data/hora disponível
- Validação de disponibilidade (bay, técnico)
- RO é criado e aparece no calendário
- Email de confirmação
- Lembrete 24h antes

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Service

---

### US-029: Check-in de Veículo
**Como** Service Tech  
**Quero** fazer check-in de veículo na chegada  
**Para que** iniciar processo de serviço

**Critérios de Aceitação:**
- Confirmação de identidade do cliente
- Verificação de veículo (fotos, km, combustível)
- Assinatura de termo
- Status muda para `checked_in`
- Notificação ao cliente

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Service

---

### US-030: Realizar Inspeção
**Como** Service Tech  
**Quero** realizar inspeção completa do veículo  
**Para que** identificar problemas e criar orçamento

**Critérios de Aceitação:**
- Checklist de inspeção (móvel)
- Identificação de problemas
- Fotos de danos/defeitos
- Estimativa de tempo e custo
- Status muda para `inspecting` → `quoted`

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Service

---

### US-031: Criar Orçamento de Serviço
**Como** Service Tech  
**Quero** criar orçamento detalhado  
**Para que** cliente aprovar antes de executar

**Critérios de Aceitação:**
- Lista de serviços necessários
- Lista de peças necessárias
- Mão de obra
- Total calculado
- Envio para aprovação do cliente
- Status muda para `quoted`

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Service

---

### US-032: Autorizar Orçamento
**Como** Cliente  
**Quero** autorizar orçamento de serviço  
**Para que** oficina executar trabalho

**Critérios de Aceitação:**
- Cliente aprova orçamento (digital ou presencial)
- Pagamento antecipado (opcional)
- Status muda para `authorized`
- Notificação à equipe

**Prioridade:** Alta  
**Estimativa:** 3 pontos  
**Módulo:** Service

---

### US-033: Executar Serviço
**Como** Service Tech  
**Quero** registrar execução do serviço  
**Para que** acompanhar progresso

**Critérios de Aceitação:**
- Status muda para `in_progress`
- Técnico atualiza status em tempo real
- Registra horas trabalhadas
- Consome peças do estoque
- Fotos do trabalho (opcional)

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Service

---

### US-034: Finalizar RO e Faturar
**Como** Service Tech  
**Quero** finalizar RO e gerar fatura  
**Para que** concluir serviço e receber pagamento

**Critérios de Aceitação:**
- Teste de qualidade
- Status muda para `completed`
- Fatura é gerada automaticamente
- NF-e é emitida (se configurado)
- Email é enviado ao cliente com fatura
- Peças consumidas são debitadas
- Horas trabalhadas são registradas

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Service

---

### US-035: Visualizar Calendário de Agendamentos
**Como** Service Manager  
**Quero** ver calendário de agendamentos  
**Para que** gerenciar capacidade da oficina

**Critérios de Aceitação:**
- Vista mensal/semanal/diária
- Bays e técnicos
- Drag & drop para reagendar
- Filtros por loja, técnico, status

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Service

---

### US-036: Visualizar RO Detail
**Como** Service Tech  
**Quero** ver detalhes completos de um RO  
**Para que** ter contexto completo

**Critérios de Aceitação:**
- Informações do cliente e veículo
- Checklist de inspeção
- Serviços e peças
- Timeline de eventos
- Fotos
- Faturamento

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Service

---

## 🔩 Módulo: Parts (Peças)

### US-037: Listar Estoque de Peças
**Como** Parts Clerk  
**Quero** listar peças em estoque  
**Para que** gerenciar inventário

**Critérios de Aceitação:**
- Filtros: categoria, fornecedor, low stock, loja
- Ordenação: nome, quantidade, custo
- Paginação
- Alertas de low stock destacados

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Parts

---

### US-038: Criar/Editar Peça
**Como** Parts Clerk  
**Quero** cadastrar nova peça  
**Para que** controlar estoque

**Critérios de Aceitação:**
- Campos: part number, descrição, categoria, fornecedor, custo, preço, min quantity
- Validações aplicadas
- Histórico de alterações

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Parts

---

### US-039: Receber Mercadoria
**Como** Parts Clerk  
**Quero** registrar entrada de mercadoria  
**Para que** atualizar estoque

**Critérios de Aceitação:**
- Seleção de peças
- Quantidades recebidas
- Validação de nota fiscal (opcional)
- Custo unitário
- Estoque é atualizado
- Movimentação registrada

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Parts

---

### US-040: Transferir Peças entre Stores
**Como** Parts Clerk  
**Quero** transferir peças entre lojas  
**Para que** balancear estoque

**Critérios de Aceitação:**
- Seleção de peças e quantidades
- Loja origem e destino
- Movimentação registrada
- Estoque atualizado em ambas as lojas
- Notificação à loja destino

**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Módulo:** Parts

---

### US-041: Fazer Pedido para Fornecedor
**Como** Parts Clerk  
**Quero** criar pedido para fornecedor  
**Para que** repor estoque

**Critérios de Aceitação:**
- Seleção de peças
- Quantidades
- Consulta de preço e lead-time (se integrado)
- Geração de pedido
- Envio para fornecedor (email ou integração)

**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Módulo:** Parts

---

### US-042: Alertas de Low Stock
**Como** Sistema  
**Quero** alertar quando estoque está baixo  
**Para que** evitar falta de peças

**Critérios de Aceitação:**
- Alerta quando quantidade < min_quantity
- Dashboard mostra peças com estoque baixo
- Sugestão de pedido (quantidade baseada em histórico)
- Notificação por email (opcional)

**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Módulo:** Parts

---

## 📊 Módulo: Dashboard & Reports

### US-043: Visualizar Dashboard Principal
**Como** Store Manager  
**Quero** ver KPIs principais  
**Para que** acompanhar performance

**Critérios de Aceitação:**
- KPIs: vendas, service revenue, leads, conversion
- Gráficos (vendas por período, pipeline)
- Atividades recentes
- Alertas (low stock, leads quentes)
- Filtro por período e loja

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Dashboard

---

### US-044: Relatório de Vendas
**Como** Sales Manager  
**Quero** gerar relatório de vendas  
**Para que** analisar performance

**Critérios de Aceitação:**
- Filtros: período, loja, vendedor, make/model
- Métricas: total vendas, gross profit, units, average deal size
- Gráficos e tabelas
- Export PDF/CSV

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Reports

---

### US-045: Relatório de Service
**Como** Service Manager  
**Quero** gerar relatório de service  
**Para que** analisar performance da oficina

**Critérios de Aceitação:**
- Filtros: período, loja, técnico
- Métricas: RO hours, revenue per RO, turnaround time, customer satisfaction
- Gráficos e tabelas
- Export PDF/CSV

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Reports

---

### US-046: Relatório Customizável
**Como** Tenant Admin  
**Quero** criar relatórios customizados  
**Para que** analisar dados específicos

**Critérios de Aceitação:**
- Seleção de métricas
- Filtros configuráveis
- Agrupamentos
- Gráficos configuráveis
- Salvar como template
- Agendar envio por email

**Prioridade:** Baixa  
**Estimativa:** 13 pontos  
**Módulo:** Reports

---

## 🏢 Módulo: Admin

### US-047: Criar Tenant (Onboarding)
**Como** Sistema  
**Quero** provisionar novo tenant automaticamente  
**Para que** nova concessionária usar sistema

**Critérios de Aceitação:**
- Input: dados da concessionária, CNPJ, plano
- Criar tenant DB
- Rodar migrations
- Criar bucket S3
- Criar subdomínio (DNS)
- Configurar SSL
- Criar org no Auth provider
- Criar subscription no Stripe
- Criar usuário admin
- Email de boas-vindas

**Prioridade:** Crítica  
**Estimativa:** 13 pontos  
**Módulo:** Admin

---

### US-048: Configurar Stores (Filiais)
**Como** Tenant Admin  
**Quero** configurar filiais da concessionária  
**Para que** organizar operação multi-loja

**Critérios de Aceitação:**
- Criar/editar stores
- Campos: nome, endereço, telefone, email
- Configurar inventário (centralizado ou separado)
- Ativar/desativar stores

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Admin

---

### US-049: Gerenciar Usuários
**Como** Tenant Admin  
**Quero** gerenciar usuários do tenant  
**Para que** controlar acesso

**Critérios de Aceitação:**
- Criar/editar/desativar usuários
- Atribuir roles
- Atribuir stores (quais lojas usuário tem acesso)
- Reset de senha
- Histórico de acesso

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Admin

---

### US-050: Configurar Integrações
**Como** Tenant Admin  
**Quero** configurar integrações externas  
**Para que** conectar com sistemas externos

**Critérios de Aceitação:**
- Configurar webhooks (URL, eventos, secret)
- Configurar marketplaces (OLX, Webmotors)
- Configurar gateway de pagamento
- Testar conexão
- Logs de integração

**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Módulo:** Admin

---

### US-051: Onboarding Wizard
**Como** Novo Tenant  
**Quero** passar por wizard de onboarding  
**Para que** configurar sistema rapidamente

**Critérios de Aceitação:**
- Step 1: Configuração inicial (logo, stores, moeda, timezone)
- Step 2: Migração de dados (CSV upload)
- Step 3: Integrações
- Step 4: Treinamento (vídeos)
- Progresso salvo (pode pausar e retomar)

**Prioridade:** Alta  
**Estimativa:** 13 pontos  
**Módulo:** Admin

---

## 💳 Módulo: Billing

### US-052: Visualizar Subscription
**Como** Tenant Admin  
**Quero** ver informações da subscription  
**Para que** gerenciar plano

**Critérios de Aceitação:**
- Plano atual
- Uso (créditos Vehicle History, se aplicável)
- Próxima cobrança
- Histórico de pagamentos
- Upgrade/downgrade

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Billing

---

### US-053: Upgrade/Downgrade de Plano
**Como** Tenant Admin  
**Quero** mudar de plano  
**Para que** ajustar às necessidades

**Critérios de Aceitação:**
- Visualizar planos disponíveis
- Comparar features
- Upgrade/downgrade
- Próxima cobrança ajustada (prorated)
- Confirmação por email

**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Módulo:** Billing

---

### US-054: Comprar Créditos Vehicle History
**Como** Tenant Admin  
**Quero** comprar créditos extras  
**Para que** continuar usando módulo

**Critérios de Aceitação:**
- Selecionar quantidade de créditos
- Ver preço total
- Processar pagamento
- Créditos adicionados imediatamente
- Nota fiscal gerada

**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Módulo:** Billing

---

## 📄 Módulo: Accounting

### US-055: Visualizar Ledger
**Como** Accountant  
**Quero** ver lançamentos contábeis  
**Para que** acompanhar contabilidade

**Critérios de Aceitação:**
- Filtros: período, conta, tipo
- Lançamentos automáticos (vendas, ROs, compras)
- Lançamentos manuais
- Saldo por conta
- Export CSV/OFX

**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Módulo:** Accounting

---

### US-056: Gerar NF-e
**Como** Accountant  
**Quero** gerar nota fiscal eletrônica  
**Para que** faturar corretamente

**Critérios de Aceitação:**
- Integração com provedor autorizado
- Certificado digital configurado
- Geração de XML
- Geração de PDF
- Envio para SEFAZ
- Status: emitida, cancelada

**Prioridade:** Alta  
**Estimativa:** 13 pontos  
**Módulo:** Accounting

---

### US-057: Export para QuickBooks
**Como** Accountant  
**Quero** exportar dados para QuickBooks  
**Para que** integrar com contabilidade

**Critérios de Aceitação:**
- Export em formato QuickBooks
- Seleção de período
- Validação de dados
- Download do arquivo

**Prioridade:** Baixa  
**Estimativa:** 8 pontos  
**Módulo:** Accounting

---

## 🔐 Módulo: Auth & Security

### US-058: Login com Email/Senha
**Como** Usuário  
**Quero** fazer login com email e senha  
**Para que** acessar sistema

**Critérios de Aceitação:**
- Validação de credenciais
- Token JWT gerado
- Refresh token
- MFA (se habilitado)

**Prioridade:** Crítica  
**Estimativa:** 5 pontos  
**Módulo:** Auth

---

### US-059: SSO (Single Sign-On)
**Como** Usuário Enterprise  
**Quero** fazer login via SSO  
**Para que** usar credenciais corporativas

**Critérios de Aceitação:**
- Suporte a SAML, OAuth2
- Redirecionamento para provider
- Retorno com token
- Sessão criada

**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Módulo:** Auth

---

### US-060: MFA (Multi-Factor Authentication)
**Como** Usuário Admin  
**Quero** habilitar MFA  
**Para que** aumentar segurança

**Critérios de Aceitação:**
- Configuração de MFA (TOTP)
- QR code para app autenticador
- Validação no login
- Backup codes

**Prioridade:** Média  
**Estimativa:** 8 pontos  
**Módulo:** Auth

---

## 📱 Módulo: Mobile (Futuro)

### US-061: App Mobile para Técnicos
**Como** Service Tech  
**Quero** usar app mobile  
**Para que** trabalhar na oficina sem computador

**Critérios de Aceitação:**
- Check-in de veículos
- Checklist de inspeção
- Atualizar status de RO
- Registrar horas
- Fotos

**Prioridade:** Baixa (Roadmap)  
**Estimativa:** 21 pontos  
**Módulo:** Mobile

---

## 📊 Resumo por Módulo

| Módulo | Stories | Total Points |
|--------|---------|--------------|
| Inventory | 8 | 57 |
| Vehicle History | 4 | 34 |
| CRM | 9 | 60 |
| Sales | 6 | 47 |
| Service | 9 | 60 |
| Parts | 6 | 33 |
| Dashboard | 4 | 37 |
| Admin | 5 | 42 |
| Billing | 3 | 15 |
| Accounting | 3 | 29 |
| Auth | 3 | 21 |
| **Total** | **60** | **435** |

*Nota: Este backlog contém as 60 principais user stories. O backlog completo terá 150+ stories incluindo edge cases, melhorias, e features secundárias.*

---

## 📥 Export Formats

### CSV Format (para import em ferramentas)

```csv
ID,Title,Description,Priority,Estimate,Module,Acceptance Criteria
US-001,Criar Veículo no Inventário,"Como Sales Manager, quero criar um veículo...",Alta,8,Inventory,"- Ao inserir VIN..."
US-002,Editar Veículo,"Como Sales Manager...",Alta,5,Inventory,"- Edição de todos os campos..."
```

### Jira Import Format

Formato JSON compatível com Jira para importação em massa.

---

**Documento criado em:** [Data]  
**Última atualização:** [Data]  
**Versão:** 1.0

