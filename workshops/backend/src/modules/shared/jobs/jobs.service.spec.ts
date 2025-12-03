import { Test, TestingModule } from '@nestjs/testing';
import { JobsService } from './jobs.service';
import { PrismaService } from '@database/prisma.service';
import { CreateJobDto, JobType } from './dto';

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
      expect(result.status).toBe('pending');
    });
  });

  describe('findAll', () => {
    it('deve listar jobs com sucesso', async () => {
      const result = await service.findAll(mockTenantId, {});

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('limit');
    });
  });
});

