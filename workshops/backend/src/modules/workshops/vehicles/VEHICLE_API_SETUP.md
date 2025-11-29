# 🔌 Configuração de API de Consulta de Veículos

Este documento explica como configurar a integração com APIs públicas para consulta automática de dados de veículos por placa ou RENAVAN.

## ⚠️ Importante: DETRAN não oferece API pública

**O DETRAN/Senatran NÃO oferece API pública gratuita para desenvolvedores.**

A API oficial **WSDenatran** existe, mas:
- ✅ É apenas para **órgãos públicos** e empresas específicas
- ✅ Requer **termo de autorização** com o Denatran
- ✅ Requer **contratação** com SERPRO
- ❌ **NÃO é acessível** para desenvolvedores/startups em geral

**As APIs listadas abaixo são de terceiros** (não oficiais do DETRAN) que fazem consultas ou têm parcerias.

## 📋 APIs Disponíveis no Brasil

### 🆓 **APIS GRATUITAS**

#### 1. **API Brasil** ⭐ (Gratuita - Recomendada para começar)
- **URL:** https://apibrasil.com.br
- **Documentação:** https://apibrasil.com.br/docs
- **Suporta:** Placa
- **Dados retornados:** Modelo, ano, cor, situação cadastral
- **Preço:** 🆓 **GRATUITA** - 7 consultas por dia
- **Limitação:** 7 consultas/dia no plano gratuito
- **Vantagem:** Não precisa de cadastro para começar

#### 2. **Placa Fipe API** (GitHub)
- **URL:** https://github.com/jetherbsf/placa-fipe-api
- **Suporta:** Placa
- **Dados retornados:** Marca, modelo, ano, cor, situação, dados FIPE
- **Preço:** 🆓 **GRATUITA** - 50 consultas por mês
- **Limitação:** Apenas 50 consultas/mês
- **Vantagem:** Open source

#### 3. **Portal Gov.br (Senatran)** - Apenas Consulta Manual
- **URL:** https://www.gov.br/pt-br/servicos/consultar-online-os-dados-de-placa-veicular
- **Suporta:** Placa (requer QR Code da placa Mercosul)
- **Dados retornados:** Marca, modelo, ano, situação
- **Preço:** 🆓 **GRATUITA** (apenas consulta manual)
- **Limitação:** 
  - ❌ **NÃO oferece API pública**
  - Requer autenticação gov.br
  - Apenas para consulta manual no site
  - Não pode ser automatizada

### 💰 **APIS PAGAS (Terceiros)**

> ⚠️ **IMPORTANTE:** O DETRAN/Senatran **NÃO oferece API pública gratuita**. A API oficial (WSDenatran) existe, mas:
> - É apenas para órgãos públicos e empresas específicas
> - Requer termo de autorização com o Denatran
> - Requer contratação com SERPRO
> - Não é acessível para desenvolvedores/startups em geral
>
> As APIs abaixo são de **terceiros** que fazem consultas ou têm parcerias, **não são oficiais do DETRAN**.

#### 1. **PlacaAPI.com** ⭐ (Recomendado para produção)
- **URL:** https://placaapi.com
- **Documentação:** https://placaapi.com/docs
- **Suporta:** Placa e RENAVAN
- **Dados retornados:** Marca, modelo, ano, cor, VIN, combustível, etc.
- **Preço:** 
  - 🆓 **10 consultas de teste gratuitas**
  - Depois: R$ 0,80 por consulta
  - Descontos para grandes volumes

#### 2. **Placas.app.br**
- **URL:** https://www.placas.app.br
- **Suporta:** Placa
- **Dados retornados:** Dados completos do DETRAN
- **Preço:** Consulte o site
- **Nota:** Consulta manual gratuita, API automatizada pode ter custos

#### 3. **Netrin**
- **URL:** https://docs.netrin.com.br
- **Suporta:** Placa
- **Dados retornados:** Marca, modelo, ano, cor, chassi
- **Preço:** Consulte o site

#### 4. **API Integra**
- **URL:** https://docs.apiintegra.com
- **Suporta:** Placa
- **Dados retornados:** Informações completas do veículo
- **Preço:** Consulte o site

## ⚙️ Configuração

### 🆓 Opção 1: API Gratuita (Recomendada para começar)

#### API Brasil - 7 consultas/dia grátis

Adicione no arquivo `.env`:

```env
# Usar API Brasil gratuita (7 consultas por dia)
VEHICLE_API_PROVIDER=api-brasil
VEHICLE_API_URL=https://apibrasil.com.br/api/v1
```

**Pronto!** O sistema já funcionará com 7 consultas gratuitas por dia.

#### Placa Fipe API - 50 consultas/mês grátis

```env
# Usar API gratuita do GitHub
VEHICLE_API_PROVIDER=placa-fipe
```

**Pronto!** O sistema já funcionará com 50 consultas gratuitas por mês.

### 💰 Opção 2: API Paga (Para produção)

#### PlacaAPI.com (10 consultas grátis de teste)

1. Registre-se em https://placaapi.com
2. Obtenha sua API Key
3. Adicione no arquivo `.env`:

```env
VEHICLE_API_PROVIDER=placaapi
VEHICLE_API_KEY=sua_api_key_aqui
VEHICLE_API_URL=https://api.placaapi.com/v1
```

#### API Customizada

```env
VEHICLE_API_PROVIDER=custom
VEHICLE_API_KEY=sua_api_key_aqui
VEHICLE_API_URL=https://sua-api.com/v1
```

### Passo 2: Configurar no .env

O código já está preparado! Basta configurar as variáveis de ambiente:

**Para API Brasil (7 consultas/dia grátis):**
```env
VEHICLE_API_PROVIDER=api-brasil
VEHICLE_API_URL=https://apibrasil.com.br/api/v1
```

**Para PlacaAPI.com (10 consultas grátis de teste):**
```env
VEHICLE_API_PROVIDER=placaapi
VEHICLE_API_KEY=sua_api_key
VEHICLE_API_URL=https://api.placaapi.com/v1
```

**Para API customizada:**
```env
VEHICLE_API_PROVIDER=custom
VEHICLE_API_KEY=sua_api_key
VEHICLE_API_URL=https://sua-api.com/v1
```

### Passo 3: Testar

1. Inicie o servidor backend
2. Teste o endpoint:
   ```bash
   curl -X GET "http://localhost:3001/api/vehicles/query/placa/ABC1234" \
     -H "Authorization: Bearer seu_token_jwt"
   ```

## 🎯 Funcionalidade no Frontend

Quando o usuário digitar uma placa completa (7 caracteres) ou RENAVAN completo (11 dígitos), o sistema automaticamente:

1. Faz uma requisição para o backend
2. O backend consulta a API externa
3. Os dados retornados preenchem automaticamente:
   - Marca
   - Modelo
   - Ano
   - Cor
   - VIN (se disponível)
   - Outros campos disponíveis

## ⚠️ Notas Importantes

### Sobre APIs do DETRAN

- ❌ **DETRAN/Senatran NÃO oferece API pública gratuita**
- ✅ A API oficial (WSDenatran) existe, mas é restrita a:
  - Órgãos públicos
  - Empresas específicas (fabricantes, seguradoras, etc.)
  - Requer termo de autorização e contratação com SERPRO
- ✅ As APIs listadas acima são de **terceiros** (não oficiais)
- ⚠️ Algumas podem fazer scraping ou ter parcerias com DETRANs estaduais

### Outras Considerações

- **Custos:** A maioria das APIs cobra por consulta. Considere implementar cache.
- **Rate Limits:** Verifique os limites de requisições por minuto/hora.
- **LGPD:** Certifique-se de que o uso está em conformidade com a LGPD.
- **Cache:** Recomenda-se implementar cache para evitar consultas repetidas.
- **Confiabilidade:** APIs de terceiros podem ter instabilidade ou mudanças de política.

## 🧪 Dados para Teste

### Exemplos de Dados Válidos (Fictícios para Testes)

**⚠️ IMPORTANTE:** Estes são exemplos de formato válido. Use dados reais apenas se tiver autorização.

#### Placa (Formato Brasileiro)
```
ABC1234  (formato antigo)
ABC1D23  (formato Mercosul)
DEF5678  (formato antigo)
GHI9J01  (formato Mercosul)
```

#### RENAVAN (11 dígitos)
```
12345678901
98765432109
11122233344
55566677788
```

#### VIN (17 caracteres - sem I, O, Q)
```
1HGBH41JXMN109186
2HGFC2F59KH501234
3VW2B7AJ5HM123456
4T1BF1FK5EU123456
5YJSA1E14HF123456
```

### Como Testar

1. **Teste de Placa:**
   ```bash
   curl -X GET "http://localhost:3001/api/vehicles/query/placa/ABC1234" \
     -H "Authorization: Bearer seu_token_jwt"
   ```

2. **Teste de RENAVAN:**
   ```bash
   curl -X GET "http://localhost:3001/api/vehicles/query/renavan/12345678901" \
     -H "Authorization: Bearer seu_token_jwt"
   ```

3. **Teste no Frontend:**
   - Acesse a página de criação de veículo
   - Digite uma placa completa (7 caracteres)
   - O sistema tentará buscar dados automaticamente
   - Se a API não estiver configurada, você pode preencher manualmente

### ⚠️ Nota sobre Dados Reais

- **NÃO use dados de veículos reais** sem autorização do proprietário
- **NÃO compartilhe dados reais** em logs ou documentação
- Para testes em produção, use dados de veículos próprios ou com autorização
- Respeite a LGPD ao lidar com dados de veículos

## 🔄 Próximos Passos

1. Implementar cache Redis para consultas recentes
2. Adicionar tratamento de erros mais robusto
3. Adicionar métricas de uso da API
4. Implementar fallback para múltiplas APIs

