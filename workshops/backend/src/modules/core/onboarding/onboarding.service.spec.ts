import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../../../database/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { BillingService } from '../billing/billing.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../shared/email/email.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import {
  TenantStatus,
  TenantPlan,
  DocumentType,
} from '../tenants/dto/create-tenant.dto';
import {
  BillingCycle,
  SubscriptionPlan,
} from '../billing/dto/subscription-response.dto';
import Stripe from 'stripe';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prismaService: jest.Mocked<PrismaService>;
  let tenantsService: jest.Mocked<TenantsService>;
  let billingService: jest.Mocked<BillingService>;
  let usersService: jest.Mocked<UsersService>;
  let emailService: jest.Mocked<EmailService>;

  const mockTenant = {
    id: 'tenant-id',
    name: 'Oficina Teste',
    documentType: 'cnpj',
    document: '12345678000199',
    subdomain: 'oficina-teste',
    plan: TenantPlan.WORKSHOPS_STARTER,
    status: TenantStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      tenant: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const mockTenantsService = {
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
    };

    const mockBillingService = {
      findByTenantId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const mockUsersService = {
      create: jest.fn(),
    };

    const mockEmailService = {
      sendWelcomeEmail: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TenantsService, useValue: mockTenantsService },
        { provide: BillingService, useValue: mockBillingService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    prismaService = module.get(PrismaService);
    tenantsService = module.get(TenantsService);
    billingService = module.get(BillingService);
    usersService = module.get(UsersService);
    emailService = module.get(EmailService);

    // Mock Stripe
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkPendingTenant', () => {
    it('deve retornar tenant pendente se existir', async () => {
      (prismaService.tenant.findFirst as jest.Mock).mockResolvedValue({
        id: 'tenant-id',
        subdomain: 'oficina-teste',
      } as unknown);

      const result = await service.checkPendingTenant(
        '12345678000199',
        'test@email.com',
      );

      expect(result).toEqual({
        tenantId: 'tenant-id',
        subdomain: 'oficina-teste',
        exists: true,
      });
    });

    it('deve retornar null se não existir tenant pendente', async () => {
      (prismaService.tenant.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.checkPendingTenant(
        '12345678000199',
        'test@email.com',
      );

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    const createOnboardingDto: CreateOnboardingDto = {
      name: 'Oficina Teste',
      email: 'admin@oficina.com',
      documentType: DocumentType.CNPJ,
      document: '12345678000199',
      subdomain: 'oficina-teste',
      plan: TenantPlan.WORKSHOPS_STARTER,
      password: 'TestPassword123',
    };

    it('deve retornar tenant existente se já houver pendente', async () => {
      (prismaService.tenant.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-tenant-id',
        subdomain: 'oficina-teste',
      } as unknown);

      const result = await service.register(createOnboardingDto);

      expect(result).toEqual({
        tenantId: 'existing-tenant-id',
        subdomain: 'oficina-teste',
      });
      expect((tenantsService.create as jest.Mock).mock.calls.length).toBe(0);
    });

    it('deve criar novo tenant se não existir pendente', async () => {
      (prismaService.tenant.findFirst as jest.Mock).mockResolvedValue(null);
      (tenantsService.create as jest.Mock).mockResolvedValue({
        id: 'new-tenant-id',
        subdomain: 'oficina-teste',
      });

      const result = await service.register(createOnboardingDto);

      expect(result).toEqual({
        tenantId: 'new-tenant-id',
        subdomain: 'oficina-teste',
      });
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(tenantsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: createOnboardingDto.name,
          documentType: createOnboardingDto.documentType,
          document: createOnboardingDto.document,
          subdomain: createOnboardingDto.subdomain,
          plan: createOnboardingDto.plan,
          status: TenantStatus.PENDING,
        }),
      );
    });
  });

  describe('createCheckoutSession', () => {
    const createCheckoutDto: CreateCheckoutDto = {
      tenantId: 'tenant-id',
      plan: SubscriptionPlan.WORKSHOPS_STARTER,
      billingCycle: BillingCycle.MONTHLY,
    };

    it('deve lançar erro se Stripe não estiver configurado', async () => {
      process.env.STRIPE_SECRET_KEY = '';
      const mockConfigService = {
        get: jest.fn(),
      };
      const serviceWithoutStripe = new OnboardingService(
        prismaService,
        tenantsService,
        billingService,
        usersService,
        emailService,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockConfigService as any as ConfigService,
      );

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(
        mockTenant as unknown,
      );

      await expect(
        serviceWithoutStripe.createCheckoutSession(createCheckoutDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se tenant não for encontrado', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createCheckoutSession(createCheckoutDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se tenant não estiver pendente', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.ACTIVE,
      });

      await expect(
        service.createCheckoutSession(createCheckoutDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('handleCheckoutCompleted', () => {
    const mockSession: Partial<Stripe.Checkout.Session> = {
      id: 'cs_test_123',
      customer: 'cus_test_123',
      subscription: 'sub_test_123',
      metadata: {
        tenantId: 'tenant-id',
        tenantName: 'Oficina Teste',
        tenantEmail: 'admin@oficina.com',
        plan: TenantPlan.WORKSHOPS_STARTER,
        billingCycle: BillingCycle.MONTHLY,
      },
    };

    it('deve lançar erro se metadata não existir', async () => {
      const sessionWithoutMetadata = { ...mockSession, metadata: null };

      await expect(
        service.handleCheckoutCompleted(
          sessionWithoutMetadata as Stripe.Checkout.Session,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se tenantId não existir na metadata', async () => {
      const sessionWithoutTenantId = {
        ...mockSession,
        metadata: { ...mockSession.metadata, tenantId: undefined },
      };

      await expect(
        service.handleCheckoutCompleted(
          sessionWithoutTenantId as unknown as Stripe.Checkout.Session,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se tenant não for encontrado', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.handleCheckoutCompleted(mockSession as Stripe.Checkout.Session),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve retornar early se tenant já foi processado', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.ACTIVE,
        users: [],
      } as unknown);

      await service.handleCheckoutCompleted(
        mockSession as Stripe.Checkout.Session,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(tenantsService.update as jest.Mock).not.toHaveBeenCalled();
    });
  });
});
