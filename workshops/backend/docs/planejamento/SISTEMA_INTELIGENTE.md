# 🤖 SISTEMA INTELIGENTE - MECÂNICA365

## 📋 VISÃO GERAL

Sistema inteligente que automatiza processos, sugere ações baseadas em histórico e dados do veículo, e facilita o trabalho do mecânico.

---

## 🔄 FLUXO COMPLETO - EXEMPLO PRÁTICO

### Cenário: Cliente chega para troca de óleo

#### 1. **Cadastro Automático do Cliente e Veículo**

```
Cliente chega → Informa placa do veículo
    ↓
Sistema busca automaticamente:
    - Consulta RENAVAN por placa
    - Busca dados: marca, modelo, ano, cor, motor, etc.
    - Valida e preenche automaticamente
    ↓
Se cliente não existe:
    - Cria cliente automaticamente
    - Vincula veículo ao cliente
    ↓
Se veículo já existe:
    - Atualiza KM atual
    - Verifica histórico
```

#### 2. **Criação de Ordem de Serviço - Troca de Óleo**

```
Mecânico cria OS: "Troca de Óleo"
    ↓
Sistema analisa:
    - Marca/Modelo/Ano do veículo
    - Tipo de motor
    - Última troca de óleo (histórico)
    - KM atual vs KM da última troca
    - Especificações do fabricante
    ↓
Sistema SUGERE automaticamente:
    ✅ Tipo de óleo correto (ex: 5W30, 10W40)
    ✅ Quantidade necessária (ex: 4.5 litros)
    ✅ Filtro de óleo compatível
    ✅ Filtro de ar (se necessário)
    ✅ Próxima troca (KM ou data)
    ↓
Mecânico confirma ou ajusta
    ↓
Sistema registra no histórico automaticamente
```

#### 3. **Registro Automático no Histórico**

```
Ao finalizar OS:
    ↓
Sistema cria automaticamente:
    - VehicleHistory (tipo: service)
    - VehicleHistoryItem (óleo, filtro, etc.)
    - Atualiza VehicleIntelligence:
      * lastOilChange = hoje
      * lastOilChangeKm = KM atual
      * nextService = calculado automaticamente
    ↓
Gera alertas se necessário:
    - Próxima revisão em X KM
    - Próxima revisão em X dias
```

---

## 🧠 INTELIGÊNCIAS IMPLEMENTADAS

### 1. **Sugestão de Óleo**

```typescript
async suggestOil(vehicleId: string): Promise<OilSuggestion> {
  const vehicle = await this.getVehicle(vehicleId);
  const history = await this.getVehicleHistory(vehicleId);
  const intelligence = await this.getVehicleIntelligence(vehicleId);
  
  // 1. Buscar especificações do fabricante
  const specs = await this.getVehicleSpecs(vehicle.brand, vehicle.model, vehicle.year);
  
  // 2. Verificar histórico
  const lastOilChange = intelligence?.lastOilChange;
  const lastOilChangeKm = intelligence?.lastOilChangeKm;
  const currentKm = vehicle.km;
  
  // 3. Calcular necessidade
  const kmSinceLastChange = currentKm - (lastOilChangeKm || 0);
  const needsChange = kmSinceLastChange >= (specs.oilChangeInterval || 10000);
  
  // 4. Sugerir óleo
  return {
    type: specs.recommendedOil, // Ex: "5W30"
    quantity: specs.oilCapacity, // Ex: 4.5 litros
    brand: this.suggestBrand(vehicle.brand),
    needsChange,
    kmSinceLastChange,
    nextChangeKm: currentKm + specs.oilChangeInterval,
    compatibleFilters: await this.getCompatibleFilters(vehicle),
  };
}
```

### 2. **Sugestão de Manutenção Preventiva**

```typescript
async suggestMaintenance(vehicleId: string): Promise<MaintenanceSuggestion[]> {
  const vehicle = await this.getVehicle(vehicleId);
  const history = await this.getVehicleHistory(vehicleId);
  const intelligence = await this.getVehicleIntelligence(vehicleId);
  
  const suggestions = [];
  
  // Verificar troca de óleo
  if (this.needsOilChange(vehicle, intelligence)) {
    suggestions.push({
      type: 'oil_change',
      priority: 'high',
      description: 'Troca de óleo recomendada',
      estimatedCost: this.calculateOilChangeCost(vehicle),
    });
  }
  
  // Verificar filtros
  if (this.needsFilterChange(vehicle, history)) {
    suggestions.push({
      type: 'filter_change',
      priority: 'medium',
      description: 'Troca de filtros recomendada',
      filters: await this.suggestFilters(vehicle),
    });
  }
  
  // Verificar pastilhas de freio
  if (this.needsBrakeService(vehicle, history)) {
    suggestions.push({
      type: 'brake_service',
      priority: 'high',
      description: 'Revisão de freios recomendada',
    });
  }
  
  // Verificar correia dentada
  if (this.needsBeltChange(vehicle, history)) {
    suggestions.push({
      type: 'belt_change',
      priority: 'critical',
      description: 'Troca de correia dentada URGENTE',
    });
  }
  
  return suggestions;
}
```

### 3. **Busca Automática de Dados**

```typescript
async lookupVehicleData(plate: string, renavan?: string, vin?: string): Promise<VehicleData> {
  // 1. Tentar buscar por RENAVAN
  if (renavan) {
    const renavanData = await this.lookupRenavan(renavan);
    if (renavanData) return renavanData;
  }
  
  // 2. Tentar buscar por VIN
  if (vin) {
    const vinData = await this.lookupVin(vin);
    if (vinData) return vinData;
  }
  
  // 3. Tentar buscar por placa
  const plateData = await this.lookupPlate(plate);
  if (plateData) return plateData;
  
  // 4. Buscar em base de dados interna
  const internalData = await this.findInDatabase(plate, renavan, vin);
  if (internalData) return internalData;
  
  throw new NotFoundException('Dados do veículo não encontrados');
}

async lookupRenavan(renavan: string): Promise<VehicleData> {
  // Integração com API RENAVAN
  // Retorna: marca, modelo, ano, cor, motor, etc.
}

async lookupVin(vin: string): Promise<VehicleData> {
  // Integração com API VIN Decoder
  // Retorna: especificações completas do veículo
}
```

---

## 📊 REGRAS DE NEGÓCIO INTELIGENTES

### 1. **Compatibilidade de Peças**

```typescript
async checkPartCompatibility(partId: string, vehicleId: string): Promise<boolean> {
  const part = await this.getPart(partId);
  const vehicle = await this.getVehicle(vehicleId);
  
  // Verificar compatibilidade na base de dados
  const compatibility = await this.prisma.partCompatibility.findFirst({
    where: {
      partId: part.id,
      brand: vehicle.brand,
      model: vehicle.model,
      yearFrom: { lte: vehicle.year },
      yearTo: { gte: vehicle.year },
    },
  });
  
  return !!compatibility;
}
```

### 2. **Cálculo de Próxima Manutenção**

```typescript
async calculateNextService(vehicleId: string): Promise<NextService> {
  const vehicle = await this.getVehicle(vehicleId);
  const intelligence = await this.getVehicleIntelligence(vehicleId);
  const specs = await this.getVehicleSpecs(vehicle);
  
  // Calcular baseado em KM
  const kmInterval = specs.serviceInterval || 10000;
  const lastServiceKm = intelligence?.lastServiceKm || 0;
  const nextServiceKm = lastServiceKm + kmInterval;
  const kmRemaining = nextServiceKm - vehicle.km;
  
  // Calcular baseado em tempo
  const timeInterval = specs.serviceTimeInterval || 365; // dias
  const lastServiceDate = intelligence?.lastService || vehicle.createdAt;
  const nextServiceDate = addDays(lastServiceDate, timeInterval);
  const daysRemaining = differenceInDays(nextServiceDate, new Date());
  
  return {
    nextServiceKm,
    kmRemaining,
    nextServiceDate,
    daysRemaining,
    priority: this.calculatePriority(kmRemaining, daysRemaining),
  };
}
```

### 3. **Detecção de Padrões**

```typescript
async detectPatterns(vehicleId: string): Promise<Pattern[]> {
  const history = await this.getVehicleHistory(vehicleId);
  
  const patterns = [];
  
  // Detectar frequência de serviços
  const serviceFrequency = this.analyzeServiceFrequency(history);
  if (serviceFrequency.isRegular) {
    patterns.push({
      type: 'regular_maintenance',
      description: 'Cliente mantém manutenção regular',
      confidence: serviceFrequency.confidence,
    });
  }
  
  // Detectar problemas recorrentes
  const recurringIssues = this.detectRecurringIssues(history);
  if (recurringIssues.length > 0) {
    patterns.push({
      type: 'recurring_issues',
      description: 'Problemas recorrentes detectados',
      issues: recurringIssues,
    });
  }
  
  return patterns;
}
```

---

## 🔗 INTEGRAÇÕES NECESSÁRIAS

### 1. **API RENAVAN**
- Consulta de dados do veículo por placa
- Retorna: marca, modelo, ano, cor, motor, etc.
- Exemplo: API do Detran (quando disponível)

### 2. **API VIN Decoder**
- Decodificação de VIN/Chassis
- Retorna: especificações completas
- Exemplo: NHTSA VIN Decoder, CarMD API

### 3. **Base de Dados de Especificações**
- Especificações de veículos (óleo, filtros, etc.)
- Compatibilidade de peças
- Manual do fabricante digital

### 4. **API de CEP**
- Busca de endereço por CEP
- Validação de endereços
- Exemplo: ViaCEP, BrasilAPI

### 5. **Validação de Documentos**
- Validação de CPF/CNPJ
- Consulta de situação cadastral
- Exemplo: ReceitaWS, BrasilAPI

---

## 📝 EXEMPLOS DE USO

### Exemplo 1: Cliente Novo

```
1. Cliente informa placa: "ABC-1234"
2. Sistema busca RENAVAN automaticamente
3. Preenche: Honda Civic 2020, Cor: Branco, Motor: 1.6
4. Sistema sugere cadastrar cliente (se não existir)
5. Cria veículo automaticamente
6. Pronto para criar OS!
```

### Exemplo 2: Troca de Óleo

```
1. Mecânico seleciona: "Troca de Óleo"
2. Sistema analisa veículo (Honda Civic 2020)
3. Sistema sugere:
   - Óleo: 5W30 (4.5 litros)
   - Filtro de óleo: Compatível Honda
   - Próxima troca: 10.000 KM ou 6 meses
4. Mecânico confirma
5. Sistema registra no histórico
6. Atualiza próxima manutenção automaticamente
```

### Exemplo 3: Manutenção Preventiva

```
1. Sistema detecta: Veículo com 95.000 KM
2. Verifica histórico: Última revisão em 90.000 KM
3. Sistema sugere:
   - Revisão completa (alta prioridade)
   - Troca de correia dentada (crítica)
   - Troca de filtros
   - Alinhamento e balanceamento
4. Cria OS automaticamente (se configurado)
5. Notifica cliente
```

---

## 🎯 BENEFÍCIOS

1. **Agilidade**: Cadastro automático economiza tempo
2. **Precisão**: Sugestões baseadas em dados reais
3. **Inteligência**: Sistema aprende com histórico
4. **Prevenção**: Alertas automáticos de manutenção
5. **Eficiência**: Menos erros, mais produtividade

---

**Status:** 📋 Planejamento Completo
**Próxima Ação:** Implementar busca automática RENAVAN/VIN

