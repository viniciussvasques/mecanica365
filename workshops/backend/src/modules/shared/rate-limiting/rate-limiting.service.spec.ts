import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RateLimitingService } from './rate-limiting.service';

describe('RateLimitingService', () => {
  let service: RateLimitingService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitingService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RateLimitingService>(RateLimitingService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('deve retornar configuração padrão quando variáveis não definidas', () => {
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue: unknown) => {
          return defaultValue;
        },
      );

      const config = service.getConfig();

      expect(config.ttl).toBe(60000); // 1 minuto padrão
      expect(config.limit).toBe(100); // 100 requisições padrão
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_TTL', 60000);
      expect(mockConfigService.get).toHaveBeenCalledWith('RATE_LIMIT_MAX', 100);
    });

    it('deve retornar configuração customizada quando variáveis definidas', () => {
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue: unknown) => {
          if (key === 'RATE_LIMIT_TTL') return 120000;
          if (key === 'RATE_LIMIT_MAX') return 200;
          return defaultValue;
        },
      );

      const config = service.getConfig();

      expect(config.ttl).toBe(120000);
      expect(config.limit).toBe(200);
    });

    it('deve retornar valores diferentes para TTL e limit', () => {
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue: unknown) => {
          if (key === 'RATE_LIMIT_TTL') return 30000;
          if (key === 'RATE_LIMIT_MAX') return 50;
          return defaultValue;
        },
      );

      const config = service.getConfig();

      expect(config.ttl).toBe(30000);
      expect(config.limit).toBe(50);
      expect(config.ttl).not.toBe(config.limit);
    });

    it('deve usar valores padrão quando config retorna undefined', () => {
      mockConfigService.get.mockImplementation(
        (key: string, defaultValue: unknown) => {
          // Quando retorna undefined, o ConfigService usa o defaultValue
          return defaultValue;
        },
      );

      const config = service.getConfig();

      expect(config).toHaveProperty('ttl', 60000);
      expect(config).toHaveProperty('limit', 100);
    });
  });

  describe('shouldBlock', () => {
    it('deve retornar false (não bloquear)', () => {
      const result = service.shouldBlock('identifier');

      expect(result).toBe(false);
    });

    it('deve retornar false para qualquer identificador', () => {
      const identifiers = [
        'user-123',
        'ip-192.168.1.1',
        'tenant-abc',
        '',
        'special-chars-!@#$%',
      ];

      identifiers.forEach((identifier) => {
        const result = service.shouldBlock(identifier);
        expect(result).toBe(false);
      });
    });

    it('deve sempre retornar false independente do identificador', () => {
      expect(service.shouldBlock('test1')).toBe(false);
      expect(service.shouldBlock('test2')).toBe(false);
      expect(service.shouldBlock('test3')).toBe(false);
    });
  });
});



