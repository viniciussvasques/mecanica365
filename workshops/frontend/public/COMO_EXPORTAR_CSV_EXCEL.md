# 📥 Como Exportar Planilha como CSV (UTF-8) no Excel

## 🎯 Problema

Quando você exporta uma planilha do Excel diretamente como CSV, pode haver problemas de encoding, fazendo com que caracteres especiais (acentos) apareçam incorretamente (ex: `Ã³` ao invés de `ó`).

## ✅ Solução: Exportar como CSV UTF-8

### Método 1: Excel (Windows/Mac)

1. **Abra sua planilha no Excel**
2. **Clique em "Arquivo" > "Salvar Como"**
3. **Na janela de salvar:**
   - Escolha o formato: **"CSV UTF-8 (delimitado por vírgulas) (*.csv)"**
   - Ou: **"CSV (delimitado por vírgulas) (*.csv)"** e depois converta
4. **Clique em "Salvar"**

### Método 2: Google Sheets (Recomendado)

1. **Abra sua planilha no Google Sheets**
2. **Clique em "Arquivo" > "Fazer download" > "Valores separados por vírgula (.csv)"**
3. O arquivo será salvo automaticamente em UTF-8 ✅

### Método 3: LibreOffice Calc

1. **Abra sua planilha no LibreOffice Calc**
2. **Clique em "Arquivo" > "Salvar Como"**
3. **Escolha o formato: "CSV de Texto (.csv)"**
4. **Na janela de opções:**
   - Marque: **"Editar configurações de filtro"**
   - Clique em "OK"
5. **Na janela de configuração:**
   - Codificação de caracteres: **"Unicode (UTF-8)"**
   - Delimitador de campo: **"," (vírgula)**
6. **Clique em "OK"**

## 🔧 Se o Problema Persistir

### Correção Manual no Excel

1. **Abra o arquivo CSV no Bloco de Notas (Windows) ou TextEdit (Mac)**
2. **Clique em "Arquivo" > "Salvar Como"**
3. **Na parte inferior, escolha a codificação: "UTF-8"**
4. **Salve o arquivo**

### Usar o Parser do Sistema

O sistema agora corrige automaticamente os problemas de encoding mais comuns:
- `Ã³` → `ó`
- `Ã§` → `ç`
- `Ã£` → `ã`
- `Ã©` → `é`
- etc.

Mas é melhor exportar corretamente desde o início!

## 📋 Formato Esperado

Certifique-se de que sua planilha tenha estas colunas (na primeira linha):

```
Código, Nome, Descrição, Categoria, Marca, Quantidade, Quantidade Mínima, Preço Custo, Preço Venda, Localização, Ativo
```

### Exemplo:

```csv
Código,Nome,Descrição,Categoria,Marca,Quantidade,Quantidade Mínima,Preço Custo,Preço Venda,Localização,Ativo
PEC-001,Pastilha de Freio,Pastilha dianteira,Freios,Bosch,50,10,25.50,45.00,Estoque A,true
PEC-002,Filtro de Óleo,Filtro para motor,Filtros,Mann Filter,30,5,15.00,28.00,Estoque A,true
```

## ⚠️ Dicas Importantes

1. **Sempre use UTF-8** ao exportar CSV
2. **Não use ponto e vírgula (;)** como separador - use vírgula (,)
3. **Valores com vírgula** devem estar entre aspas: `"R$ 25,50"`
4. **Valores booleanos** podem ser: `true`, `false`, `sim`, `não`, `1`, `0`
5. **Primeira linha** deve ser o cabeçalho

## 🚀 Próximos Passos

Em breve, o sistema suportará importação direta de arquivos Excel (.xlsx, .xls) sem necessidade de conversão!

---

**Última atualização:** 2025-12-05

