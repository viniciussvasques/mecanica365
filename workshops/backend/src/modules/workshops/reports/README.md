# 📊 ReportsModule - Geração de Relatórios

## 📋 Descrição

Módulo responsável pela geração de relatórios diversos do sistema, incluindo relatórios de vendas, estoque, financeiro e operacional.

## 🎯 Funcionalidades

### Tipos de Relatórios
- ✅ Relatório de Vendas
- ✅ Relatório de Estoque
- ✅ Relatório Financeiro
- ✅ Relatório de Serviços
- ✅ Relatório de Clientes
- ✅ Relatório de Veículos

### Formatos de Saída
- ✅ PDF
- ✅ Excel (CSV)
- ✅ JSON

### Filtros e Períodos
- ✅ Filtro por data (início e fim)
- ✅ Filtros específicos por tipo de relatório
- ✅ Agrupamento de dados
- ✅ Resumo estatístico

### Integrações
- ✅ Integração com `FeatureFlagsModule` (controle de features)

## 📁 Estrutura

```
reports/
├── dto/
│   ├── generate-report.dto.ts     # DTO para geração
│   ├── report-response.dto.ts     # DTO de resposta
│   ├── report-type.enum.ts        # Enum de tipo
│   ├── report-format.enum.ts      # Enum de formato
│   └── index.ts
├── reports.controller.ts           # Controller REST
├── reports.service.ts              # Service com lógica de negócio
├── reports.module.ts               # Módulo NestJS
└── reports.service.spec.ts         # Testes unitários
```

## 🔌 Endpoints

### Relatórios

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/reports/generate` | Gerar relatório |

## 📊 Tipos de Relatórios

### SALES - Relatório de Vendas
- Total de vendas por período
- Vendas por serviço/peça
- Vendas por cliente
- Vendas por veículo
- Gráficos de tendência

### INVENTORY - Relatório de Estoque
- Estoque atual
- Movimentações de estoque
- Peças com estoque baixo
- Peças mais utilizadas
- Fornecedores

### FINANCIAL - Relatório Financeiro
- Receitas e despesas
- Faturas emitidas/pagas
- Pagamentos recebidos
- Fluxo de caixa
- Análise de lucratividade

### SERVICES - Relatório de Serviços
- Ordens de serviço por período
- Serviços mais realizados
- Tempo médio de serviço
- Taxa de conclusão
- Análise de eficiência

### CUSTOMERS - Relatório de Clientes
- Clientes cadastrados
- Clientes mais frequentes
- Histórico de serviços
- Valor total por cliente
- Análise de retenção

### VEHICLES - Relatório de Veículos
- Veículos cadastrados
- Veículos por marca/modelo
- Histórico de serviços
- Análise de manutenção preventiva

## 📄 Formatos de Saída

- `PDF` - Documento PDF formatado
- `EXCEL` - Planilha Excel (CSV)
- `JSON` - Dados em formato JSON

## 🔐 Autenticação e Autorização

- ✅ Requer autenticação JWT
- ✅ Requer tenant válido (via `TenantGuard`)
- ✅ Roles permitidas: `admin`, `manager`, `accountant`

## 📝 Exemplo de Uso

### Gerar Relatório de Vendas

```typescript
POST /api/reports/generate
{
  "type": "SALES",
  "format": "PDF",
  "startDate": "2025-12-01",
  "endDate": "2025-12-31",
  "filters": {
    "serviceOrderStatus": "COMPLETED"
  }
}
```

### Gerar Relatório de Estoque

```typescript
POST /api/reports/generate
{
  "type": "INVENTORY",
  "format": "EXCEL",
  "filters": {
    "lowStock": true
  }
}
```

### Gerar Relatório Financeiro

```typescript
POST /api/reports/generate
{
  "type": "FINANCIAL",
  "format": "PDF",
  "startDate": "2025-12-01",
  "endDate": "2025-12-31"
}
```

## 🧪 Testes

- ✅ Testes unitários implementados
- ✅ Cobertura: 64%+
- ✅ Testa geração de relatórios
- ✅ Testa validações de filtros
- ✅ Testa diferentes formatos

## 🔗 Integrações

### FeatureFlagsModule
- Controle de features relacionadas a relatórios
- Limites por plano de assinatura
- Controle de acesso a relatórios avançados

## ⚠️ Regras de Negócio

1. **Validação de Datas:**
   - Data inicial não pode ser maior que data final
   - Período máximo de 1 ano para relatórios detalhados

2. **Filtros:**
   - Filtros específicos por tipo de relatório
   - Validação de filtros antes de gerar relatório

3. **Formato:**
   - PDF para visualização e impressão
   - Excel para análise de dados
   - JSON para integração com outros sistemas

4. **Performance:**
   - Relatórios grandes podem ser gerados de forma assíncrona
   - Cache de relatórios frequentes

## 📚 Dependências

- `@database/prisma.module` - Acesso ao banco de dados
- `@core/feature-flags/feature-flags.module` - Controle de features

## 🚀 Próximos Passos

- [ ] Geração assíncrona de relatórios grandes
- [ ] Cache de relatórios
- [ ] Agendamento de relatórios
- [ ] Envio automático por email
- [ ] Gráficos e visualizações
- [ ] Exportação para outros formatos (Word, HTML)

