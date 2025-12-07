'use client';

import { useState, useCallback } from 'react';
import { ScannerIcon } from '@/components/icons/MechanicIcons';

// Banco de códigos DTC comuns
const dtcDatabase: Record<string, { description: string; causes: string[]; solutions: string[]; severity: 'low' | 'medium' | 'high' | 'critical' }> = {
  // Motor - Powertrain (P0xxx)
  'P0300': {
    description: 'Falha de ignição aleatória detectada em múltiplos cilindros',
    causes: ['Velas de ignição desgastadas', 'Cabos de ignição danificados', 'Bobina de ignição com defeito', 'Vazamento de vácuo', 'Injetores sujos ou com defeito'],
    solutions: ['Verificar e substituir velas de ignição', 'Inspecionar cabos de ignição', 'Testar bobinas de ignição', 'Verificar vazamentos de vácuo', 'Limpar ou substituir injetores'],
    severity: 'high'
  },
  'P0301': {
    description: 'Falha de ignição detectada - Cilindro 1',
    causes: ['Vela do cilindro 1 desgastada', 'Cabo de ignição do cilindro 1 danificado', 'Bobina de ignição com defeito', 'Injetor do cilindro 1 com problema'],
    solutions: ['Substituir vela do cilindro 1', 'Verificar cabo de ignição', 'Testar bobina de ignição', 'Verificar injetor'],
    severity: 'medium'
  },
  'P0302': {
    description: 'Falha de ignição detectada - Cilindro 2',
    causes: ['Vela do cilindro 2 desgastada', 'Cabo de ignição do cilindro 2 danificado', 'Bobina de ignição com defeito', 'Injetor do cilindro 2 com problema'],
    solutions: ['Substituir vela do cilindro 2', 'Verificar cabo de ignição', 'Testar bobina de ignição', 'Verificar injetor'],
    severity: 'medium'
  },
  'P0303': {
    description: 'Falha de ignição detectada - Cilindro 3',
    causes: ['Vela do cilindro 3 desgastada', 'Cabo de ignição do cilindro 3 danificado', 'Bobina de ignição com defeito', 'Injetor do cilindro 3 com problema'],
    solutions: ['Substituir vela do cilindro 3', 'Verificar cabo de ignição', 'Testar bobina de ignição', 'Verificar injetor'],
    severity: 'medium'
  },
  'P0304': {
    description: 'Falha de ignição detectada - Cilindro 4',
    causes: ['Vela do cilindro 4 desgastada', 'Cabo de ignição do cilindro 4 danificado', 'Bobina de ignição com defeito', 'Injetor do cilindro 4 com problema'],
    solutions: ['Substituir vela do cilindro 4', 'Verificar cabo de ignição', 'Testar bobina de ignição', 'Verificar injetor'],
    severity: 'medium'
  },
  'P0420': {
    description: 'Eficiência do sistema de catalisador abaixo do limite (Banco 1)',
    causes: ['Catalisador danificado ou desgastado', 'Sensor de oxigênio com defeito', 'Vazamento no sistema de escape', 'Mistura ar/combustível incorreta'],
    solutions: ['Verificar catalisador', 'Testar sensores de O2', 'Verificar vazamentos no escape', 'Verificar sistema de injeção'],
    severity: 'high'
  },
  'P0171': {
    description: 'Sistema muito pobre (Banco 1) - Muita entrada de ar',
    causes: ['Vazamento de vácuo', 'Sensor MAF sujo ou com defeito', 'Injetores entupidos', 'Bomba de combustível fraca', 'Filtro de combustível entupido'],
    solutions: ['Verificar vazamentos de vácuo', 'Limpar ou substituir sensor MAF', 'Limpar injetores', 'Verificar pressão da bomba', 'Substituir filtro de combustível'],
    severity: 'medium'
  },
  'P0172': {
    description: 'Sistema muito rico (Banco 1) - Muita entrada de combustível',
    causes: ['Injetores vazando', 'Sensor MAF com defeito', 'Regulador de pressão com defeito', 'Sensor de temperatura do motor com defeito'],
    solutions: ['Verificar injetores', 'Testar sensor MAF', 'Verificar regulador de pressão', 'Testar sensor de temperatura'],
    severity: 'medium'
  },
  'P0401': {
    description: 'Fluxo insuficiente de recirculação de gases de escape (EGR)',
    causes: ['Válvula EGR entupida', 'Passagens EGR bloqueadas', 'Sensor de posição EGR com defeito', 'Solenoide EGR com defeito'],
    solutions: ['Limpar válvula EGR', 'Desobstruir passagens', 'Testar sensor de posição', 'Verificar solenoide'],
    severity: 'medium'
  },
  'P0442': {
    description: 'Pequeno vazamento detectado no sistema EVAP',
    causes: ['Tampa do tanque solta ou danificada', 'Mangueiras EVAP rachadas', 'Válvula de purga com defeito', 'Canister danificado'],
    solutions: ['Verificar tampa do tanque', 'Inspecionar mangueiras', 'Testar válvula de purga', 'Verificar canister'],
    severity: 'low'
  },
  'P0455': {
    description: 'Grande vazamento detectado no sistema EVAP',
    causes: ['Tampa do tanque ausente ou muito danificada', 'Mangueira EVAP desconectada', 'Válvula de purga travada aberta', 'Tanque de combustível danificado'],
    solutions: ['Verificar/substituir tampa do tanque', 'Reconectar mangueiras', 'Substituir válvula de purga', 'Inspecionar tanque'],
    severity: 'medium'
  },
  'P0500': {
    description: 'Mau funcionamento do sensor de velocidade do veículo',
    causes: ['Sensor de velocidade com defeito', 'Fiação danificada', 'Conectores corroídos', 'Módulo de controle com problema'],
    solutions: ['Substituir sensor de velocidade', 'Verificar fiação', 'Limpar conectores', 'Diagnosticar módulo'],
    severity: 'medium'
  },
  'P0507': {
    description: 'RPM de marcha lenta acima do esperado',
    causes: ['Vazamento de vácuo', 'Corpo de borboleta sujo', 'Válvula IAC com defeito', 'Vazamento no coletor de admissão'],
    solutions: ['Verificar vazamentos', 'Limpar corpo de borboleta', 'Substituir válvula IAC', 'Verificar juntas do coletor'],
    severity: 'low'
  },
  'P0562': {
    description: 'Tensão do sistema baixa',
    causes: ['Bateria fraca', 'Alternador com defeito', 'Correia do alternador solta', 'Conexões de bateria corroídas'],
    solutions: ['Testar/substituir bateria', 'Verificar alternador', 'Ajustar correia', 'Limpar terminais'],
    severity: 'medium'
  },
  'P0700': {
    description: 'Mau funcionamento do sistema de controle da transmissão',
    causes: ['Problema no módulo TCM', 'Fiação da transmissão danificada', 'Nível de fluido baixo', 'Solenoides da transmissão com defeito'],
    solutions: ['Diagnosticar módulo TCM', 'Verificar fiação', 'Verificar nível de fluido', 'Testar solenoides'],
    severity: 'high'
  },
  // Sensores de O2
  'P0130': {
    description: 'Mau funcionamento do circuito do sensor de O2 (Banco 1, Sensor 1)',
    causes: ['Sensor de O2 com defeito', 'Fiação danificada', 'Vazamento no escape antes do sensor', 'ECU com problema'],
    solutions: ['Substituir sensor de O2', 'Verificar fiação', 'Verificar vazamentos', 'Diagnosticar ECU'],
    severity: 'medium'
  },
  'P0131': {
    description: 'Baixa tensão do sensor de O2 (Banco 1, Sensor 1)',
    causes: ['Sensor de O2 com defeito', 'Vazamento de ar no escape', 'Sistema muito pobre', 'Fiação em curto'],
    solutions: ['Substituir sensor', 'Verificar escape', 'Verificar mistura ar/combustível', 'Verificar fiação'],
    severity: 'medium'
  },
  // Corpo - Body (B0xxx)
  'B0001': {
    description: 'Circuito do airbag do motorista com defeito',
    causes: ['Módulo do airbag com defeito', 'Conector do airbag danificado', 'Mola do relógio (clock spring) com defeito'],
    solutions: ['Diagnosticar módulo', 'Verificar conectores', 'Substituir mola do relógio'],
    severity: 'critical'
  },
  // Chassi (C0xxx)
  'C0035': {
    description: 'Sensor de velocidade da roda dianteira esquerda com defeito',
    causes: ['Sensor ABS com defeito', 'Anel relutante danificado', 'Fiação danificada', 'Rolamento da roda com folga'],
    solutions: ['Substituir sensor ABS', 'Verificar anel relutante', 'Reparar fiação', 'Verificar rolamento'],
    severity: 'high'
  },
  // Rede/Comunicação (U0xxx)
  'U0100': {
    description: 'Comunicação perdida com ECM/PCM',
    causes: ['Módulo ECM com defeito', 'Fiação CAN bus danificada', 'Fusível queimado', 'Problemas de aterramento'],
    solutions: ['Diagnosticar ECM', 'Verificar fiação CAN', 'Verificar fusíveis', 'Verificar aterramento'],
    severity: 'critical'
  },
  'U0101': {
    description: 'Comunicação perdida com TCM (Módulo de Transmissão)',
    causes: ['Módulo TCM com defeito', 'Fiação CAN bus danificada', 'Fusível queimado'],
    solutions: ['Diagnosticar TCM', 'Verificar fiação CAN', 'Verificar fusíveis'],
    severity: 'high'
  },
};

// Sintomas comuns e códigos relacionados
const symptomDatabase: { symptom: string; relatedCodes: string[]; description: string }[] = [
  { symptom: 'Motor falhando/engasgando', relatedCodes: ['P0300', 'P0301', 'P0302', 'P0303', 'P0304'], description: 'Problemas de ignição ou injeção' },
  { symptom: 'Luz do motor acesa', relatedCodes: ['P0420', 'P0171', 'P0172', 'P0442'], description: 'Diversos problemas possíveis' },
  { symptom: 'Consumo alto de combustível', relatedCodes: ['P0172', 'P0420', 'P0401'], description: 'Mistura rica ou catalisador' },
  { symptom: 'Dificuldade para dar partida', relatedCodes: ['P0171', 'P0562', 'P0300'], description: 'Sistema de combustível ou elétrico' },
  { symptom: 'Marcha lenta irregular', relatedCodes: ['P0507', 'P0300', 'P0171', 'P0172'], description: 'Vazamento de ar ou ignição' },
  { symptom: 'Carro morrendo', relatedCodes: ['P0171', 'P0507', 'P0562'], description: 'Mistura pobre ou problema elétrico' },
  { symptom: 'Perda de potência', relatedCodes: ['P0420', 'P0171', 'P0401', 'P0300'], description: 'Catalisador, admissão ou ignição' },
  { symptom: 'Luz do ABS acesa', relatedCodes: ['C0035'], description: 'Sensor de velocidade da roda' },
  { symptom: 'Luz do airbag acesa', relatedCodes: ['B0001'], description: 'Sistema de airbag' },
  { symptom: 'Transmissão não engata', relatedCodes: ['P0700', 'U0101'], description: 'Módulo ou solenoides da transmissão' },
  { symptom: 'Cheiro de combustível', relatedCodes: ['P0442', 'P0455'], description: 'Vazamento no sistema EVAP' },
  { symptom: 'Velocímetro não funciona', relatedCodes: ['P0500'], description: 'Sensor de velocidade' },
];

export default function DiagnosticsPage() {
  const [searchCode, setSearchCode] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [result, setResult] = useState<typeof dtcDatabase[string] | null>(null);
  const [suggestedCodes, setSuggestedCodes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'code' | 'symptoms'>('code');

  const handleCodeSearch = useCallback(() => {
    const code = searchCode.toUpperCase().trim();
    if (dtcDatabase[code]) {
      setResult(dtcDatabase[code]);
      setSuggestedCodes([]);
    } else {
      setResult(null);
      // Sugerir códigos similares
      const similar = Object.keys(dtcDatabase).filter(c => c.includes(code) || code.includes(c.slice(0, 3)));
      setSuggestedCodes(similar.slice(0, 5));
    }
  }, [searchCode]);

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => {
      const newSymptoms = prev.includes(symptom) 
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom];
      
      // Encontrar códigos relacionados
      const relatedCodes = new Set<string>();
      newSymptoms.forEach(s => {
        const found = symptomDatabase.find(sd => sd.symptom === s);
        if (found) {
          found.relatedCodes.forEach(c => relatedCodes.add(c));
        }
      });
      setSuggestedCodes(Array.from(relatedCodes));
      return newSymptoms;
    });
  };

  const handleCodeClick = (code: string) => {
    setSearchCode(code);
    if (dtcDatabase[code]) {
      setResult(dtcDatabase[code]);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Crítico';
      case 'high': return 'Alto';
      case 'medium': return 'Médio';
      case 'low': return 'Baixo';
      default: return severity;
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#D0D6DE]">Diagnóstico Veicular</h1>
          <p className="text-sm text-[#7E8691] mt-1">Pesquise códigos DTC ou selecione sintomas</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#7E8691] bg-[#1A1E23] px-3 py-2 rounded-lg">
          <ScannerIcon className="w-4 h-4 text-[#00E0B8]" />
          <span>{Object.keys(dtcDatabase).length} códigos no banco de dados</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#2A3038] pb-2">
        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'code' 
              ? 'bg-[#00E0B8]/20 text-[#00E0B8] border-b-2 border-[#00E0B8]' 
              : 'text-[#7E8691] hover:text-[#D0D6DE]'
          }`}
        >
          Pesquisar Código DTC
        </button>
        <button
          onClick={() => setActiveTab('symptoms')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            activeTab === 'symptoms' 
              ? 'bg-[#00E0B8]/20 text-[#00E0B8] border-b-2 border-[#00E0B8]' 
              : 'text-[#7E8691] hover:text-[#D0D6DE]'
          }`}
        >
          Diagnóstico por Sintomas
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'code' && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <label className="block text-sm font-medium text-[#D0D6DE] mb-2">
              Digite o código DTC (ex: P0300, P0420, B0001, C0035, U0100)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSearch()}
                placeholder="P0300"
                className="flex-1 bg-[#0F1115] border border-[#2A3038] rounded-lg px-4 py-2 text-[#D0D6DE] placeholder-[#7E8691] focus:outline-none focus:border-[#00E0B8] font-mono text-lg"
                maxLength={5}
              />
              <button
                onClick={handleCodeSearch}
                className="px-6 py-2 bg-gradient-to-r from-[#00E0B8] to-[#3ABFF8] text-[#0F1115] font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Pesquisar
              </button>
            </div>
            <p className="text-xs text-[#7E8691] mt-2">
              P = Powertrain (Motor/Transmissão) | B = Body (Carroceria) | C = Chassis | U = Network (Rede)
            </p>
          </div>

          {/* Quick Access - Códigos comuns */}
          <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
            <h3 className="text-sm font-medium text-[#D0D6DE] mb-3">Códigos mais comuns:</h3>
            <div className="flex flex-wrap gap-2">
              {['P0300', 'P0420', 'P0171', 'P0172', 'P0442', 'P0500', 'P0700', 'C0035'].map(code => (
                <button
                  key={code}
                  onClick={() => handleCodeClick(code)}
                  className="px-3 py-1.5 bg-[#2A3038] hover:bg-[#343B46] text-[#D0D6DE] text-sm font-mono rounded-lg transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'symptoms' && (
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[#D0D6DE] mb-3">Selecione os sintomas observados:</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {symptomDatabase.map(({ symptom, description }) => (
              <button
                key={symptom}
                onClick={() => handleSymptomToggle(symptom)}
                className={`p-3 text-left rounded-lg border transition-colors ${
                  selectedSymptoms.includes(symptom)
                    ? 'bg-[#00E0B8]/20 border-[#00E0B8] text-[#00E0B8]'
                    : 'bg-[#0F1115] border-[#2A3038] text-[#D0D6DE] hover:border-[#3A4048]'
                }`}
              >
                <p className="text-sm font-medium">{symptom}</p>
                <p className="text-xs text-[#7E8691] mt-1">{description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Codes */}
      {suggestedCodes.length > 0 && (
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
          <h3 className="text-sm font-medium text-[#D0D6DE] mb-3">
            {activeTab === 'symptoms' ? 'Códigos relacionados aos sintomas:' : 'Códigos sugeridos:'}
          </h3>
          <div className="flex flex-wrap gap-2">
            {suggestedCodes.map(code => (
              <button
                key={code}
                onClick={() => handleCodeClick(code)}
                className="px-3 py-2 bg-[#2A3038] hover:bg-[#00E0B8]/20 hover:text-[#00E0B8] text-[#D0D6DE] text-sm font-mono rounded-lg transition-colors flex items-center gap-2"
              >
                <span>{code}</span>
                {dtcDatabase[code] && (
                  <span className={`px-1.5 py-0.5 text-xs rounded ${getSeverityColor(dtcDatabase[code].severity)}`}>
                    {getSeverityLabel(dtcDatabase[code].severity)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2A3038] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#D0D6DE] font-mono">{searchCode}</h2>
              <p className="text-sm text-[#7E8691]">{result.description}</p>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getSeverityColor(result.severity)}`}>
              {getSeverityLabel(result.severity)}
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* Causas */}
            <div>
              <h3 className="text-sm font-semibold text-[#FF4E3D] mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Possíveis Causas
              </h3>
              <ul className="space-y-1">
                {result.causes.map((cause, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#D0D6DE]">
                    <span className="text-[#FF4E3D] mt-1">•</span>
                    {cause}
                  </li>
                ))}
              </ul>
            </div>

            {/* Soluções */}
            <div>
              <h3 className="text-sm font-semibold text-[#00E0B8] mb-2 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Soluções Recomendadas
              </h3>
              <ul className="space-y-1">
                {result.solutions.map((solution, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#D0D6DE]">
                    <span className="text-[#00E0B8] mt-1">{i + 1}.</span>
                    {solution}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-[#2A3038] bg-[#0F1115] flex flex-wrap gap-2">
            <button 
              onClick={() => {
                const text = `Código: ${searchCode}\nDescrição: ${result.description}\n\nCausas:\n${result.causes.map(c => `- ${c}`).join('\n')}\n\nSoluções:\n${result.solutions.map((s, i) => `${i+1}. ${s}`).join('\n')}`;
                navigator.clipboard.writeText(text);
                alert('Diagnóstico copiado!');
              }}
              className="px-4 py-2 bg-[#2A3038] hover:bg-[#343B46] text-[#D0D6DE] text-sm rounded-lg transition-colors"
            >
              Copiar Diagnóstico
            </button>
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#2A3038] hover:bg-[#343B46] text-[#D0D6DE] text-sm rounded-lg transition-colors"
            >
              Imprimir
            </button>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-[#1A1E23] border border-[#2A3038] rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[#3ABFF8] mb-2">ℹ️ Sobre os códigos DTC</h3>
        <div className="text-sm text-[#7E8691] space-y-2">
          <p><strong>P</strong> - Powertrain: Motor, transmissão, sistema de emissões</p>
          <p><strong>B</strong> - Body: Airbags, ar condicionado, vidros elétricos</p>
          <p><strong>C</strong> - Chassis: ABS, suspensão, direção</p>
          <p><strong>U</strong> - Network: Comunicação entre módulos (CAN bus)</p>
          <p className="pt-2 border-t border-[#2A3038]">
            <strong>Segundo dígito:</strong> 0 = Código padrão SAE | 1 = Código do fabricante
          </p>
        </div>
      </div>
    </div>
  );
}

