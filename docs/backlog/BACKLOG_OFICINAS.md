# Backlog: Versão Oficinas - ERP para Oficinas Mecânicas

**Versão:** 1.0  
**Produto:** AutoVida Oficinas (ou nome escolhido)

---

## 🎯 Visão Geral

ERP especializado para oficinas mecânicas, retíficas, funilarias, etc., com foco em:
- Agilidade na oficina
- Mobile-first (técnicos usam tablet/celular)
- Integração automática com Vehicle History
- Simplicidade (sem complexidade de dealers)

---

## 📋 User Stories - Versão Oficinas

### Módulo: Service Orders (RO)

#### US-OF-001: Criar Service Order
**Como** Recepcionista  
**Quero** criar um RO para um cliente  
**Para que** iniciar processo de serviço

**Critérios de Aceitação:**
- Campos: cliente, veículo (placa/VIN), tipo de serviço, observações
- RO recebe número sequencial
- Status inicial: `scheduled` ou `checked_in`
- Integração: busca dados do veículo no Vehicle History (se disponível)

**Prioridade:** Crítica  
**Estimativa:** 5 pontos  
**Módulo:** Service Orders

---

#### US-OF-002: Agendamento Online
**Como** Cliente  
**Quero** agendar serviço pelo site/app  
**Para que** escolher horário conveniente

**Critérios de Aceitação:**
- Cliente escolhe: tipo de serviço, data, horário
- Validação de disponibilidade (bay, técnico)
- Confirmação por email/SMS
- Lembrete 24h antes
- RO é criado automaticamente

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Service Orders

---

#### US-OF-003: Check-in de Veículo
**Como** Recepcionista  
**Quero** fazer check-in quando cliente chega  
**Para que** iniciar processo de serviço

**Critérios de Aceitação:**
- Confirmação de identidade do cliente
- Verificação de veículo (fotos, km, combustível)
- Assinatura de termo (digital ou impresso)
- Status muda para `checked_in`
- Notificação ao técnico

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Service Orders

---

#### US-OF-004: Checklist de Inspeção (Mobile)
**Como** Técnico  
**Quero** fazer inspeção usando tablet/celular  
**Para que** trabalhar na oficina sem ir ao computador

**Critérios de Aceitação:**
- Checklist mobile-friendly
- Fotos durante inspeção
- Anotação de problemas encontrados
- Estimativa de tempo e custo
- Status muda para `inspecting` → `quoted`

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Service Orders

---

#### US-OF-005: Criar Orçamento
**Como** Técnico/Recepcionista  
**Quero** criar orçamento detalhado  
**Para que** cliente aprovar antes de executar

**Critérios de Aceitação:**
- Lista de serviços necessários
- Lista de peças necessárias (com estoque disponível)
- Mão de obra (horas × valor/hora)
- Desconto (opcional)
- Total calculado
- Envio para aprovação do cliente
- Status muda para `quoted`

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Service Orders

---

#### US-OF-006: Autorizar Orçamento
**Como** Cliente  
**Quero** autorizar orçamento  
**Para que** oficina executar trabalho

**Critérios de Aceitação:**
- Cliente aprova (digital ou presencial)
- Pagamento antecipado (opcional)
- Status muda para `authorized`
- Notificação à equipe
- Peças são reservadas no estoque

**Prioridade:** Alta  
**Estimativa:** 3 pontos  
**Módulo:** Service Orders

---

#### US-OF-007: Executar Serviço
**Como** Técnico  
**Quero** registrar execução do serviço  
**Para que** acompanhar progresso

**Critérios de Aceitação:**
- Status muda para `in_progress`
- Técnico atualiza status em tempo real (mobile)
- Registra horas trabalhadas
- Consome peças do estoque
- Fotos do trabalho (opcional)
- Notas técnicas

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Service Orders

---

#### US-OF-008: Finalizar RO e Atualizar Vehicle History
**Como** Técnico  
**Quero** finalizar RO e atualizar histórico do veículo  
**Para que** concluir serviço e alimentar Vehicle History

**Critérios de Aceitação:**
- Teste de qualidade
- Status muda para `completed`
- **Integração automática com Vehicle History:**
  - Serviço realizado é enviado
  - Peças trocadas são registradas
  - KM atualizado
  - Data do serviço
- Health Score é atualizado (se manutenção preventiva)
- Fatura é gerada automaticamente

**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Módulo:** Service Orders

---

#### US-OF-009: Visualizar Calendário de Agendamentos
**Como** Recepcionista  
**Quero** ver calendário de agendamentos  
**Para que** gerenciar capacidade da oficina

**Critérios de Aceitação:**
- Vista mensal/semanal/diária
- Bays (baias) e técnicos
- Drag & drop para reagendar
- Filtros: técnico, tipo de serviço, status
- Alertas de conflitos

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Service Orders

---

#### US-OF-010: Listar ROs com Filtros
**Como** Gerente  
**Quero** listar ROs com filtros  
**Para que** acompanhar trabalho da oficina

**Critérios de Aceitação:**
- Filtros: status, técnico, cliente, data, tipo de serviço
- Ordenação: data, status, prioridade
- Visualização: lista ou kanban
- Ações rápidas: editar, finalizar, cancelar

**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Módulo:** Service Orders

---

### Módulo: Agendamentos

#### US-OF-011: Configurar Disponibilidade
**Como** Gerente  
**Quero** configurar disponibilidade de bays e técnicos  
**Para que** controlar agendamentos

**Critérios de Aceitação:**
- Horários de funcionamento
- Bays disponíveis por período
- Técnicos e suas especialidades
- Férias/folgas
- Bloqueios temporários

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Agendamentos

---

#### US-OF-012: Lembretes Automáticos
**Como** Sistema  
**Quero** enviar lembretes automáticos  
**Para que** reduzir no-shows

**Critérios de Aceitação:**
- Lembrete 24h antes do agendamento
- Lembrete 2h antes (opcional)
- SMS e/ou WhatsApp
- Cliente pode confirmar/cancelar pelo link

**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Módulo:** Agendamentos

---

### Módulo: Estoque de Peças

#### US-OF-013: Listar Estoque de Peças
**Como** Estoquista  
**Quero** listar peças em estoque  
**Para que** gerenciar inventário

**Critérios de Aceitação:**
- Filtros: categoria, fornecedor, low stock, localização
- Ordenação: nome, quantidade, custo
- Alertas de low stock destacados
- Busca rápida

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Estoque

---

#### US-OF-014: Criar/Editar Peça
**Como** Estoquista  
**Quero** cadastrar nova peça  
**Para que** controlar estoque

**Critérios de Aceitação:**
- Campos: código, descrição, categoria, fornecedor, custo, preço, min quantity
- Validações aplicadas
- Histórico de alterações
- Fotos (opcional)

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Estoque

---

#### US-OF-015: Receber Mercadoria
**Como** Estoquista  
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
**Módulo:** Estoque

---

#### US-OF-016: Consumir Peças (RO)
**Como** Técnico  
**Quero** consumir peças durante execução do RO  
**Para que** debitar do estoque

**Critérios de Aceitação:**
- Seleção de peças do estoque
- Quantidades consumidas
- Estoque é debitado automaticamente
- Movimentação registrada
- Custo é calculado

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Estoque

---

#### US-OF-017: Alertas de Low Stock
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
**Módulo:** Estoque

---

#### US-OF-018: Fazer Pedido para Fornecedor
**Como** Estoquista  
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
**Módulo:** Estoque

---

### Módulo: Faturamento

#### US-OF-019: Gerar Fatura
**Como** Recepcionista  
**Quero** gerar fatura ao finalizar RO  
**Para que** receber pagamento

**Critérios de Aceitação:**
- Fatura é gerada automaticamente ao finalizar RO
- Inclui: serviços, peças, mão de obra
- Descontos aplicados
- Total calculado
- NF-e é emitida (se configurado)

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Faturamento

---

#### US-OF-020: Emitir NF-e
**Como** Recepcionista  
**Quero** emitir nota fiscal eletrônica  
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
**Módulo:** Faturamento

---

#### US-OF-021: Processar Pagamento
**Como** Recepcionista  
**Quero** processar pagamento do cliente  
**Para que** receber valor

**Critérios de Aceitação:**
- Integração com gateway (Pagar.me, Stripe)
- Suporte: PIX, boleto, cartão, dinheiro
- Parcelamento (opcional)
- Confirmação de pagamento
- Atualização de contas a receber

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Faturamento

---

### Módulo: Clientes

#### US-OF-022: Cadastrar Cliente
**Como** Recepcionista  
**Quero** cadastrar novo cliente  
**Para que** criar ROs e histórico

**Critérios de Aceitação:**
- Campos: nome, CPF, telefone, email, endereço
- Validação de CPF
- Busca de duplicatas
- Histórico de serviços do cliente

**Prioridade:** Alta  
**Estimativa:** 3 pontos  
**Módulo:** Clientes

---

#### US-OF-023: Histórico de Serviços do Cliente
**Como** Recepcionista  
**Quero** ver histórico de serviços de um cliente  
**Para que** entender necessidades

**Critérios de Aceitação:**
- Lista de todos os ROs do cliente
- Veículos do cliente
- Serviços mais realizados
- Gastos por período
- Próximas manutenções (baseado em km/tempo)

**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Módulo:** Clientes

---

#### US-OF-024: Veículos do Cliente
**Como** Recepcionista  
**Quero** ver veículos de um cliente  
**Para que** agilizar criação de RO

**Critérios de Aceitação:**
- Lista de veículos cadastrados
- Histórico de serviços por veículo
- Link para Vehicle History completo
- Veículo padrão (mais usado)

**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Módulo:** Clientes

---

### Módulo: Vehicle History (Integração)

#### US-OF-025: Consultar Vehicle History
**Como** Técnico  
**Quero** consultar histórico do veículo  
**Para que** entender problemas anteriores

**Critérios de Aceitação:**
- Consulta por VIN ou placa
- Histórico completo de serviços
- Acidentes/reparos anteriores
- Health Score
- Red flags

**Prioridade:** Alta  
**Estimativa:** 5 pontos  
**Módulo:** Vehicle History

---

#### US-OF-026: Atualizar Vehicle History Automaticamente
**Como** Sistema  
**Quero** atualizar Vehicle History ao finalizar RO  
**Para que** manter histórico completo

**Critérios de Aceitação:**
- Ao finalizar RO, dados são enviados automaticamente
- Serviço realizado
- Peças trocadas
- KM atualizado
- Data do serviço
- Health Score é recalculado (se aplicável)

**Prioridade:** Crítica  
**Estimativa:** 8 pontos  
**Módulo:** Vehicle History

---

### Módulo: Dashboard

#### US-OF-027: Dashboard Principal
**Como** Gerente  
**Quero** ver KPIs principais  
**Para que** acompanhar performance

**Critérios de Aceitação:**
- KPIs: receita, ROs no período, ticket médio, satisfação
- Gráficos (receita por período, serviços mais realizados)
- ROs em andamento
- Alertas (low stock, agendamentos)
- Filtro por período

**Prioridade:** Alta  
**Estimativa:** 8 pontos  
**Módulo:** Dashboard

---

#### US-OF-028: Relatório de Receita
**Como** Gerente  
**Quero** gerar relatório de receita  
**Para que** analisar performance

**Critérios de Aceitação:**
- Filtros: período, técnico, tipo de serviço
- Métricas: total receita, ticket médio, serviços realizados
- Gráficos e tabelas
- Export PDF/CSV

**Prioridade:** Média  
**Estimativa:** 5 pontos  
**Módulo:** Dashboard

---

### Módulo: Mobile

#### US-OF-029: App Mobile para Técnicos
**Como** Técnico  
**Quero** usar app mobile  
**Para que** trabalhar na oficina sem computador

**Critérios de Aceitação:**
- Check-in de veículos
- Checklist de inspeção
- Atualizar status de RO
- Registrar horas
- Fotos
- Consumir peças

**Prioridade:** Baixa (Roadmap)  
**Estimativa:** 21 pontos  
**Módulo:** Mobile

---

## 📊 Resumo por Módulo

| Módulo | Stories | Total Points |
|--------|---------|--------------|
| Service Orders | 10 | 66 |
| Agendamentos | 2 | 10 |
| Estoque | 6 | 33 |
| Faturamento | 3 | 26 |
| Clientes | 3 | 13 |
| Vehicle History | 2 | 13 |
| Dashboard | 2 | 13 |
| Mobile | 1 | 21 |
| **Total** | **29** | **195** |

---

## 🎯 Priorização MVP Oficinas

### Must Have (MVP Mínimo)

- Service Orders (criar, check-in, inspeção, orçamento, execução, finalizar)
- Estoque básico (listar, criar, receber, consumir)
- Faturamento básico (gerar fatura, processar pagamento)
- Integração Vehicle History (consulta e atualização)
- **Total: ~120 pontos**

### Should Have (MVP Completo)

- Tudo acima +
- Agendamentos online
- Dashboard
- NF-e
- **Total: ~195 pontos**

### Nice to Have (Roadmap)

- App mobile
- Automações avançadas
- Integrações com fornecedores

---

**Documento criado em:** [Data]  
**Última atualização:** [Data]  
**Versão:** 1.0

