import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsService, FeatureName } from './feature-flags.service';
import { PrismaService } from '@database/prisma.service';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isFeatureEnabled', () => {
    it('deve retornar true se feature está habilitada no plano', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      const result = await service.isFeatureEnabled(tenantId, 'elevators');

      expect(result).toBe(true);
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: tenantId },
        include: { subscription: true },
      });
    });

    it('deve retornar false se feature não está habilitada no plano', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      const result = await service.isFeatureEnabled(tenantId, 'diagnostics');

      expect(result).toBe(false);
    });

    it('deve retornar false se tenant não existe', async () => {
      const tenantId = 'tenant-inexistente';
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      const result = await service.isFeatureEnabled(tenantId, 'elevators');

      expect(result).toBe(false);
    });
  });

  describe('getFeatureLimit', () => {
    it('deve retornar o limite correto para o plano', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      const result = await service.getFeatureLimit(tenantId, 'elevators');

      expect(result).toBe(2);
    });

    it('deve retornar null se feature é ilimitada', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_professional',
        subscription: { plan: 'workshops_professional' },
      });

      const result = await service.getFeatureLimit(tenantId, 'elevators');

      expect(result).toBeNull();
    });

    it('deve retornar null se feature não está habilitada', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      const result = await service.getFeatureLimit(tenantId, 'diagnostics');

      expect(result).toBeNull();
    });
  });

  describe('checkFeatureAccess', () => {
    it('deve permitir acesso se feature está habilitada e dentro do limite', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      const result = await service.checkFeatureAccess(
        tenantId,
        'elevators',
        1, // 1 de 2
      );

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(2);
    });

    it('deve negar acesso se limite foi atingido', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      const result = await service.checkFeatureAccess(
        tenantId,
        'elevators',
        2, // 2 de 2 (limite atingido)
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Limite');
    });

    it('deve negar acesso se feature não está habilitada', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      const result = await service.checkFeatureAccess(tenantId, 'diagnostics');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('não está habilitada');
    });
  });

  describe('getTenantFeatures', () => {
    it('deve retornar todas as features do plano do tenant', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      const result = await service.getTenantFeatures(tenantId);

      expect(result).toBeDefined();
      expect(result.elevators).toBeDefined();
      expect(result.elevators.enabled).toBe(true);
      expect(result.elevators.limit).toBe(2);
    });
  });

  describe('isValidPlan', () => {
    it('deve retornar true para planos válidos', () => {
      expect(service.isValidPlan('workshops_starter')).toBe(true);
      expect(service.isValidPlan('workshops_professional')).toBe(true);
      expect(service.isValidPlan('workshops_enterprise')).toBe(true);
    });

    it('deve retornar false para planos inválidos', () => {
      expect(service.isValidPlan('invalid_plan')).toBe(false);
    });
  });

  describe('getAvailablePlans', () => {
    it('deve retornar lista de planos disponíveis', () => {
      const plans = service.getAvailablePlans();

      expect(plans).toContain('workshops_starter');
      expect(plans).toContain('workshops_professional');
      expect(plans).toContain('workshops_enterprise');
    });
  });
});
