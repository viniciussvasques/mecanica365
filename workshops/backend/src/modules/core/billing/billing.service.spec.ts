import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { BillingService } from './billing.service';
import { PrismaService } from '../../../database/prisma.service';
import { FeatureFlagsService } from '../feature-flags/feature-flags.service';
import {
  CreateSubscriptionDto,
  SubscriptionPlan,
  SubscriptionStatus,
  BillingCycle,
} from './dto';

describe('BillingService', () => {
  let service: BillingService;

  const mockTenant = {
    id: 'tenant-id',
    name: 'Oficina Teste',
    cnpj: '11222333000181',
    subdomain: 'oficina-teste',
    plan: SubscriptionPlan.WORKSHOPS_STARTER,
    status: 'active',
  };

  const mockSubscription = {
    id: 'subscription-id',
    tenantId: 'tenant-id',
    plan: SubscriptionPlan.WORKSHOPS_STARTER,
    status: SubscriptionStatus.ACTIVE,
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    activeFeatures: ['basic_service_orders', 'basic_customers'],
    serviceOrdersLimit: 50,
    serviceOrdersUsed: 0,
    partsLimit: 100,
    stripeSubscriptionId: null,
    stripeCustomerId: null,
    billingCycle: BillingCycle.MONTHLY,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    subscription: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockFeatureFlagsService = {
    getEnabledFeaturesForPlan: jest.fn(),
  };

  beforeEach(async () => {
    // Mock do FeatureFlagsService retornando features básicas
    mockFeatureFlagsService.getEnabledFeaturesForPlan.mockReturnValue({
      basic_service_orders: { enabled: true, limit: 50 },
      basic_customers: { enabled: true, limit: null },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FeatureFlagsService,
          useValue: mockFeatureFlagsService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateSubscriptionDto = {
      tenantId: 'tenant-id',
      plan: SubscriptionPlan.WORKSHOPS_STARTER,
      billingCycle: BillingCycle.MONTHLY,
    };

    it('deve criar uma subscription com sucesso', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.subscription.findUnique.mockResolvedValue(null);
      mockPrismaService.subscription.create.mockResolvedValue(mockSubscription);
      mockPrismaService.tenant.update.mockResolvedValue(mockTenant);

      const result = await service.create(createDto);

      expect(result).toHaveProperty('id', 'subscription-id');
      expect(result.plan).toBe(SubscriptionPlan.WORKSHOPS_STARTER);
      expect(mockPrismaService.subscription.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se tenant não existe', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException se subscription já existe', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.subscription.findUnique.mockResolvedValue(
        mockSubscription,
      );

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve configurar limites corretos para Starter', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.subscription.findUnique.mockResolvedValue(null);
      mockPrismaService.subscription.create.mockResolvedValue(mockSubscription);
      mockPrismaService.tenant.update.mockResolvedValue(mockTenant);

      await service.create(createDto);

      const createCall = mockPrismaService.subscription.create;
      expect(createCall).toHaveBeenCalledWith({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining({
          serviceOrdersLimit: 50,
          partsLimit: 100,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          activeFeatures: expect.arrayContaining([
            'basic_service_orders',
            'basic_customers',
          ]),
        }),
      });
    });
  });

  describe('findByTenantId', () => {
    it('deve retornar subscription do tenant', async () => {
      mockPrismaService.subscription.findUnique.mockResolvedValue(
        mockSubscription,
      );

      const result = await service.findByTenantId('tenant-id');

      expect(result).toHaveProperty('id', 'subscription-id');
      expect(mockPrismaService.subscription.findUnique).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-id' },
      });
    });

    it('deve lançar NotFoundException se subscription não existe', async () => {
      mockPrismaService.subscription.findUnique.mockResolvedValue(null);

      await expect(service.findByTenantId('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('upgrade', () => {
    it('deve fazer upgrade de Starter para Professional', async () => {
      mockPrismaService.subscription.findUnique.mockResolvedValue(
        mockSubscription,
      );
      mockPrismaService.subscription.update.mockResolvedValue({
        ...mockSubscription,
        plan: SubscriptionPlan.WORKSHOPS_PROFESSIONAL,
      });
      mockPrismaService.tenant.update.mockResolvedValue(mockTenant);

      const result = await service.upgrade(
        'tenant-id',
        SubscriptionPlan.WORKSHOPS_PROFESSIONAL,
      );

      expect(result.plan).toBe(SubscriptionPlan.WORKSHOPS_PROFESSIONAL);
      expect(mockPrismaService.subscription.update).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se tentar downgrade', async () => {
      const professionalSubscription = {
        ...mockSubscription,
        plan: SubscriptionPlan.WORKSHOPS_PROFESSIONAL,
      };
      mockPrismaService.subscription.findUnique.mockResolvedValue(
        professionalSubscription,
      );

      await expect(
        service.upgrade('tenant-id', SubscriptionPlan.WORKSHOPS_STARTER),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('downgrade', () => {
    it('deve fazer downgrade de Professional para Starter', async () => {
      const professionalSubscription = {
        ...mockSubscription,
        plan: SubscriptionPlan.WORKSHOPS_PROFESSIONAL,
      };
      mockPrismaService.subscription.findUnique.mockResolvedValue(
        professionalSubscription,
      );
      mockPrismaService.subscription.update.mockResolvedValue({
        ...professionalSubscription,
        plan: SubscriptionPlan.WORKSHOPS_STARTER,
      });
      mockPrismaService.tenant.update.mockResolvedValue(mockTenant);

      const result = await service.downgrade(
        'tenant-id',
        SubscriptionPlan.WORKSHOPS_STARTER,
      );

      expect(result.plan).toBe(SubscriptionPlan.WORKSHOPS_STARTER);
    });

    it('deve lançar BadRequestException se tentar upgrade', async () => {
      mockPrismaService.subscription.findUnique.mockResolvedValue(
        mockSubscription,
      );

      await expect(
        service.downgrade('tenant-id', SubscriptionPlan.WORKSHOPS_PROFESSIONAL),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('deve cancelar subscription', async () => {
      mockPrismaService.subscription.findUnique.mockResolvedValue(
        mockSubscription,
      );
      mockPrismaService.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      });

      const result = await service.cancel('tenant-id');

      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
    });
  });

  describe('reactivate', () => {
    it('deve reativar subscription cancelada', async () => {
      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      };
      mockPrismaService.subscription.findUnique.mockResolvedValue(
        cancelledSubscription,
      );
      mockPrismaService.subscription.update.mockResolvedValue({
        ...cancelledSubscription,
        status: SubscriptionStatus.ACTIVE,
      });

      const result = await service.reactivate('tenant-id');

      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe('getAvailablePlans', () => {
    it('deve retornar lista de planos disponíveis', () => {
      const plans = service.getAvailablePlans();

      expect(plans).toHaveLength(3);
      expect(plans[0].id).toBe(SubscriptionPlan.WORKSHOPS_STARTER);
      expect(plans[1].id).toBe(SubscriptionPlan.WORKSHOPS_PROFESSIONAL);
      expect(plans[2].id).toBe(SubscriptionPlan.WORKSHOPS_ENTERPRISE);
    });
  });
});
