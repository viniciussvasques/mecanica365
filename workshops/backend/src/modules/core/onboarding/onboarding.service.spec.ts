import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
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
import { UserRole } from '../users/dto/create-user.dto';
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
        findMany: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      subscription: {
        findFirst: jest.fn(),
      },
    };

    const mockTenantsService = {
      create: jest.fn(),
      update: jest.fn(),
      findOne: jest.fn(),
      suspend: jest.fn(),
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
      sendPaymentFailedEmail: jest.fn(),
      sendInvoicePaymentSucceededEmail: jest.fn(),
      sendInvoiceUpcomingEmail: jest.fn(),
      sendSubscriptionCancelledEmail: jest.fn(),
      sendSubscriptionUpdatedEmail: jest.fn(),
      sendTrialEndingEmail: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    // Configurar STRIPE_SECRET_KEY antes de criar o módulo
    if (!process.env.STRIPE_SECRET_KEY) {
      process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    }

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
    jest.resetAllMocks();
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
      // Salvar o valor original
      const originalKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      // Criar um novo módulo sem Stripe configurado
      const moduleWithoutStripe: TestingModule = await Test.createTestingModule(
        {
          providers: [
            OnboardingService,
            { provide: PrismaService, useValue: prismaService },
            { provide: TenantsService, useValue: tenantsService },
            { provide: BillingService, useValue: billingService },
            { provide: UsersService, useValue: usersService },
            { provide: EmailService, useValue: emailService },
            { provide: ConfigService, useValue: { get: jest.fn() } },
          ],
        },
      ).compile();

      const serviceWithoutStripe =
        moduleWithoutStripe.get<OnboardingService>(OnboardingService);

      // Restaurar o valor original
      if (originalKey) {
        process.env.STRIPE_SECRET_KEY = originalKey;
      }

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

    it('deve criar checkout session com sucesso', async () => {
      const createCheckoutDtoLocal: CreateCheckoutDto = {
        tenantId: 'tenant-id',
        plan: SubscriptionPlan.WORKSHOPS_STARTER,
        billingCycle: BillingCycle.MONTHLY,
      };

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: 'admin@oficina.com',
      } as unknown);
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock Stripe checkout session
      const mockStripeSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
        status: 'open',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const mockStripe = (service as any).stripe;
      if (mockStripe) {
        mockStripe.checkout = {
          sessions: {
            create: jest.fn().mockResolvedValue(mockStripeSession),
          },
        };
      }

      const result = await service.createCheckoutSession(
        createCheckoutDtoLocal,
      );

      expect(result).toEqual({
        sessionId: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });
    });

    it('deve processar checkout completo com criação de subscription e usuário', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: 'admin@oficina.com',
        users: [],
      } as unknown);
      (billingService.findByTenantId as jest.Mock).mockRejectedValue(
        new NotFoundException('Subscription not found'),
      );
      (billingService.create as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
      });
      (usersService.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'admin@oficina.com',
        name: 'Admin',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'admin@oficina.com',
        name: 'Admin',
        role: UserRole.ADMIN,
      });
      (emailService.sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);

      await service.handleCheckoutCompleted(
        mockSession as Stripe.Checkout.Session,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(tenantsService.update).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(billingService.create).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.create).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    });

    it('deve atualizar subscription existente ao processar checkout', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: 'admin@oficina.com',
        users: [],
      } as unknown);
      (billingService.findByTenantId as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
      });
      (billingService.update as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
      });
      (usersService.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'admin@oficina.com',
        name: 'Admin',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'admin@oficina.com',
        name: 'Admin',
        role: UserRole.ADMIN,
      });
      (emailService.sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);

      await service.handleCheckoutCompleted(
        mockSession as Stripe.Checkout.Session,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(billingService.update).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(billingService.create).not.toHaveBeenCalled();
    });

    it('deve usar email do tenant.adminEmail quando disponível', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: 'admin@oficina.com',
        users: [],
      } as unknown);
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      const mockStripeSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
        status: 'open',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const mockStripe = (service as any).stripe;
      if (mockStripe) {
        mockStripe.checkout = {
          sessions: {
            create: jest.fn().mockResolvedValue(mockStripeSession),
          },
        };
      }

      const createCheckoutDtoLocal: CreateCheckoutDto = {
        tenantId: 'tenant-id',
        plan: SubscriptionPlan.WORKSHOPS_STARTER,
        billingCycle: BillingCycle.MONTHLY,
      };

      await service.createCheckoutSession(createCheckoutDtoLocal);

      // Verificar se o email do tenant foi usado
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: 'admin@oficina.com',
        }),
      );
    });

    it('deve usar email do usuário existente quando adminEmail não estiver disponível', async () => {
      const createCheckoutDtoLocal: CreateCheckoutDto = {
        tenantId: 'tenant-id',
        plan: SubscriptionPlan.WORKSHOPS_STARTER,
        billingCycle: BillingCycle.MONTHLY,
      };

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: null,
        users: [],
      } as unknown);
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
        email: 'user@oficina.com',
      });

      const mockStripeSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
        status: 'open',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const mockStripe = (service as any).stripe;
      if (mockStripe) {
        mockStripe.checkout = {
          sessions: {
            create: jest.fn().mockResolvedValue(mockStripeSession),
          },
        };
      }

      await service.createCheckoutSession(createCheckoutDtoLocal);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: 'user@oficina.com',
        }),
      );
    });

    it('deve usar email temporário quando nenhum email estiver disponível', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: null,
        name: 'Oficina Teste',
        users: [],
      } as unknown);
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      const mockStripeSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
        status: 'open',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const mockStripe = (service as any).stripe;
      if (mockStripe) {
        mockStripe.checkout = {
          sessions: {
            create: jest.fn().mockResolvedValue(mockStripeSession),
          },
        };
      }

      const createCheckoutDtoLocal: CreateCheckoutDto = {
        tenantId: 'tenant-id',
        plan: SubscriptionPlan.WORKSHOPS_STARTER,
        billingCycle: BillingCycle.MONTHLY,
      };

      await service.createCheckoutSession(createCheckoutDtoLocal);

      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: expect.stringContaining('@temp.com'),
        }),
      );
    });

    it('deve lançar erro se session.url não estiver disponível', async () => {
      const createCheckoutDtoLocal: CreateCheckoutDto = {
        tenantId: 'tenant-id',
        plan: SubscriptionPlan.WORKSHOPS_STARTER,
        billingCycle: BillingCycle.MONTHLY,
      };

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: 'admin@oficina.com',
        users: [],
      } as unknown);
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

      const mockStripeSession = {
        id: 'cs_test_123',
        url: null,
        status: 'open',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const mockStripe = (service as any).stripe;
      if (mockStripe) {
        mockStripe.checkout = {
          sessions: {
            create: jest.fn().mockResolvedValue(mockStripeSession),
          },
        };
      }

      await expect(
        service.createCheckoutSession(createCheckoutDtoLocal),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve processar checkout quando usuário admin já existe', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: 'admin@oficina.com',
        users: [
          {
            id: 'user-id',
            email: 'admin@oficina.com',
            name: 'Admin',
            role: UserRole.ADMIN,
          },
        ],
      } as unknown);
      (billingService.findByTenantId as jest.Mock).mockRejectedValue(
        new NotFoundException('Subscription not found'),
      );
      (billingService.create as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
      });
      (emailService.sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);

      await service.handleCheckoutCompleted(
        mockSession as Stripe.Checkout.Session,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.create).not.toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendWelcomeEmail).not.toHaveBeenCalled();
    });

    it('deve lançar erro se billingService.findByTenantId lançar erro diferente de NotFoundException', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: 'admin@oficina.com',
        users: [],
      } as unknown);
      (billingService.findByTenantId as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.handleCheckoutCompleted(mockSession as Stripe.Checkout.Session),
      ).rejects.toThrow(Error);
    });

    it('deve lançar erro se newAdminUser for null após criação', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: 'admin@oficina.com',
        users: [],
      } as unknown);
      (billingService.findByTenantId as jest.Mock).mockRejectedValue(
        new NotFoundException('Subscription not found'),
      );
      (billingService.create as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
      });
      (usersService.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'admin@oficina.com',
        name: 'Admin',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.handleCheckoutCompleted(mockSession as Stripe.Checkout.Session),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve usar email da session.customer_email quando tenantEmail não estiver disponível', async () => {
      const sessionWithEmail = {
        ...mockSession,
        customer_email: 'customer@email.com',
        metadata: {
          tenantId: 'tenant-id',
          tenantName: 'Oficina Teste',
          plan: TenantPlan.WORKSHOPS_STARTER,
          billingCycle: BillingCycle.MONTHLY,
        },
      };

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: null,
        name: 'Oficina Teste',
        users: [],
      } as unknown);
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (billingService.findByTenantId as jest.Mock).mockRejectedValue(
        new NotFoundException('Subscription not found'),
      );
      (billingService.create as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
      });
      (usersService.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'customer@email.com',
        name: 'Admin',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'customer@email.com',
        name: 'Admin',
        role: UserRole.ADMIN,
      });
      (emailService.sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);

      await service.handleCheckoutCompleted(
        sessionWithEmail as Stripe.Checkout.Session,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(usersService.create).toHaveBeenCalledWith(
        'tenant-id',
        expect.objectContaining({
          email: 'customer@email.com',
        }),
      );
    });
  });

  describe('handleAsyncPaymentFailed', () => {
    const mockSession: Partial<Stripe.Checkout.Session> = {
      id: 'cs_test_123',
      customer: 'cus_test_123',
      metadata: {
        tenantId: 'tenant-id',
      },
      amount_total: 4990,
      currency: 'brl',
      invoice: 'in_test_123',
    };

    it('deve retornar early se metadata não existir', async () => {
      const sessionWithoutMetadata = { ...mockSession, metadata: null };

      (emailService.sendPaymentFailedEmail as jest.Mock).mockClear();

      await service.handleAsyncPaymentFailed(
        sessionWithoutMetadata as Stripe.Checkout.Session,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).not.toHaveBeenCalled();
    });

    it('deve retornar early se tenantId não existir na metadata', async () => {
      const sessionWithoutTenantId = {
        ...mockSession,
        metadata: {},
      };

      (emailService.sendPaymentFailedEmail as jest.Mock).mockClear();

      await service.handleAsyncPaymentFailed(
        sessionWithoutTenantId as Stripe.Checkout.Session,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).not.toHaveBeenCalled();
    });

    it('deve retornar early se tenant não for encontrado', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await service.handleAsyncPaymentFailed(
        mockSession as Stripe.Checkout.Session,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).not.toHaveBeenCalled();
    });

    it('deve enviar email de pagamento falhado', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        users: [
          {
            id: 'user-id',
            email: 'admin@oficina.com',
            name: 'Admin',
            role: UserRole.ADMIN,
          },
        ],
      } as unknown);
      (emailService.sendPaymentFailedEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.handleAsyncPaymentFailed(
        mockSession as Stripe.Checkout.Session,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@oficina.com',
          retryUrl: expect.stringContaining('/onboarding/checkout'),
        }),
      );
    });
  });

  describe('handleChargeFailed', () => {
    const mockCharge = {
      id: 'ch_test_123',
      customer: 'cus_test_123',
      amount: 4990,
      currency: 'brl',
      billing_details: {
        email: 'admin@oficina.com',
      },
    } as unknown as Stripe.Charge;

    it('deve retornar early se customerId não for encontrado', async () => {
      const chargeWithoutCustomer = {
        ...mockCharge,
        customer: null,
      } as unknown as Stripe.Charge;

      await service.handleChargeFailed(chargeWithoutCustomer);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).not.toHaveBeenCalled();
    });

    it('deve retornar early se tenant não for encontrado', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([]);
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.tenant.findFirst as jest.Mock).mockResolvedValue(null);

      await service.handleChargeFailed(mockCharge);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).not.toHaveBeenCalled();
    });
  });

  describe('handlePaymentIntentFailed', () => {
    const mockPaymentIntent: Partial<Stripe.PaymentIntent> = {
      id: 'pi_test_123',
      customer: 'cus_test_123',
      amount: 4990,
      currency: 'brl',
      payment_method_types: ['card'],
    };

    it('deve retornar early se customerId não for encontrado', async () => {
      const paymentIntentWithoutCustomer = {
        ...mockPaymentIntent,
        customer: null,
      };

      await service.handlePaymentIntentFailed(
        paymentIntentWithoutCustomer as Stripe.PaymentIntent,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).not.toHaveBeenCalled();
    });

    it('deve retornar early se tenant não for encontrado', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([]);

      await service.handlePaymentIntentFailed(
        mockPaymentIntent as Stripe.PaymentIntent,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).not.toHaveBeenCalled();
    });
  });

  describe('handleInvoicePaymentFailed', () => {
    const mockInvoice = {
      id: 'in_test_123',
      customer: 'cus_test_123',
      subscription: 'sub_test_123',
    } as unknown as Stripe.Invoice;

    it('deve retornar early se customerId e subscriptionId não forem encontrados', async () => {
      const invoiceWithoutIds = {
        ...mockInvoice,
        customer: null,
        subscription: null,
      };

      await service.handleInvoicePaymentFailed(invoiceWithoutIds);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).not.toHaveBeenCalled();
    });

    it('deve retornar early se tenant não for encontrado', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([]);

      await service.handleInvoicePaymentFailed(mockInvoice);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).not.toHaveBeenCalled();
    });
  });

  describe('handleInvoicePaymentSucceeded', () => {
    const mockInvoice = {
      id: 'in_test_123',
      customer: 'cus_test_123',
      subscription: 'sub_test_123',
    } as unknown as Stripe.Invoice;

    it('deve retornar early se customerId e subscriptionId não forem encontrados', async () => {
      const invoiceWithoutIds = {
        ...mockInvoice,
        customer: null,
        subscription: null,
      };

      await service.handleInvoicePaymentSucceeded(invoiceWithoutIds);

      expect(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        emailService.sendInvoicePaymentSucceededEmail,
      ).not.toHaveBeenCalled();
    });

    it('deve retornar early se tenant não for encontrado', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([]);

      await service.handleInvoicePaymentSucceeded(mockInvoice);

      expect(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        emailService.sendInvoicePaymentSucceededEmail,
      ).not.toHaveBeenCalled();
    });
  });

  describe('handleInvoiceUpcoming', () => {
    const mockInvoice = {
      id: 'in_test_123',
      customer: 'cus_test_123',
      subscription: 'sub_test_123',
    } as unknown as Stripe.Invoice;

    it('deve retornar early se customerId e subscriptionId não forem encontrados', async () => {
      const invoiceWithoutIds = {
        ...mockInvoice,
        customer: null,
        subscription: null,
      };

      await service.handleInvoiceUpcoming(invoiceWithoutIds);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendInvoiceUpcomingEmail).not.toHaveBeenCalled();
    });

    it('deve retornar early se tenant não for encontrado', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([]);

      await service.handleInvoiceUpcoming(mockInvoice);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendInvoiceUpcomingEmail).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionDeleted', () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_test_123',
      customer: 'cus_test_123',
    };

    it('deve retornar early se tenant não for encontrado', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([]);

      await service.handleSubscriptionDeleted(
        mockSubscription as Stripe.Subscription,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(tenantsService.suspend).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionUpdated', () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_test_123',
      customer: 'cus_test_123',
    };

    it('deve retornar early se tenant não for encontrado', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([]);

      await service.handleSubscriptionUpdated(
        mockSubscription as Stripe.Subscription,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(billingService.update).not.toHaveBeenCalled();
    });
  });

  describe('handleTrialWillEnd', () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_test_123',
      customer: 'cus_test_123',
    };

    it('deve retornar early se tenant não for encontrado', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([]);

      await service.handleTrialWillEnd(mockSubscription as Stripe.Subscription);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendTrialEndingEmail).not.toHaveBeenCalled();
    });

    it('deve processar trial will end com sucesso', async () => {
      const mockSubscriptionWithItems = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        trial_end: Math.floor(Date.now() / 1000) + 86400,
        items: {
          data: [
            {
              price: {
                unit_amount: 4990,
                currency: 'brl',
              },
            },
          ],
        },
      } as unknown as Stripe.Subscription;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        plan: 'workshops_starter',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [
            {
              id: 'user-id',
              email: 'admin@oficina.com',
              name: 'Admin',
              role: UserRole.ADMIN,
            },
          ],
        },
      });

      (emailService.sendTrialEndingEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.handleTrialWillEnd(mockSubscriptionWithItems);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendTrialEndingEmail).toHaveBeenCalled();
    });
  });

  describe('findTenantByStripeId - casos de sucesso', () => {
    it('deve encontrar tenant por subscription', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        plan: 'workshops_starter',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodEnd: new Date(),
        stripeSubscriptionId: 'sub_test_123',
        stripeCustomerId: 'cus_test_123',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          status: 'active',
          users: [
            {
              id: 'user-id',
              email: 'admin@oficina.com',
              name: 'Admin',
              role: UserRole.ADMIN,
            },
          ],
        },
      });

      // Testar indiretamente via handlePaymentIntentFailed
      const mockPaymentIntent = {
        id: 'pi_test_123',
        customer: 'cus_test_123',
        amount: 4990,
        currency: 'brl',
        payment_method_types: ['card'],
      } as unknown as Stripe.PaymentIntent;

      (emailService.sendPaymentFailedEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.handlePaymentIntentFailed(mockPaymentIntent);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalled();
    });

    it('deve encontrar tenant pendente quando não encontrar por subscription', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          status: 'pending',
          users: [
            {
              id: 'user-id',
              email: 'admin@oficina.com',
              name: 'Admin',
              role: UserRole.ADMIN,
            },
          ],
        },
      ]);

      // Testar indiretamente via handleChargeFailed
      const mockCharge = {
        id: 'ch_test_123',
        customer: 'cus_test_123',
        amount: 4990,
        currency: 'brl',
        billing_details: {
          email: 'admin@oficina.com',
        },
      } as unknown as Stripe.Charge;

      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prismaService.tenant.findFirst as jest.Mock).mockResolvedValue({
        id: 'tenant-id',
        subdomain: 'oficina-teste',
        status: 'pending',
        users: [
          {
            id: 'user-id',
            email: 'admin@oficina.com',
            name: 'Admin',
            role: UserRole.ADMIN,
          },
        ],
      });

      (emailService.sendPaymentFailedEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.handleChargeFailed(mockCharge);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalled();
    });
  });

  describe('handleInvoicePaymentFailed - caso de sucesso', () => {
    it('deve processar invoice payment failed com sucesso', async () => {
      const mockInvoice = {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        amount_due: 4990,
        currency: 'brl',
        hosted_invoice_url: 'https://invoice.stripe.com/test',
      } as unknown as Stripe.Invoice;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [
            {
              id: 'user-id',
              email: 'admin@oficina.com',
              name: 'Admin',
              role: UserRole.ADMIN,
            },
          ],
        },
      });

      (billingService.update as jest.Mock).mockResolvedValue(undefined);

      (emailService.sendPaymentFailedEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.handleInvoicePaymentFailed(mockInvoice);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(billingService.update).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalled();
    });
  });

  describe('handleInvoicePaymentSucceeded - caso de sucesso', () => {
    it('deve processar invoice payment succeeded com sucesso', async () => {
      const mockInvoice = {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        amount_paid: 4990,
        currency: 'brl',
        number: 'INV-123',
        hosted_invoice_url: 'https://invoice.stripe.com/test',
      } as unknown as Stripe.Invoice;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [
            {
              id: 'user-id',
              email: 'admin@oficina.com',
              name: 'Admin',
              role: UserRole.ADMIN,
            },
          ],
        },
      });

      (billingService.update as jest.Mock).mockResolvedValue(undefined);

      (billingService.findByTenantId as jest.Mock).mockResolvedValue({
        currentPeriodEnd: new Date(),
      });

      (
        emailService.sendInvoicePaymentSucceededEmail as jest.Mock
      ).mockResolvedValue(undefined);

      await service.handleInvoicePaymentSucceeded(mockInvoice);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(billingService.update).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendInvoicePaymentSucceededEmail).toHaveBeenCalled();
    });
  });

  describe('handleInvoiceUpcoming - caso de sucesso', () => {
    it('deve processar invoice upcoming com sucesso', async () => {
      const mockInvoice = {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        amount_due: 4990,
        currency: 'brl',
        due_date: Math.floor(Date.now() / 1000) + 86400,
        hosted_invoice_url: 'https://invoice.stripe.com/test',
      } as unknown as Stripe.Invoice;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [
            {
              id: 'user-id',
              email: 'admin@oficina.com',
              name: 'Admin',
              role: UserRole.ADMIN,
            },
          ],
        },
      });

      (emailService.sendInvoiceUpcomingEmail as jest.Mock).mockResolvedValue(
        undefined,
      );

      await service.handleInvoiceUpcoming(mockInvoice);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendInvoiceUpcomingEmail).toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionDeleted - caso de sucesso', () => {
    it('deve processar subscription deleted com sucesso', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        canceled_at: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      } as unknown as Stripe.Subscription;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        plan: 'workshops_starter',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [
            {
              id: 'user-id',
              email: 'admin@oficina.com',
              name: 'Admin',
              role: UserRole.ADMIN,
            },
          ],
        },
      });

      (billingService.update as jest.Mock).mockResolvedValue(undefined);

      (tenantsService.suspend as jest.Mock).mockResolvedValue(undefined);

      (
        emailService.sendSubscriptionCancelledEmail as jest.Mock
      ).mockResolvedValue(undefined);

      await service.handleSubscriptionDeleted(mockSubscription);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(billingService.update).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(tenantsService.suspend).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendSubscriptionCancelledEmail).toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionUpdated - caso de sucesso', () => {
    it('deve processar subscription updated com sucesso', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        items: {
          data: [
            {
              price: {
                nickname: 'workshops_starter',
                recurring: { interval: 'month' },
                unit_amount: 4990,
                currency: 'brl',
              },
            },
          ],
        },
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      } as unknown as Stripe.Subscription;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        plan: 'workshops_starter',
        status: 'active',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [
            {
              id: 'user-id',
              email: 'admin@oficina.com',
              name: 'Admin',
              role: UserRole.ADMIN,
            },
          ],
        },
      });

      (billingService.update as jest.Mock).mockResolvedValue(undefined);

      (
        emailService.sendSubscriptionUpdatedEmail as jest.Mock
      ).mockResolvedValue(undefined);

      await service.handleSubscriptionUpdated(mockSubscription);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(billingService.update).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendSubscriptionUpdatedEmail).toHaveBeenCalled();
    });

    it('deve retornar early se adminUser não for encontrado', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        items: {
          data: [
            {
              price: {
                nickname: 'workshops_starter',
                recurring: { interval: 'month' },
                unit_amount: 4990,
                currency: 'brl',
              },
            },
          ],
        },
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      } as unknown as Stripe.Subscription;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        plan: 'workshops_starter',
        status: 'active',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [],
        },
      });

      await service.handleSubscriptionUpdated(mockSubscription);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(billingService.update).not.toHaveBeenCalled();
    });

    it('deve retornar early se dbSubscription não for encontrado', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        status: 'active',
        items: {
          data: [
            {
              price: {
                nickname: 'workshops_starter',
                recurring: { interval: 'month' },
                unit_amount: 4990,
                currency: 'brl',
              },
            },
          ],
        },
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      } as unknown as Stripe.Subscription;

      // findTenantByStripeId retorna null quando não encontra subscription
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          status: 'pending',
          users: [
            {
              id: 'user-id',
              email: 'admin@oficina.com',
              name: 'Admin',
              role: UserRole.ADMIN,
            },
          ],
        },
      ]);

      await service.handleSubscriptionUpdated(mockSubscription);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(billingService.update).not.toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionDeleted - casos de erro', () => {
    it('deve retornar early se adminUser não for encontrado', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        canceled_at: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      } as unknown as Stripe.Subscription;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        plan: 'workshops_starter',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [],
        },
      });

      await service.handleSubscriptionDeleted(mockSubscription);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(tenantsService.suspend).not.toHaveBeenCalled();
    });

    it('deve retornar early se dbSubscription não for encontrado', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        canceled_at: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
      } as unknown as Stripe.Subscription;

      // findTenantByStripeId retorna null quando não encontra subscription
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          status: 'pending',
          users: [
            {
              id: 'user-id',
              email: 'admin@oficina.com',
              name: 'Admin',
              role: UserRole.ADMIN,
            },
          ],
        },
      ]);

      await service.handleSubscriptionDeleted(mockSubscription);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(tenantsService.suspend).not.toHaveBeenCalled();
    });
  });

  describe('handleTrialWillEnd - casos de erro', () => {
    it('deve retornar early se adminUser não for encontrado', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        trial_end: Math.floor(Date.now() / 1000) + 86400,
        items: {
          data: [
            {
              price: {
                unit_amount: 4990,
                currency: 'brl',
              },
            },
          ],
        },
      } as unknown as Stripe.Subscription;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        plan: 'workshops_starter',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [],
        },
      });

      await service.handleTrialWillEnd(mockSubscription);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendTrialEndingEmail).not.toHaveBeenCalled();
    });

    it('deve retornar early se dbSubscription não for encontrado', async () => {
      const mockSubscription = {
        id: 'sub_test_123',
        customer: 'cus_test_123',
        trial_end: Math.floor(Date.now() / 1000) + 86400,
        items: {
          data: [
            {
              price: {
                unit_amount: 4990,
                currency: 'brl',
              },
            },
          ],
        },
      } as unknown as Stripe.Subscription;

      // findTenantByStripeId retorna null quando não encontra subscription
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (prismaService.tenant.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          status: 'pending',
          users: [
            {
              id: 'user-id',
              email: 'admin@oficina.com',
              name: 'Admin',
              role: UserRole.ADMIN,
            },
          ],
        },
      ]);

      await service.handleTrialWillEnd(mockSubscription);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendTrialEndingEmail).not.toHaveBeenCalled();
    });
  });

  describe('handleInvoicePaymentFailed - casos de erro', () => {
    it('deve retornar early se adminUser não for encontrado', async () => {
      const mockInvoice = {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        amount_due: 4990,
        currency: 'brl',
      } as unknown as Stripe.Invoice;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [],
        },
      });

      await service.handleInvoicePaymentFailed(mockInvoice);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).not.toHaveBeenCalled();
    });
  });

  describe('handleInvoicePaymentSucceeded - casos de erro', () => {
    it('deve retornar early se adminUser não for encontrado', async () => {
      const mockInvoice = {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        amount_paid: 4990,
        currency: 'brl',
      } as unknown as Stripe.Invoice;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [],
        },
      });

      await service.handleInvoicePaymentSucceeded(mockInvoice);

      expect(
        // eslint-disable-next-line @typescript-eslint/unbound-method
        emailService.sendInvoicePaymentSucceededEmail,
      ).not.toHaveBeenCalled();
    });
  });

  describe('handleInvoiceUpcoming - casos de erro', () => {
    it('deve retornar early se adminUser não for encontrado', async () => {
      const mockInvoice = {
        id: 'in_test_123',
        customer: 'cus_test_123',
        subscription: 'sub_test_123',
        amount_due: 4990,
        currency: 'brl',
      } as unknown as Stripe.Invoice;

      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
        tenant: {
          id: 'tenant-id',
          subdomain: 'oficina-teste',
          users: [],
        },
      });

      await service.handleInvoiceUpcoming(mockInvoice);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendInvoiceUpcomingEmail).not.toHaveBeenCalled();
    });
  });

  describe('handleCheckoutCompleted - caso de erro adminUser undefined', () => {
    it('deve lançar erro se adminUser for undefined após processamento', async () => {
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

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.PENDING,
        adminEmail: 'admin@oficina.com',
        users: [],
      } as unknown);
      (billingService.findByTenantId as jest.Mock).mockRejectedValue(
        new NotFoundException('Subscription not found'),
      );
      (billingService.create as jest.Mock).mockResolvedValue({
        id: 'sub-id',
        tenantId: 'tenant-id',
      });
      (usersService.create as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'admin@oficina.com',
        name: 'Admin',
      });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.handleCheckoutCompleted(mockSession as Stripe.Checkout.Session),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
