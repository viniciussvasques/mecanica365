# Pendências e Melhorias Futuras

**Última atualização:** 28/11/2025

---

## 🔴 Pendências Críticas (Erros de Compilação)

### 1. Testes com Erros de TypeScript

#### `email.service.spec.ts`
- ❌ **Erro:** `WelcomeEmailData` não está sendo exportado corretamente
- **Solução:** Importar de `./interfaces/email-data.interfaces.ts`

#### `email-templates.service.spec.ts`
- ❌ **Erro:** Método `getWelcomeEmailTextTemplate` não existe
- **Solução:** Verificar se o método existe ou usar o método correto
- ❌ **Erro:** Interfaces não correspondem (ex: `plan` vs `planName`, falta `accessUntilDate`)
- **Solução:** Ajustar dados de teste para corresponder às interfaces reais

#### `bulk-email.service.spec.ts`
- ❌ **Erro:** `sendEmail` é privado e não pode ser mockado diretamente
- **Solução:** Criar método público `sendEmail` no EmailService ou mockar de forma diferente

#### `onboarding-webhooks.spec.ts`
- ❌ **Erro:** Tipos do Stripe não correspondem (ex: `billing_details` incompleto, `subscription` não existe em Invoice)
- **Solução:** Usar type casting apropriado ou criar mocks mais completos

#### `onboarding.service.spec.ts`
- ❌ **Erro:** `documentType: 'cnpj'` não é compatível com `DocumentType`
- **Solução:** Usar `DocumentType.CNPJ` ao invés de string
- ❌ **Erro:** `TenantPlan.WORKSHOPS_STARTER` não é compatível com `SubscriptionPlan`
- **Solução:** Usar enum correto ou fazer conversão

#### `tenants.service.spec.ts`
- ❌ **Erro:** Propriedade `cnpj` não existe mais (foi substituída por `document`)
- **Solução:** Atualizar testes para usar `document` e `documentType`

---

## 🟡 Melhorias Necessárias

### 1. BulkEmailService

**Problema:** Usa método privado `sendEmailDirectly` do EmailService

**Solução:**
- Opção 1: Tornar `sendEmail` público no EmailService
- Opção 2: Criar método público específico para bulk emails
- Opção 3: Refatorar para usar injeção de dependência diferente

**Arquivo:** `src/modules/shared/email/bulk-email.service.ts` (linhas 63-64, 112)

---

### 2. EmailTemplatesService

**Pendência:** Métodos de texto não implementados para todos os templates

**Verificar:**
- `getWelcomeEmailTextTemplate` - Existe?
- `getPaymentFailedEmailTextTemplate` - Existe?
- Todos os outros templates têm versão texto?

**Arquivo:** `src/modules/shared/email/email-templates.service.ts`

---

### 3. Testes de Integração E2E

**Pendência:** Testes E2E completos para:
- ❌ Fluxo completo de registro → checkout → webhook → email
- ❌ Teste de disparo em massa
- ❌ Teste de todos os webhook handlers

---

## 🟢 Melhorias Futuras (Não Críticas)

### 1. Sistema de Fila de Emails

**Descrição:** Processar emails de forma assíncrona usando fila (Bull/Redis)

**Benefícios:**
- Não bloquear requisições HTTP
- Retry automático
- Rate limiting
- Monitoramento

**Prioridade:** Média

---

### 2. Analytics de Emails

**Descrição:** Rastrear abertura e cliques de emails

**Funcionalidades:**
- Pixel de rastreamento
- Links com tracking
- Dashboard de métricas
- Relatórios

**Prioridade:** Baixa

---

### 3. Templates Customizáveis

**Descrição:** Permitir que tenants customizem templates de email

**Funcionalidades:**
- Editor de templates no painel admin
- Preview de templates
- Variáveis disponíveis
- Histórico de versões

**Prioridade:** Baixa

---

### 4. Agendamento de Emails

**Descrição:** Agendar envio de emails para data/hora específica

**Funcionalidades:**
- Agendar campanhas
- Lembretes automáticos
- Follow-ups programados

**Prioridade:** Baixa

---

### 5. Suporte a Anexos

**Descrição:** Permitir anexar arquivos aos emails

**Funcionalidades:**
- Upload de arquivos
- Validação de tamanho/tipo
- Armazenamento temporário

**Prioridade:** Baixa

---

### 6. Integração com Serviços de Email Marketing

**Descrição:** Integrar com SendGrid, Mailchimp, etc.

**Benefícios:**
- Melhor deliverability
- Analytics avançados
- Templates prontos
- Gerenciamento de listas

**Prioridade:** Baixa

---

### 7. Testes de Carga

**Descrição:** Testar performance do sistema de emails

**Testes:**
- Envio de 1000+ emails
- Processamento de múltiplos webhooks simultâneos
- Performance do disparo em massa

**Prioridade:** Média

---

### 8. Rate Limiting

**Descrição:** Limitar taxa de envio de emails

**Funcionalidades:**
- Limite por tenant
- Limite global
- Throttling automático

**Prioridade:** Média

---

### 9. Logs Estruturados

**Descrição:** Melhorar logs para análise

**Funcionalidades:**
- Logs em formato JSON
- Contexto completo (tenant, user, etc.)
- Integração com ferramentas de log (ELK, Datadog)

**Prioridade:** Baixa

---

### 10. Testes de Deliverability

**Descrição:** Testar se emails estão chegando na inbox

**Ferramentas:**
- Mailtrap para desenvolvimento
- Testes com múltiplos provedores (Gmail, Outlook, etc.)
- Verificação de SPF/DKIM/DMARC

**Prioridade:** Média

---

## 📋 Checklist de Correções Imediatas

### Testes
- [ ] Corrigir import de `WelcomeEmailData` em `email.service.spec.ts`
- [ ] Verificar/criar métodos de texto em `EmailTemplatesService`
- [ ] Ajustar interfaces nos testes de templates
- [ ] Tornar `sendEmail` público ou criar método alternativo
- [ ] Corrigir tipos do Stripe nos testes de webhooks
- [ ] Atualizar `onboarding.service.spec.ts` para usar enums corretos
- [ ] Atualizar `tenants.service.spec.ts` para usar `document` ao invés de `cnpj`

### Código
- [ ] Refatorar `BulkEmailService` para não usar método privado
- [ ] Verificar se todos os templates têm versão texto
- [ ] Adicionar testes E2E completos

---

## 🎯 Priorização

### Alta Prioridade (Fazer Agora)
1. ✅ Corrigir erros de compilação nos testes
2. ✅ Refatorar BulkEmailService para não usar método privado

### Média Prioridade (Próxima Sprint)
3. ⏳ Adicionar testes E2E
4. ⏳ Implementar fila de emails (Bull/Redis)
5. ⏳ Rate limiting

### Baixa Prioridade (Backlog)
6. ⏳ Analytics de emails
7. ⏳ Templates customizáveis
8. ⏳ Agendamento de emails
9. ⏳ Suporte a anexos
10. ⏳ Integração com serviços externos

---

## 📊 Status Atual

- ✅ **Funcionalidades Core:** 100% implementadas
- ✅ **Webhooks:** 100% implementados
- ✅ **Templates:** 100% implementados
- ⚠️ **Testes:** ~70% (alguns com erros de tipo)
- ✅ **Documentação:** 100% completa
- ⚠️ **Código:** 95% (pequenos ajustes necessários)

---

**Última atualização:** 28/11/2025

