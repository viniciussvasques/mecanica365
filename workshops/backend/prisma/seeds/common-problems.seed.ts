import { PrismaClient } from '@prisma/client';
import { ProblemCategory } from '../../src/modules/workshops/shared/enums/problem-category.enum';

const prisma = new PrismaClient();

export const commonProblems = [
  // MOTOR
  {
    name: 'Óleo abaixo do mínimo',
    category: ProblemCategory.MOTOR,
    severity: 'MEDIA',
    estimatedCost: 150.0,
    description: 'Nível de óleo do motor abaixo do recomendado',
    symptoms: ['luz do óleo acesa', 'ruído no motor', 'motor superaquecendo'],
    solutions: [
      'Verificar nível de óleo',
      'Trocar óleo e filtro',
      'Verificar vazamentos',
    ],
  },
  {
    name: 'Motor superaquecendo',
    category: ProblemCategory.MOTOR,
    severity: 'ALTA',
    estimatedCost: 500.0,
    description: 'Temperatura do motor acima do normal',
    symptoms: [
      'temperatura alta no painel',
      'vapor saindo do capô',
      'motor desligando sozinho',
    ],
    solutions: [
      'Verificar nível de água/fluido do radiador',
      'Verificar termostato',
      'Verificar bomba d\'água',
      'Verificar vazamentos no sistema de arrefecimento',
    ],
  },
  {
    name: 'Ruído no motor',
    category: ProblemCategory.MOTOR,
    severity: 'MEDIA',
    estimatedCost: 800.0,
    description: 'Ruídos anormais vindos do motor',
    symptoms: ['barulho no motor', 'ruído estranho', 'batida no motor'],
    solutions: [
      'Diagnóstico completo do motor',
      'Verificar correias',
      'Verificar bomba d\'água',
      'Verificar alternador',
    ],
  },

  // FREIOS
  {
    name: 'Pastilhas de freio desgastadas',
    category: ProblemCategory.FREIOS,
    severity: 'ALTA',
    estimatedCost: 300.0,
    description: 'Pastilhas de freio com desgaste excessivo',
    symptoms: [
      'ruído no freio',
      'barulho ao frear',
      'freio rangendo',
      'pedal de freio baixo',
    ],
    solutions: [
      'Trocar pastilhas de freio',
      'Verificar discos',
      'Verificar fluido de freio',
    ],
  },
  {
    name: 'Disco de freio empenado',
    category: ProblemCategory.FREIOS,
    severity: 'MEDIA',
    estimatedCost: 600.0,
    description: 'Discos de freio com empenamento ou desgaste irregular',
    symptoms: [
      'tremor no volante ao frear',
      'vibração ao frear',
      'ruído ao frear',
    ],
    solutions: [
      'Retificar ou trocar discos',
      'Trocar pastilhas',
      'Verificar pinças',
    ],
  },
  {
    name: 'Fluido de freio baixo',
    category: ProblemCategory.FREIOS,
    severity: 'ALTA',
    estimatedCost: 150.0,
    description: 'Nível de fluido de freio abaixo do recomendado',
    symptoms: [
      'pedal de freio mole',
      'pedal vai até o chão',
      'luz do freio acesa',
    ],
    solutions: [
      'Completar fluido de freio',
      'Verificar vazamentos',
      'Trocar fluido se necessário',
    ],
  },

  // SUSPENSÃO
  {
    name: 'Amortecedor com vazamento',
    category: ProblemCategory.SUSPENSAO,
    severity: 'MEDIA',
    estimatedCost: 400.0,
    description: 'Amortecedor apresentando vazamento de óleo',
    symptoms: [
      'carro balançando muito',
      'suspensão mole',
      'barulho na suspensão',
    ],
    solutions: [
      'Trocar amortecedor',
      'Verificar batentes',
      'Verificar coxins',
    ],
  },
  {
    name: 'Bieleta da suspensão solta',
    category: ProblemCategory.SUSPENSAO,
    severity: 'MEDIA',
    estimatedCost: 250.0,
    description: 'Bieleta da suspensão com folga ou solta',
    symptoms: [
      'barulho na suspensão',
      'ruído ao passar em buracos',
      'instabilidade na direção',
    ],
    solutions: [
      'Trocar bieleta',
      'Verificar outros componentes da suspensão',
    ],
  },

  // ELÉTRICA
  {
    name: 'Bateria fraca ou descarregada',
    category: ProblemCategory.BATERIA,
    severity: 'MEDIA',
    estimatedCost: 400.0,
    description: 'Bateria com carga baixa ou descarregada',
    symptoms: [
      'carro não liga',
      'luzes fracas',
      'bateria descarregada',
      'alternador não carrega',
    ],
    solutions: [
      'Recarregar bateria',
      'Trocar bateria se necessário',
      'Verificar alternador',
      'Verificar sistema de carga',
    ],
  },
  {
    name: 'Alternador com problema',
    category: ProblemCategory.ELETRICA,
    severity: 'ALTA',
    estimatedCost: 600.0,
    description: 'Alternador não está carregando a bateria',
    symptoms: [
      'bateria descarregando',
      'luz da bateria acesa',
      'luzes piscando',
    ],
    solutions: [
      'Verificar alternador',
      'Trocar alternador se necessário',
      'Verificar correia do alternador',
    ],
  },
  {
    name: 'Fusível queimado',
    category: ProblemCategory.ELETRICA,
    severity: 'BAIXA',
    estimatedCost: 50.0,
    description: 'Fusível queimado causando falha elétrica',
    symptoms: [
      'componente elétrico não funciona',
      'luz não acende',
      'som não funciona',
    ],
    solutions: [
      'Identificar fusível queimado',
      'Trocar fusível',
      'Verificar causa do problema',
    ],
  },

  // AR CONDICIONADO
  {
    name: 'Ar condicionado sem gás',
    category: ProblemCategory.AR_CONDICIONADO,
    severity: 'BAIXA',
    estimatedCost: 200.0,
    description: 'Sistema de ar condicionado sem gás refrigerante',
    symptoms: [
      'ar não gelando',
      'ar quente',
      'ar condicionado não funciona',
    ],
    solutions: [
      'Recarregar gás',
      'Verificar vazamentos',
      'Verificar compressor',
    ],
  },
  {
    name: 'Compressor de ar condicionado com problema',
    category: ProblemCategory.AR_CONDICIONADO,
    severity: 'ALTA',
    estimatedCost: 800.0,
    description: 'Compressor do ar condicionado com defeito',
    symptoms: [
      'ar não gelando',
      'barulho no compressor',
      'compressor não liga',
    ],
    solutions: [
      'Verificar compressor',
      'Trocar compressor se necessário',
      'Verificar sistema completo',
    ],
  },

  // PNEUS
  {
    name: 'Pneus desgastados',
    category: ProblemCategory.PNEUS,
    severity: 'ALTA',
    estimatedCost: 800.0,
    description: 'Pneus com desgaste excessivo ou irregular',
    symptoms: [
      'pneu careca',
      'desgaste irregular',
      'pneu furado',
    ],
    solutions: [
      'Trocar pneus',
      'Verificar alinhamento',
      'Verificar balanceamento',
    ],
  },
  {
    name: 'Pneu furado',
    category: ProblemCategory.PNEUS,
    severity: 'MEDIA',
    estimatedCost: 100.0,
    description: 'Pneu com furo ou dano',
    symptoms: [
      'pneu murcho',
      'pneu furado',
      'perda de pressão',
    ],
    solutions: [
      'Reparar ou trocar pneu',
      'Verificar válvula',
      'Verificar pressão',
    ],
  },

  // TRANSMISSÃO
  {
    name: 'Óleo da transmissão baixo',
    category: ProblemCategory.TRANSMISSAO,
    severity: 'ALTA',
    estimatedCost: 300.0,
    description: 'Nível de óleo da transmissão abaixo do recomendado',
    symptoms: [
      'marcha não entra',
      'transmissão patinando',
      'ruído na transmissão',
    ],
    solutions: [
      'Completar óleo da transmissão',
      'Trocar óleo se necessário',
      'Verificar vazamentos',
    ],
  },

  // REFRIGERAÇÃO
  {
    name: 'Radiador com vazamento',
    category: ProblemCategory.RADIADOR,
    severity: 'ALTA',
    estimatedCost: 500.0,
    description: 'Radiador apresentando vazamento',
    symptoms: [
      'água vazando',
      'temperatura alta',
      'nível de água baixo',
    ],
    solutions: [
      'Reparar ou trocar radiador',
      'Verificar mangueiras',
      'Verificar tampa do radiador',
    ],
  },
  {
    name: 'Termostato com defeito',
    category: ProblemCategory.REFRIGERACAO,
    severity: 'MEDIA',
    estimatedCost: 200.0,
    description: 'Termostato não está funcionando corretamente',
    symptoms: [
      'motor superaquecendo',
      'temperatura não sobe',
      'temperatura irregular',
    ],
    solutions: [
      'Trocar termostato',
      'Verificar sistema de arrefecimento',
    ],
  },

  // DIREÇÃO
  {
    name: 'Fluido de direção baixo',
    category: ProblemCategory.DIRECAO,
    severity: 'MEDIA',
    estimatedCost: 150.0,
    description: 'Nível de fluido de direção abaixo do recomendado',
    symptoms: [
      'direção pesada',
      'barulho na direção',
      'direção dura',
    ],
    solutions: [
      'Completar fluido de direção',
      'Verificar vazamentos',
      'Verificar bomba de direção',
    ],
  },
];

export async function seedCommonProblems() {
  console.log('🌱 Seeding common problems...');

  for (const problem of commonProblems) {
    await prisma.commonProblem.upsert({
      where: { name: problem.name },
      update: {
        category: problem.category,
        severity: problem.severity,
        estimatedCost: problem.estimatedCost,
        description: problem.description,
        symptoms: problem.symptoms,
        solutions: problem.solutions,
        isActive: true,
      },
      create: problem,
    });
  }

  console.log(`✅ Seeded ${commonProblems.length} common problems`);
}

