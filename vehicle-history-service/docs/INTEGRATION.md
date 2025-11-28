# Guia de Integração - Vehicle History Service

**Versão:** 1.0

---

## 🔗 Integração com Workshops

### Atualizar Histórico (Escrita)

Quando uma oficina finaliza um RO, deve atualizar o Vehicle History:

```typescript
POST https://vehicle-history.autovida.com/api/vehicle-history/update
Headers: {
  Authorization: Bearer <api_key>,
  X-Tenant-Id: <tenant_id>
}
Body: {
  vin: "ABC123",
  placa: "ABC1234",
  service: {
    type: "Revisão Completa",
    date: "2024-01-15T10:30:00Z",
    mileage: 50000,
    partsReplaced: ["Óleo", "Filtro de Óleo", "Filtro de Ar"],
    cost: 350.00,
    workshopId: "workshop-123"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "vehicleHistoryId": "vh-123",
  "healthScore": 92,
  "message": "Histórico atualizado com sucesso"
}
```

---

## 🔗 Integração com Dealers

### Consultar Histórico (Leitura)

Quando um dealer precisa consultar histórico de um veículo:

```typescript
GET https://vehicle-history.autovida.com/api/vehicle-history/query?vin=ABC123
Headers: {
  Authorization: Bearer <api_key>,
  X-Tenant-Id: <tenant_id>
}
```

**Resposta:**
```json
{
  "vehicleHistoryId": "vh-123",
  "vin": "ABC123",
  "placa": "ABC1234",
  "healthScore": 92,
  "services": [
    {
      "date": "2024-01-15",
      "workshop": "Oficina ABC",
      "type": "Revisão Completa",
      "mileage": 50000,
      "parts": ["Óleo", "Filtro"]
    }
  ],
  "accidents": [],
  "ownershipHistory": [...],
  "cachedUntil": "2024-02-14T10:30:00Z"
}
```

---

## 🔐 Autenticação

### API Keys

Cada tenant recebe uma API key única:

```typescript
Headers: {
  Authorization: Bearer <api_key>
}
```

### Rate Limiting

- **Starter/Basic:** 100 req/min
- **Professional/Premium:** 500 req/min
- **Enterprise:** 1000 req/min

---

## 📊 Health Score

O Health Score é calculado automaticamente baseado em:

- **Acidentes reportados:** -20 pontos por acidente grave
- **Manutenção:** +25 pontos se histórico completo
- **Proprietários:** -5 pontos por proprietário adicional
- **Título:** -30 pontos se salvage/rebuilt

**Range:** 0-100

---

## 💾 Cache

Consultas são cacheadas por **30 dias** (configurável).

- Se cache HIT: retorna imediatamente (não decrementa créditos)
- Se cache MISS: consulta fontes e cacheia resultado

---

**Documento criado em:** [Data]  
**Versão:** 1.0

