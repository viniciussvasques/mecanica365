# 📋 Módulo Vehicles (Veículos)

**Status:** ✅ Backend Completo | ⏳ Frontend Pendente

## 📋 Visão Geral

Módulo completo de gerenciamento de veículos para oficinas mecânicas. Suporta identificação por VIN, RENAVAN ou Placa, adequado para o mercado brasileiro.

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
vehicles/
├── dto/
│   ├── create-vehicle.dto.ts
│   ├── update-vehicle.dto.ts
│   ├── vehicle-response.dto.ts
│   ├── vehicle-filters.dto.ts
│   └── index.ts
├── vehicles.controller.ts
├── vehicles.service.ts
├── vehicles.module.ts
└── README.md
```

## 🔌 Endpoints da API

### `POST /api/vehicles`
Cria um novo veículo.

**Permissões:** `admin`, `manager`, `receptionist`

**Body:**
```json
{
  "customerId": "123e4567-e89b-12d3-a456-426614174000",
  "vin": "1HGBH41JXMN109186",
  "renavan": "12345678901",
  "placa": "ABC1234",
  "make": "Honda",
  "model": "Civic",
  "year": 2020,
  "color": "Branco",
  "mileage": 50000,
  "isDefault": false
}
```

**Validações:**
- Pelo menos um identificador obrigatório: VIN, RENAVAN ou Placa
- VIN: 17 caracteres alfanuméricos (exceto I, O, Q)
- RENAVAN: 11 dígitos numéricos
- Placa: Formato Mercosul (ABC1234) ou antigo (ABC1D23)
- Ano: Entre 1900 e ano atual + 1
- Quilometragem: Maior ou igual a 0

### `GET /api/vehicles`
Lista veículos com filtros e paginação.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

**Query Parameters:**
- `customerId` (opcional): Filtrar por cliente
- `placa` (opcional): Busca por placa (parcial)
- `vin` (opcional): Busca por VIN (parcial)
- `renavan` (opcional): Busca por RENAVAN (parcial)
- `make` (opcional): Busca por marca
- `model` (opcional): Busca por modelo
- `page` (opcional, padrão: 1): Número da página
- `limit` (opcional, padrão: 20): Itens por página (máx: 100)

**Resposta:**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### `GET /api/vehicles/:id`
Busca um veículo por ID.

**Permissões:** `admin`, `manager`, `mechanic`, `receptionist`

### `PATCH /api/vehicles/:id`
Atualiza um veículo.

**Permissões:** `admin`, `manager`, `receptionist`

**Body:** (todos os campos opcionais)
```json
{
  "vin": "1HGBH41JXMN109186",
  "renavan": "12345678901",
  "placa": "ABC1234",
  "make": "Honda",
  "model": "Civic",
  "year": 2020,
  "color": "Branco",
  "mileage": 50000,
  "isDefault": true
}
```

### `DELETE /api/vehicles/:id`
Remove um veículo.

**Permissões:** `admin`, `manager`

**Validações:**
- Não permite exclusão se houver ordens de serviço associadas

## 🔒 Regras de Negócio

### Identificadores
1. **Pelo menos um identificador obrigatório:**
   - VIN (Vehicle Identification Number) - 17 caracteres
   - RENAVAN (Registro Nacional de Veículos Automotores) - 11 dígitos
   - Placa - Formato Mercosul ou antigo

2. **Unicidade:**
   - VIN: Único no tenant (se fornecido)
   - RENAVAN: Único no tenant (se fornecido)
   - Placa: Única no tenant (se fornecida)

3. **Validações:**
   - VIN: Apenas letras e números (exceto I, O, Q)
   - RENAVAN: Apenas dígitos numéricos
   - Placa: Formato Mercosul (ABC1234) ou antigo (ABC1D23)

### Veículo Padrão
- Apenas um veículo pode ser marcado como `isDefault` por cliente
- Ao marcar um veículo como padrão, outros são automaticamente desmarcados

### Relacionamentos
- Veículo pertence a um cliente
- Não pode ser excluído se houver ordens de serviço associadas

## 📊 Modelo de Dados

### CustomerVehicle (Prisma)

```prisma
model CustomerVehicle {
  id         String   @id @default(uuid())
  customerId String
  vin        String?
  renavan    String?  @db.VarChar(11)
  placa      String?
  make       String?
  model      String?
  year       Int?
  color      String?
  mileage    Int?
  isDefault  Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@index([renavan])
  @@map("customer_vehicles")
}
```

## ✅ Checklist de Implementação

### Backend ✅

- [x] Schema Prisma atualizado (com RENAVAN)
- [x] Migration criada e aplicada
- [x] DTOs criados (Create, Update, Response, Filters)
- [x] Service implementado com CRUD completo
- [x] Regras de negócio implementadas
- [x] Validações de identificadores (VIN, RENAVAN, Placa)
- [x] Controller implementado com todos os endpoints
- [x] Guards e permissões configurados
- [x] Swagger documentado
- [x] Tratamento de erros
- [x] Logs de auditoria
- [x] Validações implementadas
- [ ] Testes unitários
- [ ] Testes de integração

### Frontend ⏳

- [ ] Estrutura de pastas criada
- [ ] Componentes base criados
- [ ] API client configurado
- [ ] Páginas de listagem implementadas
- [ ] Páginas de criação implementadas
- [ ] Páginas de edição implementadas
- [ ] Páginas de detalhes implementadas
- [ ] Formulários validados
- [ ] Formatação automática de VIN, RENAVAN e Placa
- [ ] Filtros e busca funcionando
- [ ] Paginação implementada
- [ ] Loading states
- [ ] Tratamento de erros
- [ ] Responsividade

## 🚀 Próximos Passos

1. **Testes Backend:**
   - Criar testes unitários para `VehiclesService`
   - Criar testes de integração para `VehiclesController`

2. **Frontend:**
   - Criar estrutura de pastas (`app/vehicles/`)
   - Implementar API client (`lib/api/vehicles.ts`)
   - Criar páginas de listagem, criação, edição e detalhes
   - Implementar formatação automática de identificadores
   - Adicionar validações client-side

3. **Melhorias:**
   - Integração com API FIPE para buscar dados do veículo
   - Integração com RENAVAN para validação
   - Histórico de alterações de quilometragem
   - Upload de fotos do veículo

## 📝 Notas Técnicas

### Identificadores no Brasil
- **VIN**: Nem todos os veículos no Brasil possuem VIN
- **RENAVAN**: Alternativa brasileira ao VIN, presente em todos os veículos
- **Placa**: Identificador mais comum, mas pode mudar entre proprietários

### Validação de Placa
- Formato Mercosul: `ABC1234` (3 letras + 1 número + 1 letra/número + 2 números)
- Formato Antigo: `ABC1234` (3 letras + 4 números)

### Validação de RENAVAN
- 11 dígitos numéricos
- Único por veículo no Brasil
- Obrigatório em veículos brasileiros

## 🔗 Relacionamentos

- **Customer**: Um veículo pertence a um cliente
- **ServiceOrder**: Um veículo pode ter múltiplas ordens de serviço
- **Appointment**: Um veículo pode ter múltiplos agendamentos

