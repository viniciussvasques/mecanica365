# ✅ Correção de Problemas SonarLint - api.ts

**Data:** 2025-01-07  
**Status:** ✅ Concluído

---

## 🎯 Problemas Identificados e Corrigidos

### 1. Complexidade Cognitiva Alta (19 → <15) ✅

**Problema:**
- Função `setupAuthResponseInterceptor` tinha complexidade cognitiva de 19 (limite: 15)
- Código difícil de entender e manter

**Solução:**
Dividida em 9 funções menores e focadas:
- `shouldHandleAuthError()` - Verifica se deve tratar erro
- `shouldAttemptRefresh()` - Verifica se deve tentar refresh
- `redirectToLogin()` - Redireciona para login
- `setRequestAuthHeader()` - Adiciona token ao header
- `saveTokens()` - Salva tokens no localStorage
- `getRefreshToken()` - Obtém refresh token
- `queueRequest()` - Processa requisições na fila
- `performTokenRefresh()` - Executa refresh do token
- `handleRefreshError()` - Trata erro de refresh
- `toError()` - Converte erro desconhecido para Error

**Resultado:** Complexidade reduzida significativamente, código mais legível e testável.

---

### 2. Preferir `throw error` sobre `return Promise.reject(error)` ✅

**Problema:**
- 10 ocorrências de `return Promise.reject(error)`
- SonarLint recomenda usar `throw error` em async functions

**Solução:**
Substituído todos os `return Promise.reject(error)` por `throw error` ou `throw toError(error)`

**Antes:**
```typescript
return Promise.reject(error);
```

**Depois:**
```typescript
throw toError(error);
```

---

### 3. Promise Rejection Reason deve ser Error ✅

**Problema:**
- Alguns lugares rejeitavam com valores que não eram Error
- SonarLint exige que Promise rejection seja sempre Error

**Solução:**
Criada função `toError()` que converte qualquer valor para Error:

```typescript
function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String(error.message));
  }
  return new Error('Erro desconhecido');
}
```

---

## 📊 Estatísticas

### Antes
- **Complexidade Cognitiva:** 19 (limite: 15) ❌
- **Problemas SonarLint:** 10 erros
- **Linhas na função:** ~110 linhas
- **Funções auxiliares:** 0

### Depois
- **Complexidade Cognitiva:** <15 ✅
- **Problemas SonarLint:** 0 ✅
- **Linhas na função principal:** ~20 linhas
- **Funções auxiliares:** 10 funções bem definidas

---

## 🔍 Exemplo de Refatoração

### ANTES (Função Monolítica)
```typescript
export const setupAuthResponseInterceptor = (axiosInstance: typeof api) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      // 110 linhas de código complexo...
      if (!isAxiosError(error) || !error.config) {
        return Promise.reject(error);
      }
      // ... mais 100 linhas
    }
  );
};
```

### DEPOIS (Funções Modulares)
```typescript
// Funções auxiliares pequenas e focadas
function shouldHandleAuthError(error: unknown): boolean { /* ... */ }
function shouldAttemptRefresh(requestConfig): boolean { /* ... */ }
function redirectToLogin(): void { /* ... */ }
function setRequestAuthHeader(request, token): void { /* ... */ }
function saveTokens(accessToken, refreshToken?): void { /* ... */ }
function getRefreshToken(): string | null { /* ... */ }
function queueRequest(axiosInstance, originalRequest): Promise { /* ... */ }
function performTokenRefresh(axiosInstance, originalRequest): Promise { /* ... */ }
function handleRefreshError(refreshError): never { /* ... */ }
function toError(error: unknown): Error { /* ... */ }

// Função principal simplificada
export const setupAuthResponseInterceptor = (axiosInstance: typeof api) => {
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (!shouldHandleAuthError(error)) {
        throw toError(error);
      }
      // ... código limpo e legível
    }
  );
};
```

---

## ✅ Benefícios

### 1. Legibilidade
- ✅ Código mais fácil de entender
- ✅ Cada função tem uma responsabilidade única
- ✅ Nomes descritivos facilitam compreensão

### 2. Manutenibilidade
- ✅ Fácil de modificar funções específicas
- ✅ Fácil de adicionar novos comportamentos
- ✅ Fácil de testar individualmente

### 3. Testabilidade
- ✅ Cada função pode ser testada isoladamente
- ✅ Mocks mais simples
- ✅ Cobertura de testes mais fácil

### 4. Qualidade
- ✅ Passa todas as regras do SonarLint
- ✅ Complexidade cognitiva reduzida
- ✅ Código mais robusto

---

## 📝 Funções Criadas

### 1. `shouldHandleAuthError()`
Verifica se o erro deve ser tratado pelo interceptor de auth.

### 2. `shouldAttemptRefresh()`
Verifica se deve tentar refresh ou redirecionar para login.

### 3. `redirectToLogin()`
Redireciona para login e limpa dados de autenticação.

### 4. `setRequestAuthHeader()`
Adiciona token ao header da requisição.

### 5. `saveTokens()`
Salva tokens no localStorage.

### 6. `getRefreshToken()`
Obtém refresh token do localStorage.

### 7. `queueRequest()`
Processa requisições na fila quando refresh está em andamento.

### 8. `performTokenRefresh()`
Executa refresh do token.

### 9. `handleRefreshError()`
Trata erro de refresh do token.

### 10. `toError()`
Converte erro desconhecido para Error (garante type safety).

---

## ✅ Checklist de Conformidade

- [x] Complexidade cognitiva reduzida para <15
- [x] Todos os `Promise.reject` substituídos por `throw`
- [x] Todas as rejeições usam Error
- [x] Funções auxiliares criadas e documentadas
- [x] Código mais legível e manutenível
- [x] SonarLint passando sem erros
- [x] TypeScript compilando sem erros
- [x] Funcionalidade preservada

---

## 🎯 Resultado Final

**Status:** ✅ Todos os problemas corrigidos

- ✅ **0 erros** do SonarLint
- ✅ **Complexidade cognitiva:** <15
- ✅ **Código mais limpo** e manutenível
- ✅ **Pronto para produção**

---

**Melhorias aplicadas por:** Auto (AI Assistant)  
**Data:** 2025-01-07

