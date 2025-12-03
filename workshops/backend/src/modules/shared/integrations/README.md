# 🔌 IntegrationsModule - Integrações Externas

## 📋 Descrição

Módulo responsável pela gestão de integrações externas, permitindo configuração via painel admin.

## 🎯 Funcionalidades

### CRUD de Integrações
- ✅ Criar integração (configuração via admin)
- ✅ Listar integrações
- ✅ Buscar integração por ID
- ✅ Atualizar integração
- ✅ Remover integração
- ✅ Testar integração

### Tipos de Integrações Suportados
- `RENAVAN` - Consulta RENAVAN
- `VIN` - Consulta VIN
- `CEP` - Consulta CEP
- `CUSTOM` - Integrações customizadas

## 📁 Estrutura

```
integrations/
├── dto/
│   ├── create-integration.dto.ts      # DTO para criação
│   ├── update-integration.dto.ts      # DTO para atualização
│   ├── integration-response.dto.ts    # DTO de resposta
│   ├── test-integration.dto.ts        # DTO para teste
│   └── index.ts
├── integrations.controller.ts          # Controller REST
├── integrations.service.ts            # Service com lógica de negócio
├── integrations.module.ts             # Módulo NestJS
└── README.md
```

## 🔌 Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/integrations` | Criar nova integração |
| `GET` | `/api/integrations` | Listar integrações |
| `GET` | `/api/integrations/:id` | Buscar integração por ID |
| `PATCH` | `/api/integrations/:id` | Atualizar integração |
| `DELETE` | `/api/integrations/:id` | Remover integração |
| `POST` | `/api/integrations/:id/test` | Testar integração |

## 🔐 Autenticação e Autorização

- ✅ Requer autenticação JWT
- ✅ Requer tenant válido (via `TenantGuard`)
- ✅ Roles permitidas: `admin` (apenas admin)

## 📝 Exemplo de Uso

### Criar Integração (via Painel Admin)

```typescript
POST /api/integrations
{
  "name": "API RENAVAN",
  "type": "RENAVAN",
  "apiUrl": "https://api.renavan.com/v1/consult",
  "apiKey": "sua-api-key-aqui",
  "config": {
    "timeout": 10000,
    "retry": 3
  },
  "isActive": true
}
```

### Testar Integração

```typescript
POST /api/integrations/:id/test
{
  "testData": {
    "renavan": "12345678901"
  }
}
```

## 🧪 Teste de Integração

O módulo permite testar integrações antes de ativá-las, verificando:
- ✅ Conexão com a API
- ✅ Autenticação (API Key)
- ✅ Formato de resposta
- ✅ Timeout e erros

## 🚀 Próximos Passos

- [ ] Criar schema Prisma para Integration
- [ ] Implementar cache de respostas
- [ ] Implementar rate limiting por integração
- [ ] Implementar webhooks para atualizações
- [ ] Dashboard de status das integrações

## 📚 Dependências

- `@database/prisma.module` - Acesso ao banco de dados
- `axios` - Cliente HTTP para APIs externas

## ⚠️ Status Atual

**Estrutura básica implementada com endpoints para configuração via admin.**  
Para armazenamento persistente, criar schema Prisma quando necessário.

