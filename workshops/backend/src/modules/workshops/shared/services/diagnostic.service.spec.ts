import { Test, TestingModule } from '@nestjs/testing';
import { DiagnosticService } from './diagnostic.service';
import { PrismaService } from '@database/prisma.service';
import { ProblemCategory } from '../enums/problem-category.enum';

describe('DiagnosticService', () => {
  let service: DiagnosticService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockProblems = [
    {
      id: 'problem-1',
      name: 'Problema no motor',
      category: ProblemCategory.MOTOR,
      severity: 'high',
      estimatedCost: { toNumber: () => 500 },
      description: 'Problema no motor',
      solutions: ['Trocar óleo', 'Verificar filtros'],
      symptoms: ['motor', 'ruído', 'barulho'],
      isActive: true,
    },
    {
      id: 'problem-2',
      name: 'Problema nos freios',
      category: ProblemCategory.FREIOS,
      severity: 'critical',
      estimatedCost: { toNumber: () => 300 },
      description: 'Problema nos freios',
      solutions: ['Trocar pastilhas', 'Verificar discos'],
      symptoms: ['freio', 'freiar', 'parar'],
      isActive: true,
    },
  ];

  beforeEach(async () => {
    const mockPrismaService = {
      commonProblem: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiagnosticService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<DiagnosticService>(DiagnosticService);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('suggestProblems', () => {
    it('deve retornar array vazio se não houver sintomas', async () => {
      const result = await service.suggestProblems([]);

      expect(result).toEqual([]);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prismaService.commonProblem.findMany).not.toHaveBeenCalled();
    });

    it('deve sugerir problemas baseado em sintomas', async () => {
      (prismaService.commonProblem.findMany as jest.Mock).mockResolvedValue(
        mockProblems,
      );

      const result = await service.suggestProblems(['motor', 'ruído']);

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('problemId');
      expect(result[0]).toHaveProperty('matchScore');
    });

    it('deve filtrar por categoria quando fornecida', async () => {
      (prismaService.commonProblem.findMany as jest.Mock).mockResolvedValue([
        mockProblems[0],
      ]);

      const result = await service.suggestProblems(
        ['motor'],
        ProblemCategory.MOTOR,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prismaService.commonProblem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
            category: ProblemCategory.MOTOR,
          }),
        }) as never,
      );
      expect(result.length).toBeGreaterThan(0);
    });

    it('deve normalizar sintomas para busca', async () => {
      (prismaService.commonProblem.findMany as jest.Mock).mockResolvedValue(
        mockProblems,
      );

      await service.suggestProblems(['MOTOR', 'Ruído', 'barulho']);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(prismaService.commonProblem.findMany).toHaveBeenCalled();
    });
  });

  describe('normalizeText', () => {
    it('deve remover acentos e normalizar texto', () => {
      const result = service['normalizeText']('São Paulo');

      expect(result).not.toContain('ã');
      expect(result).toContain('a');
    });
  });
});
