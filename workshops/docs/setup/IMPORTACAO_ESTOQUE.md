# 📥 Importação de Estoque via Planilha

## 📋 Descrição

Funcionalidade para importar múltiplas peças de uma vez através de arquivo CSV, facilitando o cadastro em massa de estoque.

## 🎯 Funcionalidades

### ✅ Implementado

- **Upload de arquivo CSV**
- **Parser inteligente de CSV** (suporta aspas e vírgulas)
- **Validação de dados** antes da importação
- **Preview das peças** a serem importadas
- **Importação em lote** com tratamento de erros
- **Atualização automática** de peças existentes (por código)
- **Relatório de importação** com estatísticas
- **Template CSV** para download

## 📁 Arquivos Criados

### Backend
- `workshops/backend/src/modules/workshops/parts/dto/import-parts.dto.ts`
- Método `importParts()` em `parts.service.ts`
- Endpoint `POST /api/parts/import` em `parts.controller.ts`

### Frontend
- `workshops/frontend/components/ImportPartsModal.tsx`
- `workshops/frontend/public/template-parts.csv`
- Integração em `app/parts/page.tsx`

## 🔌 Endpoint

### POST `/api/parts/import`

**Autenticação:** Requerida (JWT + Tenant)

**Roles:** `admin`, `manager`, `receptionist`

**Body:**
```json
{
  "parts": [
    {
      "partNumber": "PEC-001",
      "name": "Pastilha de Freio",
      "description": "Pastilha dianteira",
      "category": "Freios",
      "brand": "Bosch",
      "quantity": 50,
      "minQuantity": 10,
      "costPrice": 25.50,
      "sellPrice": 45.00,
      "location": "Estoque A",
      "isActive": true
    }
  ]
}
```

**Response:**
```json
{
  "total": 10,
  "created": 8,
  "updated": 2,
  "errors": 0,
  "errorDetails": []
}
```

## 📝 Formato do CSV

### Colunas Suportadas

O parser reconhece as seguintes colunas (case-insensitive):

| Coluna CSV | Campo | Obrigatório | Tipo |
|------------|-------|-------------|------|
| `Código`, `Codigo`, `PartNumber`, `part_number` | `partNumber` | Não | String |
| `Nome`, `Name` | `name` | **Sim** | String |
| `Descrição`, `Descricao`, `Description` | `description` | Não | String |
| `Categoria`, `Category` | `category` | Não | String |
| `Marca`, `Brand` | `brand` | Não | String |
| `Fornecedor`, `SupplierId`, `supplier_id` | `supplierId` | Não | String (UUID) |
| `Quantidade`, `Quantity`, `Qtd` | `quantity` | Não (padrão: 0) | Number |
| `Quantidade Mínima`, `Quantidade Minima`, `MinQuantity`, `min_quantity` | `minQuantity` | Não (padrão: 0) | Number |
| `Preço Custo`, `Preco Custo`, `CostPrice`, `cost_price` | `costPrice` | **Sim** | Number |
| `Preço Venda`, `Preco Venda`, `SellPrice`, `sell_price` | `sellPrice` | **Sim** | Number |
| `Localização`, `Localizacao`, `Location` | `location` | Não | String |
| `Ativo`, `IsActive`, `is_active` | `isActive` | Não (padrão: true) | Boolean |

### Exemplo de CSV

```csv
Código,Nome,Descrição,Categoria,Marca,Quantidade,Quantidade Mínima,Preço Custo,Preço Venda,Localização,Ativo
PEC-001,Pastilha de Freio Dianteira,Pastilha de freio para eixo dianteiro,Freios,Bosch,50,10,25.50,45.00,Estoque A - Prateleira 1,true
PEC-002,Filtro de Óleo,Filtro de óleo para motor,Filtros,Mann Filter,30,5,15.00,28.00,Estoque A - Prateleira 2,true
PEC-003,Óleo Motor 5W30,Óleo sintético 5W30,Lubrificantes,Shell,20,5,35.00,55.00,Estoque B - Prateleira 1,true
```

## 🔄 Fluxo de Importação

1. **Usuário clica em "Importar Planilha"** na página de peças
2. **Modal de importação abre** com opção de upload
3. **Usuário seleciona arquivo CSV**
4. **Sistema processa e valida** o arquivo
5. **Preview é exibido** mostrando:
   - Total de linhas
   - Linhas válidas
   - Linhas com erros
   - Detalhes de cada linha
6. **Usuário confirma importação**
7. **Sistema processa em lote**:
   - Cria novas peças
   - Atualiza peças existentes (se `partNumber` já existir)
   - Registra erros
8. **Relatório final** é exibido com estatísticas

## ⚙️ Regras de Negócio

### Validações

1. **Nome obrigatório:** Cada peça deve ter um nome
2. **Preços obrigatórios:** `costPrice` e `sellPrice` são obrigatórios
3. **Números válidos:** Quantidades e preços devem ser números válidos >= 0
4. **Código único:** Se `partNumber` já existir, a peça será atualizada ao invés de criada

### Comportamento

- **Peças novas:** Criadas normalmente
- **Peças existentes:** Se `partNumber` já existe, a peça é atualizada com os novos dados
- **Erros:** Linhas com erro são ignoradas, mas registradas no relatório
- **Valores padrão:**
  - `quantity`: 0 (se não informado)
  - `minQuantity`: 0 (se não informado)
  - `isActive`: true (se não informado)

## 🎨 Interface

### Botão de Importação

Localizado na página de peças (`/parts`), ao lado do botão "Nova Peça".

### Modal de Importação

- **Upload de arquivo** com validação de tipo (.csv)
- **Link para template** CSV de exemplo
- **Preview em tabela** com status de validação
- **Contador de peças válidas/inválidas**
- **Botão de importação** (habilitado apenas se houver peças válidas)
- **Relatório final** após importação

## 📊 Estatísticas de Importação

Após a importação, o sistema exibe:

- **Total processado:** Número total de linhas
- **Criadas:** Peças novas criadas
- **Atualizadas:** Peças existentes atualizadas
- **Erros:** Número de linhas com erro
- **Detalhes dos erros:** Lista de erros por linha

## 🚀 Como Usar

1. Acesse a página de **Peças** (`/parts`)
2. Clique no botão **"📥 Importar Planilha"**
3. Baixe o template CSV (opcional) para ver o formato
4. Preencha o CSV com suas peças
5. Faça upload do arquivo
6. Revise o preview das peças
7. Clique em **"Importar X Peças"**
8. Aguarde o processamento
9. Revise o relatório final

## ⚠️ Observações

- O arquivo CSV deve usar **codificação UTF-8**
- **Aspas duplas** são suportadas para campos com vírgulas
- **Separador decimal** pode ser ponto (.) ou vírgula (,)
- **Valores booleanos** aceitam: `true`, `false`, `sim`, `não`, `1`, `0`
- **Limite recomendado:** Até 1000 peças por importação para melhor performance

## 🔧 Melhorias Futuras

- [ ] Suporte a arquivos Excel (.xlsx)
- [ ] Importação assíncrona para grandes volumes
- [ ] Preview com edição inline
- [ ] Mapeamento customizado de colunas
- [ ] Validação de fornecedores antes da importação
- [ ] Histórico de importações
- [ ] Exportação de template com dados existentes

---

**Última atualização:** 2025-12-05

