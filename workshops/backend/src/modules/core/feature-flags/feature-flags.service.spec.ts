import { Test, TestingModule } from '@nestjs/testing';
import { FeatureFlagsService } from './feature-flags.service';
import { PrismaService } from '@database/prisma.service';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;

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

    it('deve testar todas as features do plano starter', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      // Features habilitadas
      expect(await service.isFeatureEnabled(tenantId, 'elevators')).toBe(true);
      expect(await service.isFeatureEnabled(tenantId, 'inventory')).toBe(true);
      expect(await service.isFeatureEnabled(tenantId, 'service_orders')).toBe(
        true,
      );
      expect(await service.isFeatureEnabled(tenantId, 'quotes')).toBe(true);
      expect(await service.isFeatureEnabled(tenantId, 'customers')).toBe(true);
      expect(await service.isFeatureEnabled(tenantId, 'vehicles')).toBe(true);
      expect(await service.isFeatureEnabled(tenantId, 'appointments')).toBe(
        true,
      );

      // Features desabilitadas
      expect(await service.isFeatureEnabled(tenantId, 'diagnostics')).toBe(
        false,
      );
      expect(await service.isFeatureEnabled(tenantId, 'reports')).toBe(false);
      expect(await service.isFeatureEnabled(tenantId, 'suppliers')).toBe(
        false,
      );
      expect(await service.isFeatureEnabled(tenantId, 'parts_catalog')).toBe(
        false,
      );
      expect(await service.isFeatureEnabled(tenantId, 'invoices')).toBe(false);
      expect(await service.isFeatureEnabled(tenantId, 'payments')).toBe(false);
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

    it('deve retornar limites corretos para diferentes features do starter', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      expect(await service.getFeatureLimit(tenantId, 'elevators')).toBe(2);
      expect(await service.getFeatureLimit(tenantId, 'inventory')).toBe(100);
      expect(await service.getFeatureLimit(tenantId, 'service_orders')).toBe(50);
      expect(await service.getFeatureLimit(tenantId, 'customers')).toBe(100);
      expect(await service.getFeatureLimit(tenantId, 'quotes')).toBeNull(); // unlimited
      expect(await service.getFeatureLimit(tenantId, 'vehicles')).toBeNull(); // unlimited
    });

    it('deve usar plan do tenant quando subscription não existe', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_professional',
        subscription: null,
      });

      const result = await service.getFeatureLimit(tenantId, 'elevators');

      expect(result).toBeNull(); // unlimited no professional
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

    it('deve negar acesso se limite foi excedido', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      const result = await service.checkFeatureAccess(
        tenantId,
        'elevators',
        3, // 3 de 2 (limite excedido)
      );

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Limite');
      expect(result.limit).toBe(2);
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

    it('deve permitir acesso para feature ilimitada', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_professional',
        subscription: { plan: 'workshops_professional' },
      });

      const result = await service.checkFeatureAccess(
        tenantId,
        'elevators',
        100, // Qualquer quantidade
      );

      expect(result.allowed).toBe(true);
      expect(result.limit).toBeUndefined();
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

    it('deve retornar objeto vazio se tenant não existe', async () => {
      const tenantId = 'tenant-inexistente';
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      const result = await service.getTenantFeatures(tenantId);

      expect(result).toEqual({});
    });

    it('deve usar plan do tenant quando subscription não existe', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_professional',
        subscription: null,
      });

      const result = await service.getTenantFeatures(tenantId);

      expect(result).toBeDefined();
      expect(result.elevators).toBeDefined();
      expect(result.elevators.enabled).toBe(true);
      expect(result.elevators.unlimited).toBe(true);
    });

    it('deve retornar objeto vazio em caso de erro', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getTenantFeatures(tenantId);

      expect(result).toEqual({});
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
      expect(plans).toHaveLength(3);
    });
  });

  describe('getEnabledFeaturesForPlan', () => {
    it('deve retornar features habilitadas para workshops_starter', () => {
      const features = service.getEnabledFeaturesForPlan('workshops_starter');

      expect(features).toBeDefined();
      expect(features.elevators).toBeDefined();
      expect(features.elevators.enabled).toBe(true);
      expect(features.elevators.limit).toBe(2);
      expect(features.diagnostics).toBeDefined();
      expect(features.diagnostics.enabled).toBe(false);
    });

    it('deve retornar features habilitadas para workshops_professional', () => {
      const features = service.getEnabledFeaturesForPlan(
        'workshops_professional',
      );

      expect(features).toBeDefined();
      expect(features.elevators).toBeDefined();
      expect(features.elevators.enabled).toBe(true);
      expect(features.elevators.unlimited).toBe(true);
      expect(features.diagnostics).toBeDefined();
      expect(features.diagnostics.enabled).toBe(true);
    });

    it('deve retornar features habilitadas para workshops_enterprise', () => {
      const features = service.getEnabledFeaturesForPlan('workshops_enterprise');

      expect(features).toBeDefined();
      expect(features.reports).toBeDefined();
      expect(features.reports.enabled).toBe(true);
      expect(features.invoices).toBeDefined();
      expect(features.invoices.enabled).toBe(true);
      expect(features.payments).toBeDefined();
      expect(features.payments.enabled).toBe(true);
    });

    it('deve retornar objeto vazio para plano inválido', () => {
      const features = service.getEnabledFeaturesForPlan('invalid_plan');

      expect(features).toEqual({});
    });
  });

  describe('error handling', () => {
    it('deve retornar false em isFeatureEnabled quando ocorre erro', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.isFeatureEnabled(tenantId, 'elevators');

      expect(result).toBe(false);
    });

    it('deve retornar null em getFeatureLimit quando ocorre erro', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.getFeatureLimit(tenantId, 'elevators');

      expect(result).toBeNull();
    });

    it('deve retornar null em getFeatureLimit quando tenant não existe', async () => {
      const tenantId = 'tenant-inexistente';
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      const result = await service.getFeatureLimit(tenantId, 'elevators');

      expect(result).toBeNull();
    });

    it('deve usar plan do tenant quando subscription não existe', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_professional',
        subscription: null,
      });

      const result = await service.isFeatureEnabled(tenantId, 'elevators');

      expect(result).toBe(true);
    });

    it('deve verificar limite quando currentCount é undefined', async () => {
      const tenantId = 'tenant-1';
      mockPrismaService.tenant.findUnique.mockResolvedValue({
        id: tenantId,
        plan: 'workshops_starter',
        subscription: { plan: 'workshops_starter' },
      });

      const result = await service.checkFeatureAccess(tenantId, 'elevators');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(2);
    });
  });
});
