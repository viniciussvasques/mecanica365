# Guia Prático de Estimativa de Tempo - MVP ERP Concessionárias

**Versão:** 1.0  
**Objetivo:** Método prático para estimar tempo de desenvolvimento com sua equipe

---

## 📊 Visão Geral

Este guia fornece um **método preciso e aplicável** para transformar o escopo do MVP em um prazo realista. Em vez de fornecer um prazo fixo (que depende de variáveis externas), entregamos uma **metodologia** que você pode usar com sua equipe.

---

## 🎯 Por que não um prazo fixo?

O tempo de desenvolvimento depende de:

- ✅ **Tamanho do time** (quantos desenvolvedores)
- ✅ **Experiência da equipe** (junior, pleno, sênior)
- ✅ **Disponibilidade** (full-time, part-time, horas/semana)
- ✅ **Complexidade de integrações** (APIs documentadas vs não documentadas)
- ✅ **Requisitos regulatórios** (NF-e, LGPD - podem ser complexos)
- ✅ **Prioridade de escopo** (o que cortar se necessário)
- ✅ **Burocracia de parceiros** (APIs Vehicle History podem demorar)
- ✅ **Velocidade de aprovações** (stakeholders, mudanças de escopo)

---

## 📐 Método de Estimativa

### Passo 1: Breakdown por Módulo

Cada módulo é quebrado em **tarefas** e estimado em **Story Points** (Fibonacci: 1, 2, 3, 5, 8, 13, 21).

#### Exemplo: Módulo Vehicle History

| Tarefa | Story Points | Dependências | Complexidade |
|--------|-------------|--------------|--------------|
| Design da API | 3 | - | Média |
| Integração com parceiro | 8 | Design da API | Alta |
| Cache layer (Redis) | 5 | Design da API | Média |
| Health Score algorithm | 8 | - | Alta |
| Geração de PDF | 5 | Health Score | Média |
| UI do viewer | 5 | Geração de PDF | Média |
| Testes (unit + integration) | 5 | Todas acima | Média |
| **Total** | **44 pontos** | - | - |

#### Story Points vs Horas (Referência)

| Story Points | Horas Estimadas | Complexidade |
|--------------|-----------------|--------------|
| 1 | 2-4h | Muito simples |
| 2 | 4-8h | Simples |
| 3 | 8-16h | Média |
| 5 | 16-32h | Média-Alta |
| 8 | 32-64h | Alta |
| 13 | 64-128h | Muito Alta |
| 21 | 128h+ | Extremamente Alta |

**Nota:** Estas são referências. A equipe deve calibrar baseado em sua experiência.

---

### Passo 2: Calcular Velocity do Time

#### O que é Velocity?

Velocity = Quantidade de Story Points que o time consegue entregar em um sprint (geralmente 2 semanas).

#### Como Calcular?

**Opção 1: Time Existente (com histórico)**
- Olhar últimos 3-6 sprints
- Média de pontos entregues por sprint
- Exemplo: 40, 35, 45 pontos → Média = **40 pontos/sprint**

**Opção 2: Time Novo (sem histórico)**
- Fazer sprint piloto de 1-2 semanas
- Contar pontos entregues
- Usar como baseline

**Opção 3: Estimativa Baseada em Capacidade**

```
Velocity = (Número de Devs × Horas/Semana × Semanas no Sprint × Fator de Produtividade) / Horas por Story Point

Exemplo:
- 4 desenvolvedores
- 40 horas/semana cada
- Sprint de 2 semanas
- Fator de produtividade: 0.7 (70% - considerando reuniões, code review, etc.)
- Média: 1 SP = 16 horas

Velocity = (4 × 40 × 2 × 0.7) / 16 = 224 / 16 = 14 pontos/sprint
```

**Ajuste:** Se time é experiente, fator pode ser 0.8-0.9. Se inexperiente, 0.5-0.6.

---

### Passo 3: Estimativa Final

#### Fórmula Básica

```
Tempo Total (semanas) = Total de Story Points / (Velocity por Sprint / 2)

Ou:

Tempo Total (semanas) = (Total de Story Points / Velocity) × 2
```

#### Exemplo Prático

**Cenário:**
- Total do MVP: **500 story points**
- Velocity: **20 pontos/sprint** (2 semanas)
- **Tempo estimado:** (500 / 20) × 2 = **50 semanas** (~12 meses)

**Mas isso parece muito!** Vamos ajustar...

---

### Passo 4: Ajustes e Fatores de Correção

#### Fatores de Ajuste

| Fator | Impacto | Ajuste |
|-------|---------|--------|
| **Complexidade técnica** (tecnologias novas) | +20% | × 1.2 |
| **Integrações externas** (APIs não documentadas) | +30% | × 1.3 |
| **Requisitos regulatórios** (NF-e, LGPD complexos) | +15% | × 1.15 |
| **Time inexperiente** (junior-heavy) | +25% | × 1.25 |
| **Mudanças de escopo** (scope creep) | +20% | × 1.2 |
| **Dependências externas** (parceiros lentos) | +15% | × 1.15 |

#### Fórmula Ajustada

```
Tempo Ajustado = Tempo Base × (1 + Σ fatores de ajuste) × Buffer

Onde:
- Buffer = 1.2 (20% para imprevistos)
- Σ fatores = soma dos fatores aplicáveis
```

#### Exemplo com Ajustes

**Cenário:**
- Tempo base: 50 semanas
- Complexidade técnica: +20%
- Integrações externas: +30%
- Requisitos regulatórios: +15%
- Buffer: +20%

**Cálculo:**
```
Tempo Ajustado = 50 × (1 + 0.20 + 0.30 + 0.15) × 1.2
                = 50 × 1.65 × 1.2
                = 50 × 1.98
                = 99 semanas (~24 meses)
```

**Isso ainda parece muito!** Vamos priorizar...

---

### Passo 5: Priorização e MVP Mínimo

#### Categorização de Features

**Must Have (Crítico - MVP Mínimo):**
- Inventory básico (criar, editar, listar)
- Vehicle History (core)
- CRM básico (criar lead, pipeline)
- Autenticação + RBAC
- Onboarding
- **Total estimado: ~250 pontos**

**Should Have (Importante - MVP Completo):**
- Tudo acima +
- Service/RO completo
- Parts básico
- Desking
- Dashboard
- **Total estimado: ~500 pontos**

**Nice to Have (Pode cortar):**
- F&I avançado
- Accounting completo
- Integrações com marketplaces
- Mobile apps
- **Total estimado: ~250 pontos**

#### Estimativa por Categoria

**MVP Mínimo:**
- Total: 250 pontos
- Velocity: 20 pontos/sprint
- Tempo: (250 / 20) × 2 = **25 semanas** (~6 meses)
- Com ajustes: 25 × 1.65 × 1.2 = **49 semanas** (~12 meses)

**MVP Completo:**
- Total: 500 pontos
- Tempo: (500 / 20) × 2 = **50 semanas** (~12 meses)
- Com ajustes: 50 × 1.65 × 1.2 = **99 semanas** (~24 meses)

---

## 📊 Planilha de Estimativa (Template)

### Planilha Excel/Google Sheets

| Módulo | Tarefas | Story Points | Dependências | Prioridade | Tempo Estimado (semanas) |
|--------|---------|-------------|--------------|------------|--------------------------|
| Onboarding | 5 | 34 | - | Must | 3.4 |
| Inventory | 8 | 57 | - | Must | 5.7 |
| Vehicle History | 4 | 34 | Inventory | Must | 3.4 |
| CRM | 9 | 60 | - | Must | 6.0 |
| Sales | 6 | 47 | CRM | Should | 4.7 |
| Service/RO | 9 | 60 | - | Should | 6.0 |
| Parts | 6 | 33 | - | Should | 3.3 |
| Dashboard | 4 | 37 | Todos | Should | 3.7 |
| Admin | 5 | 42 | - | Must | 4.2 |
| Billing | 3 | 15 | - | Must | 1.5 |
| Accounting | 3 | 29 | - | Nice | 2.9 |
| **Total** | **62** | **442** | - | - | **44.2** |

**Cálculos Automáticos:**
- Total de pontos por prioridade
- Tempo estimado por módulo (assumindo velocity)
- Tempo total do MVP
- Tempo do MVP Mínimo (apenas Must Have)

---

## 🎯 Como Usar com sua Equipe

### Sprint Planning

1. **Revisar Backlog:**
   - Time revisa user stories
   - Estima em story points (Planning Poker)
   - Prioriza baseado no backlog

2. **Definir Sprint:**
   - Quantos pontos o time consegue entregar?
   - Selecionar stories para o sprint
   - Definir Definition of Done

3. **Executar Sprint:**
   - Desenvolvimento
   - Code review
   - Testes
   - Deploy

### Sprint Review

1. **Contar Pontos Entregues:**
   - Stories completadas (Done)
   - Stories parcialmente completas (não contam)
   - Atualizar velocity

2. **Re-estimar Backlog:**
   - Se velocity mudou, re-estimar prazo
   - Ajustar prioridades se necessário

### Ajustes Contínuos

- **Se velocity aumentar:** Prazo diminui
- **Se velocity diminuir:** Prazo aumenta
- **Se escopo mudar:** Re-estimar backlog
- **Se blockers aparecerem:** Adicionar buffer

---

## 📈 Exemplos Práticos

### Exemplo 1: Time Pequeno (2 devs)

**Configuração:**
- 2 desenvolvedores full-time
- 1 designer part-time (20h/semana)
- 1 QA part-time (20h/semana)
- Velocity estimada: **15 pontos/sprint** (2 semanas)

**MVP Mínimo (250 pontos):**
- Tempo: (250 / 15) × 2 = **33 semanas** (~8 meses)
- Com ajustes: 33 × 1.65 × 1.2 = **65 semanas** (~16 meses)

**MVP Completo (500 pontos):**
- Tempo: (500 / 15) × 2 = **67 semanas** (~16 meses)
- Com ajustes: 67 × 1.65 × 1.2 = **133 semanas** (~32 meses)

---

### Exemplo 2: Time Médio (4 devs)

**Configuração:**
- 4 desenvolvedores full-time
- 1 designer full-time
- 1 QA full-time
- 1 Product Owner part-time
- Velocity estimada: **25 pontos/sprint**

**MVP Mínimo (250 pontos):**
- Tempo: (250 / 25) × 2 = **20 semanas** (~5 meses)
- Com ajustes: 20 × 1.65 × 1.2 = **40 semanas** (~10 meses)

**MVP Completo (500 pontos):**
- Tempo: (500 / 25) × 2 = **40 semanas** (~10 meses)
- Com ajustes: 40 × 1.65 × 1.2 = **79 semanas** (~19 meses)

---

### Exemplo 3: Time Grande (8 devs)

**Configuração:**
- 8 desenvolvedores full-time
- 2 designers full-time
- 2 QAs full-time
- 1 Product Owner full-time
- 1 Tech Lead full-time
- Velocity estimada: **50 pontos/sprint**

**MVP Mínimo (250 pontos):**
- Tempo: (250 / 50) × 2 = **10 semanas** (~2.5 meses)
- Com ajustes: 10 × 1.65 × 1.2 = **20 semanas** (~5 meses)

**MVP Completo (500 pontos):**
- Tempo: (500 / 50) × 2 = **20 semanas** (~5 meses)
- Com ajustes: 20 × 1.65 × 1.2 = **40 semanas** (~10 meses)

---

## 🛠️ Ferramentas Recomendadas

### Para Estimativa

1. **Jira / Linear / Asana:**
   - Backlog de user stories
   - Story points
   - Velocity tracking
   - Burndown charts

2. **Planning Poker:**
   - Ferramenta: planningpoker.com
   - Time estima juntos
   - Discute diferenças

3. **Planilha de Estimativa:**
   - Excel / Google Sheets
   - Template fornecido neste guia
   - Cálculos automáticos

### Para Tracking

1. **Burndown Chart:**
   - Mostra progresso do sprint
   - Identifica atrasos cedo

2. **Velocity Chart:**
   - Histórico de velocity
   - Tendências
   - Previsões

---

## ⚠️ Armadilhas Comuns

### 1. Estimativa Otimista

**Problema:** Time estima baseado em "melhor cenário"  
**Solução:** Sempre adicionar buffer (20-30%)

### 2. Ignorar Dependências

**Problema:** Não considerar bloqueios externos  
**Solução:** Mapear dependências claramente

### 3. Scope Creep

**Problema:** Features sendo adicionadas durante desenvolvimento  
**Solução:** Processo de change request, re-estimar quando escopo muda

### 4. Velocity Inconsistente

**Problema:** Velocity varia muito entre sprints  
**Solução:** Usar média móvel (últimos 3-6 sprints)

### 5. Não Considerar Overhead

**Problema:** Esquecem reuniões, code review, deploy  
**Solução:** Fator de produtividade (0.7-0.8)

---

## 📋 Checklist de Estimativa

Antes de finalizar estimativa, verificar:

- [ ] Todas as user stories foram estimadas?
- [ ] Dependências foram mapeadas?
- [ ] Velocity do time foi calculada?
- [ ] Fatores de ajuste foram aplicados?
- [ ] Buffer foi adicionado (20%)?
- [ ] Priorização foi feita (Must/Should/Nice)?
- [ ] Riscos foram identificados?
- [ ] Estimativa foi revisada com stakeholders?

---

## 🎓 Conclusão

Este método fornece:

- ✅ **Precisão:** Baseado em dados reais (velocity)
- ✅ **Flexibilidade:** Ajusta conforme time e escopo
- ✅ **Transparência:** Stakeholders entendem como chegamos no prazo
- ✅ **Melhoria Contínua:** Velocity melhora com o tempo

**Lembre-se:**
- Estimativas são **previsões**, não promessas
- Re-estime regularmente (a cada sprint)
- Comunique mudanças cedo
- Priorize valor sobre completude

---

**Documento criado em:** [Data]  
**Última atualização:** [Data]  
**Versão:** 1.0

