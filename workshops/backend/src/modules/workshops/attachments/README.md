# 📎 AttachmentsModule

**Módulo de Gerenciamento de Anexos e Arquivos**

## 📋 Descrição

O `AttachmentsModule` é responsável por gerenciar upload, armazenamento e organização de arquivos e fotos relacionados a orçamentos, ordens de serviço, clientes e veículos.

## 🎯 Responsabilidades

- Upload de arquivos (fotos e documentos)
- Armazenamento local de arquivos
- Organização por tipo e relacionamento
- Validação de tipos de arquivo
- Remoção de arquivos (físico + registro)

## 📦 Tipos de Anexos

O módulo suporta os seguintes tipos de anexos:

- `photo_before`: Foto antes do serviço
- `photo_during`: Foto durante o serviço
- `photo_after`: Foto após o serviço
- `document`: Documento (PDF, DOC, DOCX)

## 🔗 Relacionamentos

Os anexos podem estar relacionados a:

- **Quote** (`quoteId`): Orçamento
- **ServiceOrder** (`serviceOrderId`): Ordem de serviço
- **Customer** (`customerId`): Cliente
- **Vehicle** (`vehicleId`): Veículo

**Nota:** Pelo menos um relacionamento deve ser fornecido ao criar um anexo.

## 🛠️ Endpoints

### POST `/api/attachments`
Upload de um novo anexo.

**Body (multipart/form-data):**
- `file` (obrigatório): Arquivo a ser enviado
- `type` (obrigatório): Tipo do anexo (`photo_before`, `photo_during`, `photo_after`, `document`)
- `quoteId` (opcional): ID do orçamento
- `serviceOrderId` (opcional): ID da ordem de serviço
- `customerId` (opcional): ID do cliente
- `vehicleId` (opcional): ID do veículo
- `description` (opcional): Descrição do anexo

**Resposta:**
```json
{
  "id": "uuid",
  "type": "photo_before",
  "fileName": "attachment-1234567890-123456789.jpg",
  "originalName": "motor-antes.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 1024000,
  "filePath": "attachments/tenant-id/attachment-1234567890-123456789.jpg",
  "url": "/uploads/attachments/tenant-id/attachment-1234567890-123456789.jpg",
  "quoteId": "uuid",
  "createdAt": "2025-12-01T10:00:00.000Z",
  "updatedAt": "2025-12-01T10:00:00.000Z"
}
```

### GET `/api/attachments`
Lista anexos com filtros e paginação.

**Query Parameters:**
- `type` (opcional): Filtrar por tipo
- `quoteId` (opcional): Filtrar por orçamento
- `serviceOrderId` (opcional): Filtrar por ordem de serviço
- `customerId` (opcional): Filtrar por cliente
- `vehicleId` (opcional): Filtrar por veículo
- `startDate` (opcional): Data inicial (ISO 8601)
- `endDate` (opcional): Data final (ISO 8601)
- `page` (opcional): Página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20, máximo: 100)

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

### GET `/api/attachments/:id`
Busca um anexo específico por ID.

**Resposta:**
```json
{
  "id": "uuid",
  "type": "photo_before",
  ...
}
```

### PATCH `/api/attachments/:id`
Atualiza um anexo (metadados apenas, não o arquivo).

**Body:**
```json
{
  "type": "photo_after",
  "description": "Nova descrição",
  "quoteId": "uuid",
  ...
}
```

### DELETE `/api/attachments/:id`
Remove um anexo (arquivo físico + registro no banco).

**Resposta:** 204 No Content

## 📁 Estrutura de Armazenamento

Os arquivos são armazenados em:
```
uploads/
  attachments/
    {tenantId}/
      attachment-{timestamp}-{random}.{ext}
```

A URL pública é:
```
/uploads/attachments/{tenantId}/attachment-{timestamp}-{random}.{ext}
```

## ✅ Validações

### Tipos de Arquivo

- **Fotos** (`photo_before`, `photo_during`, `photo_after`):
  - Aceita: JPEG, JPG, PNG, GIF, WebP
  - Tamanho máximo: 10MB

- **Documentos** (`document`):
  - Aceita: PDF, DOC, DOCX
  - Tamanho máximo: 10MB

### Relacionamentos

- Pelo menos um relacionamento (`quoteId`, `serviceOrderId`, `customerId` ou `vehicleId`) deve ser fornecido.

## 🔄 Integrações Futuras

### Substituição de Arrays

Atualmente, os modelos `Quote` e `ServiceOrder` usam arrays `inspectionPhotos: String[]`. No futuro, estes devem ser substituídos por referências ao model `Attachment`:

**Antes:**
```prisma
model Quote {
  inspectionPhotos String[] // Array de URLs
}
```

**Depois:**
```prisma
model Quote {
  attachments Attachment[] // Relação com Attachment
}
```

### Migração de Dados

Quando a migração for implementada:
1. Criar migration do Prisma para remover `inspectionPhotos` array
2. Migrar dados existentes (URLs → Attachment records)
3. Atualizar DTOs e Services para usar `attachments` ao invés de `inspectionPhotos`

## 🧪 Testes

### Testes Unitários
- ✅ Criar anexo
- ✅ Listar anexos
- ✅ Buscar anexo
- ✅ Atualizar anexo
- ✅ Remover anexo
- ✅ Validação de tipos
- ✅ Validação de relacionamentos

### Testes de Integração
- ✅ Upload de arquivo
- ✅ Servir arquivo estático
- ✅ Integração com Quotes
- ✅ Integração com ServiceOrders

## 📝 Notas Importantes

1. **Armazenamento Local**: Atualmente usa armazenamento local. Para produção, considere usar S3 ou similar.

2. **Segurança**: Os arquivos são servidos estaticamente. Considere adicionar autenticação para acesso aos arquivos.

3. **Limpeza**: Arquivos órfãos não são removidos automaticamente. Considere implementar um job de limpeza.

4. **Quota**: Não há limite de quota por tenant. Considere implementar limites baseados no plano.

## 🔗 Dependências

- `PrismaModule`: Acesso ao banco de dados
- `@nestjs/platform-express`: Upload de arquivos
- `multer`: Processamento de multipart/form-data

## 📚 Referências

- [NestJS File Upload](https://docs.nestjs.com/techniques/file-upload)
- [Multer Documentation](https://github.com/expressjs/multer)
- [Prisma Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)

---

**Última atualização:** 02/12/2025

