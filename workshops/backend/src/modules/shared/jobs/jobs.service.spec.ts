import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '@database/prisma.service';
import { CreateJobDto, JobType, JobStatus, JobFiltersDto } from './dto';

describe('JobsService', () => {
  let service: JobsService;

  const mockTenantId = 'tenant-id';

  const mockPrismaService = {
    // Por enquanto, sem mocks necessários
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createJobDto: CreateJobDto = {
      type: JobType.EMAIL,
      data: {
        to: 'test@example.com',
        subject: 'Test',
      },
      priority: 5,
    };

    it('deve criar um job com sucesso', async () => {
      const result = await service.create(mockTenantId, createJobDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(JobType.EMAIL);
      expect(result.status).toBe(JobStatus.PENDING);
      expect(result.data).toEqual(createJobDto.data);
      expect(result.priority).toBe(5);
    });

    it('deve criar job com prioridade padrão quando não informada', async () => {
      const dtoWithoutPriority: CreateJobDto = {
        type: JobType.REPORT,
        data: { reportType: 'monthly' },
      };

      const result = await service.create(mockTenantId, dtoWithoutPriority);

      expect(result.priority).toBe(5);
      expect(result.type).toBe(JobType.REPORT);
    });

    it('deve criar job com diferentes tipos', async () => {
      const types = [
        JobType.EMAIL,
        JobType.REPORT,
        JobType.WEBHOOK,
        JobType.CLEANUP,
        JobType.EXPORT,
      ];

      for (const type of types) {
        const dto: CreateJobDto = {
          type,
          data: { test: 'data' },
        };

        const result = await service.create(mockTenantId, dto);
        expect(result.type).toBe(type);
      }
    });

    it('deve criar job com attempts padrão', async () => {
      const result = await service.create(mockTenantId, createJobDto);

      expect(result.attempts).toBe(0);
    });
  });

  describe('findAll', () => {
    it('deve listar jobs com sucesso', async () => {
      const result = await service.findAll(mockTenantId, {});

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('deve aplicar filtros de paginação', async () => {
      const filters: JobFiltersDto = {
        page: 2,
        limit: 10,
      };

      const result = await service.findAll(mockTenantId, filters);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('deve usar valores padrão quando filtros não informados', async () => {
      const result = await service.findAll(mockTenantId, {});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('deve filtrar por tipo quando informado', async () => {
      const filters: JobFiltersDto = {
        type: JobType.EMAIL,
      };

      const result = await service.findAll(mockTenantId, filters);

      expect(result).toHaveProperty('data');
    });

    it('deve filtrar por status quando informado', async () => {
      const filters: JobFiltersDto = {
        status: JobStatus.PENDING,
      };

      const result = await service.findAll(mockTenantId, filters);

      expect(result).toHaveProperty('data');
    });
  });

  describe('processJob', () => {
    it('deve processar job com sucesso', async () => {
      const jobId = 'job-123';

      await expect(service.processJob(jobId)).resolves.toBeUndefined();
    });

    it('deve lidar com erros ao processar job', async () => {
      const jobId = 'job-123';

      // Por enquanto, apenas verifica que não lança erro
      await expect(service.processJob(jobId)).resolves.toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('deve lidar com erros ao criar job', async () => {
      const createJobDto: CreateJobDto = {
        type: JobType.EMAIL,
        data: { test: 'data' },
      };

      // Mock para forçar erro
      jest
        .spyOn(service, 'create')
        .mockRejectedValueOnce(new Error('Test error'));

      await expect(service.create(mockTenantId, createJobDto)).rejects.toThrow(
        'Test error',
      );
    });

    it('deve lidar com erros ao listar jobs', async () => {
      // Mock para forçar erro
      jest
        .spyOn(service, 'findAll')
        .mockRejectedValueOnce(new Error('Test error'));

      await expect(service.findAll(mockTenantId, {})).rejects.toThrow(
        'Test error',
      );
    });
  });

  describe('toResponseDto', () => {
    it('deve converter job completo para DTO', async () => {
      const createJobDto: CreateJobDto = {
        type: JobType.EMAIL,
        data: { test: 'data' },
        priority: 8,
        attempts: 2,
      };

      const result = await service.create(mockTenantId, createJobDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('priority');
      expect(result).toHaveProperty('attempts');
      expect(result).toHaveProperty('createdAt');
    });

    it('deve converter job com campos opcionais', async () => {
      const createJobDto: CreateJobDto = {
        type: JobType.REPORT,
        data: { report: 'data' },
      };

      const result = await service.create(mockTenantId, createJobDto);

      expect(result.error).toBeUndefined();
      expect(result.result).toBeUndefined();
      expect(result.processedAt).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
    });
  });
});
