import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';
import { PrismaService } from '../database/prisma.service';

describe('HealthService', () => {
  let service: HealthService;
  let mockPrismaService: {
    $queryRaw: jest.Mock;
  };

  beforeEach(async () => {
    mockPrismaService = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkDatabase', () => {
    it('deve retornar true quando banco de dados está conectado', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.checkDatabase();

      expect(result).toBe(true);
      expect(mockPrismaService.$queryRaw).toHaveBeenCalledWith(
        expect.anything(),
      );
    });

    it('deve retornar false quando banco de dados está desconectado', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await service.checkDatabase();

      expect(result).toBe(false);
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('deve retornar false quando ocorre qualquer erro', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Network error'));

      const result = await service.checkDatabase();

      expect(result).toBe(false);
    });
  });

  describe('getHealth', () => {
    it('deve retornar status healthy quando banco está conectado', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getHealth();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('database', 'connected');
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });

    it('deve retornar status unhealthy quando banco está desconectado', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await service.getHealth();

      expect(result).toHaveProperty('status', 'unhealthy');
      expect(result).toHaveProperty('database', 'disconnected');
      expect(result).toHaveProperty('timestamp');
      expect(result.timestamp).toBeDefined();
      expect(typeof result.timestamp).toBe('string');
    });

    it('deve retornar timestamp em formato ISO', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getHealth();

      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });
});
