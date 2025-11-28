# Carvex - Vehicle History Platform

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
- **Database:** PostgreSQL 16+
- **Cache:** Redis 7+ (cache agressivo)
- **Documentation:** Swagger/OpenAPI

---

## 🔧 Funcionalidades

### Core

1. **Consulta de Histórico**
   - Por VIN
   - Por Placa
   - Por RENAVAM
   - Cache (TTL 30 dias)

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

### Entrada (Escrita)

- **Workshops:** Atualiza histórico ao finalizar RO
- **Parceiros:** APIs de consulta (Karfex, Detran, etc.)

### Saída (Leitura)

- **Dealers:** Consulta histórico completo
- **Workshops:** Consulta histórico (opcional, Enterprise)

---

## 📊 Modelo de Dados

```prisma
model VehicleHistory {
  id          String   @id @default(uuid())
  vin         String?
  placa       String?
  renavam     String?
  
  data        Json     // Histórico completo (JSON)
  healthScore Int      // 0-100
  
  cachedUntil DateTime // TTL do cache
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model HistoryUpdate {
  id          String   @id @default(uuid())
  vehicleHistoryId String
  source      String   // workshop, dealer, partner
  sourceId    String   // ID do RO, consulta, etc.
  data        Json     // Dados da atualização
  createdAt   DateTime @default(now())
}
```

---

## 🔐 Autenticação

- **API Keys:** Por tenant
- **Rate Limiting:** Por tenant e por plano
- **Webhooks:** HMAC signature

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

## 🚀 Roadmap

- [ ] Fase 1: API de Consulta
- [ ] Fase 2: Cache Layer
- [ ] Fase 3: Health Score
- [ ] Fase 4: Integração Workshops (escrita)
- [ ] Fase 5: Integração Dealers (leitura)
- [ ] Fase 6: Geração de PDF

---

## 📚 Documentação

- [API Documentation](./docs/API.md)
- [Integration Guide](./docs/INTEGRATION.md)
- [Deployment Guide](./docs/DEPLOY.md)

---

**Documento criado em:** [Data]  
**Versão:** 1.0

