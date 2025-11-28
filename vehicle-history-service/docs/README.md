# Documentação - Vehicle History Service

**Versão:** 1.0  
**Sistema:** AutoVida Vehicle History Platform

---

## 📚 Índice

- [Visão Geral](./OVERVIEW.md)
- [Arquitetura](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Integration Guide](./INTEGRATION.md)
- [Deployment Guide](./DEPLOY.md)

---

## 🎯 Visão Geral

Microserviço centralizado para gerenciamento de histórico de veículos. Hub que conecta Workshops e Dealers.

---

## 🔧 Funcionalidades

- Consulta de histórico (VIN/Placa)
- Atualização de histórico (Workshops)
- Health Score calculation
- Geração de PDF
- Cache (TTL 30 dias)

---

## 🔗 Integrações

### Entrada (Escrita)
- **Workshops:** Atualiza histórico ao finalizar RO

### Saída (Leitura)
- **Dealers:** Consulta histórico completo

---

**Documento criado em:** [Data]  
**Versão:** 1.0

