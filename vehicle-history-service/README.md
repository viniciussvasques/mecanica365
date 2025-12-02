# Carvex - Histórico de Veículos do Brasil

**Versão:** 1.0  
**Status:** Em planejamento

---

## 🎯 Objetivo

Plataforma centralizada para gerenciamento de histórico de veículos. Hub que conecta Mecânica365 (Oficinas) e VitrineAuto (Dealers).

**Nome:** Carvex.app

---

## 📁 Estrutura

```
vehicle-history-service/
├── backend/          # NestJS Backend (API REST)
└── docs/             # Documentação
```

---

## 🚀 Stack Tecnológico

- **Framework:** NestJS 10+
- **Language:** TypeScript 5+
- **ORM:** Prisma 5+
- **Banco de Dados:** PostgreSQL 16+ (com PostGIS para geolocalização)
- **Cache:** Redis 7+ (cache regionalizado por estado)
- **Documentação:** Swagger/OpenAPI
- **Cloud:** AWS Brasil (São Paulo) para LGPD

---

## 🔧 Funcionalidades

### Núcleo do Sistema

1. **Consulta de Histórico**
   - Por Chassi (VIN)
   - Por Placa (antigo e Mercosul)
   - Por RENAVAM
   - Por CPF/CNPJ (apenas para usuários autorizados)
   - Consulta de débitos (Detran, IPVA, multas)
   - Histórico de leilão (se aplicável)
   - Cache regionalizado (TTL variável por tipo de dado)

2. **Atualização de Histórico**
   - Workshops podem escrever (serviços realizados)
   - Dealers podem ler (consulta completa)

3. **Health Score**
   - Cálculo automático (0-100)
   - Baseado em: acidentes, manutenção, proprietários, título

4. **Geração de PDF**
   - Relatório completo
   - Branded (AutoVida)

5. **APIs**
   - REST API
   - Webhooks (opcional)
   - Rate limiting por tenant

---

## 🔗 Integrações

### Fontes de Dados (Entrada)

- **Oficinas Credenciadas:** Atualização em tempo real via API
- **Detran:** Integração com sistemas estaduais
- **SINESP:** Consulta de roubo/furto
- **Renavam:** Dados do veículo
- **SERPRO:** Consulta de restrições
- **Leilões:** Histórico de leilão (se houver)
- **Seguradoras:** Histórico de sinistros (parcerias)

### Saída (Leitura)

- **Lojas e Concessionárias:** Relatório completo com score
- **Pessoas Físicas:** Relatório simplificado (conforme LGPD)
- **Bancos e Financeiras:** Módulo específico para análise de crédito
- **Seguradoras:** Módulo de análise de risco
- **Órgãos Públicos:** Acesso restrito e auditável

---

## 📊 Modelo de Dados

```prisma
model VehicleHistory {
  id          String   @id @default(uuid())
  vin         String?
  placa       String?
  renavam     String?
  
  data        Json     // Histórico completo (JSON)
  scoreBrasil Int      // 0-1000 (escala brasileira)
  statusDetran String   // Status no Detran
  restricoes  Json     // Restrições financeiras e judiciais
  sinistros   Json[]   // Histórico de sinistros
  
  cachedUntil DateTime // TTL do cache
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model HistoryUpdate {
  id          String   @id @default(uuid())
  vehicleHistoryId String
  source      String   // detran, oficina, financeira, seguradora, leilao
  sourceId    String   // ID do RO, consulta, etc.
  data        Json     // Dados da atualização
  createdAt   DateTime @default(now())
}
```

---

## 🔐 Segurança e LGPD

- **Autenticação:** Certificado Digital + 2FA
- **LGPD:** 
  - Anonimização de dados sensíveis
  - Portabilidade de dados
  - Relatório de acesso
- **Auditoria:** 
  - Log completo de consultas
  - Blockchain para histórico imutável
  - Compliance com regulamentações do Bacen

---

## 📋 APIs Principais

### Consulta

```typescript
GET /api/vehicle-history/query?vin=ABC123
GET /api/vehicle-history/query?placa=ABC1234
```

### Atualização (Workshops)

```typescript
POST /api/vehicle-history/update
Body: {
  vin: "ABC123",
  service: {
    type: "Revisão",
    date: "2024-01-15",
    mileage: 50000,
    parts: ["Óleo", "Filtro"]
  }
}
```

### Health Score

```typescript
GET /api/vehicle-history/:id/health-score
```

### PDF

```typescript
GET /api/vehicle-history/:id/pdf
```

---

## 🚀 Roteiro de Implementação

### Fase 1: Núcleo (3 meses)
- [ ] Integração com Detran/Estados
- [ ] Módulo de consulta de débitos
- [ ] Sistema de score brasileiro

### Fase 2: Fontes de Dados (2 meses)
- [ ] Conexão com SERPRO
- [ ] Integração com SINESP
- [ ] Parcerias com seguradoras

### Fase 3: Plataforma (3 meses)
- [ ] Portal do cliente
- [ ] APIs para parceiros
- [ ] Módulo de relatórios LGPD

### Fase 4: Expansão (contínuo)
- [ ] Inteligência de mercado
- [ ] Previsão de valor de revenda
- [ ] Análise de histórico de manutenção

---

## 📚 Documentação

- [API Documentation](./docs/API.md)
- [Integration Guide](./docs/INTEGRATION.md)
- [Deployment Guide](./docs/DEPLOY.md)

---

**Documento criado em:** [Data]  
**Versão:** 1.0

