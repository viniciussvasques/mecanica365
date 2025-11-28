# Nomes Finais dos Sistemas

**Versão:** 1.0  
**Data:** 2024

---

## 🎯 Nomes Definidos

### 1. Mecânica365.app
**Sistema:** Workshops (Oficinas)  
**Domínio:** mecanica365.app  
**Descrição:** ERP completo para oficinas mecânicas, retíficas, funilarias

**Componentes:**
- Backend API
- Frontend Web
- Admin Panel

---

### 2. VitrineAuto.app
**Sistema:** Dealers (Concessionárias)  
**Domínio:** vitrineauto.app  
**Descrição:** ERP completo para concessionárias e lojistas de veículos

**Componentes:**
- Backend API
- Frontend Web
- Admin Panel

---

### 3. Carvex.app
**Sistema:** Vehicle History Platform  
**Domínio:** carvex.app  
**Descrição:** Plataforma de histórico de veículos (hub central)

**Componentes:**
- Backend API (Microserviço)

---

## 🔗 Integração

```
Mecânica365.app (Oficinas)
    ↓ (escreve histórico)
Carvex.app (Vehicle History)
    ↓ (fornece histórico)
VitrineAuto.app (Dealers)
```

---

## 📋 Estrutura de Domínios

### Mecânica365
- mecanica365.app (principal)
- app.mecanica365.app
- admin.mecanica365.app
- api.mecanica365.app

### VitrineAuto
- vitrineauto.app (principal)
- app.vitrineauto.app
- admin.vitrineauto.app
- api.vitrineauto.app

### Carvex
- carvex.app (principal)
- api.carvex.app
- docs.carvex.app

---

**Documento criado em:** [Data]  
**Versão:** 1.0








