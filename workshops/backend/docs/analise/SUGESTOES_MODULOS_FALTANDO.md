# 💡 Sugestões de Módulos e Funcionalidades Faltando

**Data:** 30/11/2025  
**Objetivo:** Identificar funcionalidades importantes que podem estar faltando antes de implementar os módulos planejados

---

## 🔴 Módulos Críticos Faltando (Alta Prioridade)

### 1. **AuditModule (Auditoria/Logs de Ação)**
- **Status:** ❌ Não implementado
- **Prioridade:** 🔴 Crítica
- **Motivo:** 
  - Mencionado na documentação mas não implementado
  - Essencial para compliance (LGPD, SOC 2)
  - Rastreabilidade de ações dos usuários
  - Necessário para segurança e troubleshooting
- **Funcionalidades:**
  - Log de todas as ações (CREATE, UPDATE, DELETE)
  - Log de acessos a dados sensíveis
  - Log de alterações de permissões
  - Log de exportações de dados
  - Retenção configurável (2 anos recomendado)
  - Busca e filtros de logs
  - Exportação de logs
- **Schema Prisma:**
  ```prisma
  model AuditLog {
    id          String   @id @default(uuid())
    tenantId    String?
    userId      String?
    action      String   // CREATE, UPDATE, DELETE, VIEW, EXPORT
    resourceType String? // Customer, Quote, ServiceOrder, etc.
    resourceId  String?
    changes     Json?    // Before/After
    ipAddress   String?
    userAgent   String?
    createdAt   DateTime @default(now())
    
    @@index([tenantId, createdAt])
    @@index([userId, createdAt])
    @@index([resourceType, resourceId])
  }
  ```

### 2. **JobsModule / QueueModule (Fila de Tarefas)**
- **Status:** ❌ Não implementado
- **Prioridade:** 🔴 Crítica
- **Motivo:**
  - Processamento assíncrono de tarefas pesadas
  - Envio de emails em massa
  - Geração de relatórios
  - Processamento de webhooks
  - Evita timeout em operações longas
- **Tecnologia Sugerida:** Bull + Redis
- **Funcionalidades:**
  - Fila de jobs
  - Retry automático
  - Rate limiting
  - Priorização de jobs
  - Monitoramento de filas
  - Dead letter queue
- **Casos de Uso:**
  - Envio de emails em massa
  - Geração de PDFs grandes
  - Processamento de imports
  - Sincronização com APIs externas
  - Limpeza de dados antigos

### 3. **RateLimitingModule (Limite de Requisições)**
- **Status:** ❌ Não implementado
- **Prioridade:** 🔴 Crítica
- **Motivo:**
  - Proteção contra abuso
  - Controle de custos (APIs externas)
  - Melhor experiência do usuário
  - Mencionado na documentação mas não implementado
- **Funcionalidades:**
  - Rate limiting por tenant
  - Rate limiting por usuário
  - Rate limiting por endpoint
  - Rate limiting por IP
  - Diferentes limites por plano
  - Headers de rate limit (X-RateLimit-*)
- **Tecnologia:** @nestjs/throttler ou custom com Redis

### 4. **WebhooksModule (Webhooks Externos)**
- **Status:** ❌ Não implementado
- **Prioridade:** 🔴 Alta
- **Motivo:**
  - Integração com sistemas externos
  - Notificações em tempo real
  - Mencionado na documentação mas não implementado
- **Funcionalidades:**
  - Configuração de webhooks por tenant
  - Eventos: `quote.created`, `service_order.completed`, `invoice.issued`
  - Assinatura HMAC para segurança
  - Retry automático
  - Log de tentativas
  - Dashboard de webhooks

---

## 🟡 Módulos Importantes (Média Prioridade)

### 5. **FileStorageModule (Armazenamento de Arquivos)**
- **Status:** ⚠️ Parcial (só logo upload)
- **Prioridade:** 🟡 Média
- **Funcionalidades Faltando:**
  - Upload de múltiplos arquivos
  - Categorização de arquivos
  - Compressão de imagens
  - Validação de tipos
  - Quota por tenant
  - CDN integration (futuro)
  - Backup de arquivos
- **Casos de Uso:**
  - Fotos de veículos
  - Documentos de clientes
  - Fotos de diagnóstico
  - Anexos de emails
  - Comprovantes de pagamento

### 6. **ExportImportModule (Exportação/Importação)**
- **Status:** ❌ Não implementado
- **Prioridade:** 🟡 Média
- **Funcionalidades:**
  - Export de dados (CSV, Excel, JSON)
  - Import de dados (CSV, Excel)
  - Validação de dados importados
  - Template de import
  - Histórico de imports/exports
  - Processamento assíncrono (via JobsModule)
- **Casos de Uso:**
  - Migração de dados
  - Backup de dados
  - Integração com sistemas legados
  - Relatórios customizados

### 7. **TemplatesModule (Templates Customizáveis)**
- **Status:** ❌ Não implementado
- **Prioridade:** 🟡 Média
- **Funcionalidades:**
  - Templates de documentos (PDF)
  - Templates de emails
  - Templates de SMS
  - Editor visual (futuro)
  - Variáveis disponíveis
  - Preview de templates
  - Histórico de versões
- **Casos de Uso:**
  - Personalização de orçamentos
  - Personalização de faturas
  - Emails customizados
  - SMS customizados

### 8. **PaymentsModule (Pagamentos)**
- **Status:** ❌ Não implementado (mencionado no FeatureFlags)
- **Prioridade:** 🟡 Média
- **Funcionalidades:**
  - Múltiplas formas de pagamento
  - Integração com gateways (Stripe, Pagar.me)
  - Parcelamento
  - Controle de recebimentos
  - Relatórios financeiros
  - Integração com InvoicingModule

### 9. **DocumentsModule (Documentos)**
- **Status:** ❌ Não implementado (mencionado no FeatureFlags)
- **Prioridade:** 🟡 Média
- **Funcionalidades:**
  - Geração de documentos (PDF)
  - Armazenamento de documentos
  - Assinatura digital
  - Envio de documentos
  - Histórico de documentos
  - Templates de documentos

---

## 🟢 Módulos de Infraestrutura (Baixa Prioridade, mas Importantes)

### 10. **CacheModule (Cache Avançado)**
- **Status:** ⚠️ Redis configurado mas pouco usado
- **Prioridade:** 🟢 Baixa
- **Melhorias:**
  - Cache decorator (@Cacheable)
  - Cache invalidation automática
  - Cache warming
  - Cache statistics
  - TTL configurável por tipo de dado

### 11. **MonitoringModule (Monitoramento)**
- **Status:** ❌ Não implementado
- **Prioridade:** 🟢 Baixa
- **Funcionalidades:**
  - Métricas de performance
  - Health checks avançados
  - Alertas
  - Dashboard de métricas
  - Integração com Prometheus/Grafana (futuro)

### 12. **BackupModule (Backup Automático)**
- **Status:** ❌ Não implementado
- **Prioridade:** 🟢 Baixa
- **Funcionalidades:**
  - Backup automático do banco
  - Backup de arquivos
  - Agendamento de backups
  - Restauração de backups
  - Retenção configurável
  - Notificações de backup

### 13. **ActivityModule (Rastreamento de Atividade)**
- **Status:** ❌ Não implementado
- **Prioridade:** 🟢 Baixa
- **Funcionalidades:**
  - Timeline de atividades
  - Atividade recente do usuário
  - Atividade por recurso
  - Notificações de atividade
  - Feed de atividades

---

## 🔐 Módulos de Segurança e Compliance

### 14. **SecurityModule (Segurança Avançada)**
- **Status:** ⚠️ Básico implementado
- **Prioridade:** 🔴 Alta
- **Funcionalidades Faltando:**
  - MFA (Multi-Factor Authentication)
  - Login attempts tracking
  - IP whitelist/blacklist
  - Session management avançado
  - Password policy enforcement
  - Security headers
  - CORS configurável

### 15. **ComplianceModule (LGPD/Compliance)**
- **Status:** ❌ Não implementado
- **Prioridade:** 🟡 Média
- **Funcionalidades:**
  - Consentimento de dados
  - DSAR (Data Subject Access Request)
  - Right to be Forgotten
  - Privacy policy
  - Data processing agreement
  - Anonimização de dados
  - Exportação de dados do usuário

---

## 🔧 Melhorias em Módulos Existentes

### 16. **Interceptors (Melhorias)**
- **Status:** ⚠️ Diretório existe mas vazio
- **Sugestões:**
  - Logging interceptor (log de requests)
  - Transform interceptor (transformação de responses)
  - Timeout interceptor
  - Cache interceptor
  - Response time interceptor

### 17. **Health Checks (Melhorias)**
- **Status:** ✅ Básico implementado
- **Melhorias:**
  - Health check de dependências (DB, Redis, APIs externas)
  - Health check detalhado
  - Metrics endpoint
  - Readiness/Liveness probes

### 18. **API Versioning**
- **Status:** ❌ Não implementado
- **Sugestão:**
  - Versionamento de API (/api/v1/, /api/v2/)
  - Deprecation warnings
  - Versionamento de DTOs

---

## 📊 Resumo de Prioridades

### 🔴 Crítica (Implementar Antes dos Módulos Faltantes)
1. **AuditModule** - Essencial para compliance e segurança
2. **JobsModule** - Necessário para operações assíncronas
3. **RateLimitingModule** - Proteção e controle de custos
4. **SecurityModule (MFA)** - Segurança avançada

### 🟡 Alta (Implementar Junto com Módulos Faltantes)
5. **WebhooksModule** - Integrações
6. **FileStorageModule** - Expansão do upload
7. **ExportImportModule** - Migração de dados
8. **PaymentsModule** - Fechamento financeiro

### 🟢 Média/Baixa (Implementar Depois)
9. **TemplatesModule** - Customização
10. **DocumentsModule** - Documentos
11. **CacheModule** - Performance
12. **MonitoringModule** - Observabilidade
13. **BackupModule** - Continuidade
14. **ComplianceModule** - LGPD
15. **ActivityModule** - UX

---

## 🎯 Recomendação de Ordem de Implementação

### Fase 1: Fundação (Antes dos Módulos Faltantes)
1. ✅ **AuditModule** - Base para rastreabilidade
2. ✅ **JobsModule** - Base para processamento assíncrono
3. ✅ **RateLimitingModule** - Proteção

### Fase 2: Módulos de Negócio (Junto com os Faltantes)
4. ✅ **PartsModule** (já planejado)
5. ✅ **AppointmentsModule** (já planejado)
6. ✅ **InvoicingModule** (já planejado)
7. ✅ **PaymentsModule** (novo)
8. ✅ **WebhooksModule** (novo)

### Fase 3: Expansão (Depois)
9. ✅ **ReportsModule** (já planejado)
10. ✅ **SuppliersModule** (já planejado)
11. ✅ **FileStorageModule** (expansão)
12. ✅ **ExportImportModule** (novo)
13. ✅ **TemplatesModule** (novo)

### Fase 4: Infraestrutura (Futuro)
14. ✅ **MonitoringModule**
15. ✅ **BackupModule**
16. ✅ **ComplianceModule**
17. ✅ **ActivityModule**

---

## 💡 Observações Importantes

### 1. **Dependências entre Módulos**
- **AuditModule** deve ser usado por TODOS os módulos
- **JobsModule** será usado por: EmailModule, ReportsModule, ExportImportModule
- **RateLimitingModule** deve proteger TODAS as rotas
- **FileStorageModule** será usado por: CustomersModule, VehiclesModule, ServiceOrdersModule

### 2. **Integração com Módulos Existentes**
- **AuditModule** → Integrar com todos os services existentes
- **JobsModule** → Migrar BulkEmailService para usar fila
- **RateLimitingModule** → Aplicar em todos os controllers
- **WebhooksModule** → Integrar com eventos dos módulos existentes

### 3. **Performance**
- **CacheModule** melhorará performance de queries frequentes
- **JobsModule** evitará timeouts em operações pesadas
- **RateLimitingModule** protegerá contra sobrecarga

### 4. **Compliance**
- **AuditModule** é essencial para LGPD e SOC 2
- **ComplianceModule** implementa funcionalidades específicas de LGPD
- **SecurityModule** (MFA) é requisito para alguns clientes Enterprise

---

## 📋 Checklist de Decisão

Antes de implementar os módulos faltantes, considere:

- [ ] Implementar **AuditModule** primeiro? (Recomendado)
- [ ] Implementar **JobsModule** para processamento assíncrono? (Recomendado)
- [ ] Implementar **RateLimitingModule** para proteção? (Recomendado)
- [ ] Expandir **FileStorageModule** além de logo? (Opcional)
- [ ] Implementar **WebhooksModule** para integrações? (Recomendado se houver necessidade)
- [ ] Implementar **PaymentsModule** junto com InvoicingModule? (Recomendado)
- [ ] Implementar **ExportImportModule** para migração? (Opcional, mas útil)

---

**Última atualização:** 30/11/2025

