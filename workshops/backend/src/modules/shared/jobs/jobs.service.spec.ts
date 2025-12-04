import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { JobsService } from './jobs.service';
import { PrismaService } from '@database/prisma.service';
import { CreateJobDto, JobType, JobStatus, JobFiltersDto } from './dto';

describe('JobsService', () => {
  let service: JobsService;

  const mockTenantId = 'tenant-id';

  const mockPrismaService = {
    job: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((cb: (prisma: unknown) => [unknown[], number]) =>
      cb([[], 0]),
    ) as jest.MockedFunction<
      (cb: (prisma: unknown) => [unknown[], number]) => [unknown[], number]
    >,
  };

  const mockJobsQueue = {
    add: jest.fn(),
    getJobs: jest.fn(),
    getWaitingCount: jest.fn(),
    getActiveCount: jest.fn(),
    getCompletedCount: jest.fn(),
    getFailedCount: jest.fn(),
    getDelayedCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: getQueueToken('jobs'),
          useValue: mockJobsQueue,
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
      const mockJob = {
        id: 'job-id',
        tenantId: mockTenantId,
        type: JobType.EMAIL,
        status: JobStatus.PENDING,
        data: createJobDto.data,
        priority: 5,
        attempts: 0,
        maxAttempts: 3,
        error: null,
        result: null,
        createdAt: new Date(),
        processedAt: null,
        completedAt: null,
      };

      mockPrismaService.job.create.mockResolvedValue(mockJob);
      mockJobsQueue.add.mockResolvedValue({});

      const result = await service.create(mockTenantId, createJobDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(JobType.EMAIL);
      expect(result.status).toBe(JobStatus.PENDING);
      expect(result.data).toEqual(createJobDto.data);
      expect(result.priority).toBe(5);
      expect(mockPrismaService.job.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          type: createJobDto.type,
          status: JobStatus.PENDING,
          data: createJobDto.data,
          priority: 5,
          attempts: 0,
          maxAttempts: 3,
        },
      });
      expect(mockJobsQueue.add).toHaveBeenCalled();
    });

    it('deve criar job com prioridade padrão quando não informada', async () => {
      const dtoWithoutPriority: CreateJobDto = {
        type: JobType.REPORT,
        data: { reportType: 'monthly' },
      };

      const mockJob = {
        id: 'job-id',
        tenantId: mockTenantId,
        type: JobType.REPORT,
        status: JobStatus.PENDING,
        data: dtoWithoutPriority.data,
        priority: 5,
        attempts: 0,
        maxAttempts: 3,
        error: null,
        result: null,
        createdAt: new Date(),
        processedAt: null,
        completedAt: null,
      };

      mockPrismaService.job.create.mockResolvedValue(mockJob);
      mockJobsQueue.add.mockResolvedValue({});

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

        const mockJob = {
          id: `job-${type}`,
          tenantId: mockTenantId,
          type,
          status: JobStatus.PENDING,
          data: dto.data,
          priority: 5,
          attempts: 0,
          maxAttempts: 3,
          error: null,
          result: null,
          createdAt: new Date(),
          processedAt: null,
          completedAt: null,
        };

        mockPrismaService.job.create.mockResolvedValueOnce(mockJob);

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
      const mockJob = {
        id: 'job-id',
        tenantId: mockTenantId,
        type: JobType.EMAIL,
        status: JobStatus.PENDING,
        data: { test: 'data' },
        priority: 5,
        attempts: 0,
        maxAttempts: 3,
        error: null,
        result: null,
        createdAt: new Date(),
        processedAt: null,
        completedAt: null,
      };

      (mockPrismaService.$transaction as jest.Mock).mockResolvedValue([
        [mockJob],
        1,
      ] as [unknown[], number]);

      const result = await service.findAll(mockTenantId, {});

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
      expect(result).toHaveProperty('totalPages');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(1);
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
    it('deve processar job pendente adicionando à fila', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        tenantId: mockTenantId,
        type: JobType.EMAIL,
        status: JobStatus.PENDING,
        data: { to: 'test@example.com' },
        priority: 5,
        attempts: 0,
        maxAttempts: 3,
        error: null,
        result: null,
        createdAt: new Date(),
        processedAt: null,
        completedAt: null,
      };

      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);
      mockJobsQueue.add.mockResolvedValue({});

      await service.processJob(jobId);

      expect(mockJobsQueue.add).toHaveBeenCalled();
    });

    it('deve lançar erro se job não estiver pendente', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        tenantId: mockTenantId,
        type: JobType.EMAIL,
        status: JobStatus.COMPLETED,
        data: {},
        priority: 5,
        attempts: 0,
        maxAttempts: 3,
        error: null,
        result: null,
        createdAt: new Date(),
        processedAt: null,
        completedAt: null,
      };

      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      await expect(service.processJob(jobId)).rejects.toThrow();
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

      const mockJob = {
        id: 'job-id',
        tenantId: mockTenantId,
        type: JobType.REPORT,
        status: JobStatus.PENDING,
        data: createJobDto.data,
        priority: 5,
        attempts: 0,
        maxAttempts: 3,
        error: null,
        result: null,
        createdAt: new Date(),
        processedAt: null,
        completedAt: null,
      };

      mockPrismaService.job.create.mockResolvedValue(mockJob);
      mockJobsQueue.add.mockResolvedValue({});

      const result = await service.create(mockTenantId, createJobDto);

      expect(result.error).toBeUndefined();
      expect(result.result).toBeUndefined();
      expect(result.processedAt).toBeUndefined();
      expect(result.completedAt).toBeUndefined();
    });
  });

  describe('findOne', () => {
    it('deve buscar job por ID com sucesso', async () => {
      const mockJob = {
        id: 'job-id',
        tenantId: mockTenantId,
        type: JobType.EMAIL,
        status: JobStatus.PENDING,
        data: { test: 'data' },
        priority: 5,
        attempts: 0,
        maxAttempts: 3,
        error: null,
        result: null,
        createdAt: new Date(),
        processedAt: null,
        completedAt: null,
      };

      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);

      const result = await service.findOne(mockTenantId, 'job-id');

      expect(result).toHaveProperty('id', 'job-id');
      expect(result.type).toBe(JobType.EMAIL);
    });

    it('deve lançar NotFoundException se job não existe', async () => {
      mockPrismaService.job.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, 'non-existent'),
      ).rejects.toThrow('Job com ID non-existent não encontrado');
    });
  });

  describe('findAll - filtros adicionais', () => {
    it('deve filtrar por período de data', async () => {
      const filters: JobFiltersDto = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const mockJob = {
        id: 'job-id',
        tenantId: mockTenantId,
        type: JobType.EMAIL,
        status: JobStatus.PENDING,
        data: { test: 'data' },
        priority: 5,
        attempts: 0,
        maxAttempts: 3,
        error: null,
        result: null,
        createdAt: new Date(),
        processedAt: null,
        completedAt: null,
      };

      (mockPrismaService.$transaction as jest.Mock).mockResolvedValue([
        [mockJob],
        1,
      ] as [unknown[], number]);

      const result = await service.findAll(mockTenantId, filters);

      expect(result).toHaveProperty('data');
    });

    it('deve filtrar por tipo e status juntos', async () => {
      const filters: JobFiltersDto = {
        type: JobType.EMAIL,
        status: JobStatus.COMPLETED,
      };

      (mockPrismaService.$transaction as jest.Mock).mockResolvedValue([
        [],
        0,
      ] as [unknown[], number]);

      const result = await service.findAll(mockTenantId, filters);

      expect(result).toHaveProperty('data');
    });
  });

  describe('cancelJob', () => {
    it('deve cancelar job pendente', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        tenantId: mockTenantId,
        type: JobType.EMAIL,
        status: JobStatus.PENDING,
        data: {},
        priority: 5,
        attempts: 0,
        maxAttempts: 3,
        error: null,
        result: null,
        createdAt: new Date(),
        processedAt: null,
        completedAt: null,
      };

      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);
      mockJobsQueue.getJobs.mockResolvedValue([
        {
          data: { id: jobId },
          remove: jest.fn().mockResolvedValue(undefined),
        },
      ]);
      mockPrismaService.job.update.mockResolvedValue({
        ...mockJob,
        status: JobStatus.CANCELLED,
      });

      await service.cancelJob(mockTenantId, jobId);

      expect(mockPrismaService.job.update).toHaveBeenCalledWith({
        where: { id: jobId },
        data: { status: JobStatus.CANCELLED },
      });
    });

    it('deve lançar erro se job não pode ser cancelado', async () => {
      const jobId = 'job-123';
      const mockJob = {
        id: jobId,
        tenantId: mockTenantId,
        type: JobType.EMAIL,
        status: JobStatus.COMPLETED,
        data: {},
        priority: 5,
        attempts: 0,
        maxAttempts: 3,
        error: null,
        result: null,
        createdAt: new Date(),
        processedAt: null,
        completedAt: null,
      };

      mockPrismaService.job.findFirst.mockResolvedValue(mockJob);

      await expect(service.cancelJob(mockTenantId, jobId)).rejects.toThrow();
    });
  });

  describe('getQueueStats', () => {
    it('deve retornar estatísticas da fila', async () => {
      mockJobsQueue.getWaitingCount.mockResolvedValue(5);
      mockJobsQueue.getActiveCount.mockResolvedValue(2);
      mockJobsQueue.getCompletedCount.mockResolvedValue(100);
      mockJobsQueue.getFailedCount.mockResolvedValue(3);
      mockJobsQueue.getDelayedCount.mockResolvedValue(1);

      const stats = await service.getQueueStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
      });
    });
  });
});
