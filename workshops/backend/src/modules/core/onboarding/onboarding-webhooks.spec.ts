import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '@database/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { BillingService } from '../billing/billing.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '@shared/email/email.service';
import { ConfigService } from '@nestjs/config';
import { CloudflareService } from '@shared/cloudflare/cloudflare.service';
import { EncryptionService } from '@shared/encryption/encryption.service';
import Stripe from 'stripe';

describe('OnboardingService - Webhook Handlers', () => {
  let service: OnboardingService;
  let prismaService: jest.Mocked<PrismaService>;
  let emailService: jest.Mocked<EmailService>;

  const mockTenant = {
    id: 'tenant-id',
    name: 'Oficina Teste',
    subdomain: 'oficina-teste',
    adminEmail: 'admin@oficina.com',
    status: 'pending',
    users: [
      {
        id: 'user-id',
        email: 'admin@oficina.com',
        name: 'Admin',
        role: 'admin',
      },
    ],
  };

  const mockSubscription = {
    id: 'sub-id',
    tenantId: 'tenant-id',
    stripeCustomerId: 'cus_test',
    stripeSubscriptionId: 'sub_test',
    plan: 'workshops_starter',
    status: 'active',
    billingCycle: 'monthly',
    currentPeriodEnd: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      tenant: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      subscription: {
        findFirst: jest.fn(),
      },
    };

    const mockTenantsService = {
      update: jest.fn(),
      suspend: jest.fn(),
    };

    const mockBillingService = {
      findByTenantId: jest.fn().mockResolvedValue({
        id: 'sub-id',
        currentPeriodEnd: new Date(),
      }),
      update: jest.fn(),
    };

    const mockUsersService = {
      create: jest.fn(),
    };

    const mockEmailService = {
      sendPaymentFailedEmail: jest.fn(),
      sendSubscriptionCancelledEmail: jest.fn(),
      sendSubscriptionUpdatedEmail: jest.fn(),
      sendInvoicePaymentSucceededEmail: jest.fn(),
      sendInvoiceUpcomingEmail: jest.fn(),
      sendTrialEndingEmail: jest.fn(),
      sendAccountSuspendedEmail: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockCloudflareService = {
      createTenantSubdomain: jest.fn().mockResolvedValue(true),
    };

    const mockEncryptionService = {
      encrypt: jest.fn(val => val),
      decrypt: jest.fn(val => val),
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
        { provide: CloudflareService, useValue: mockCloudflareService },
        { provide: EncryptionService, useValue: mockEncryptionService },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
    prismaService = module.get(PrismaService);
    emailService = module.get(EmailService);

    // Garantir que billingService.findByTenantId retorna um objeto válido
    mockBillingService.findByTenantId.mockResolvedValue({
      id: 'sub-id',
      currentPeriodEnd: new Date(),
    });

    // Mock Stripe
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (service as any).stripe = {
      checkout: {
        sessions: {
          list: jest.fn(),
        },
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleChargeFailed', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mockCharge: Partial<Stripe.Charge> = {
      id: 'ch_test_123',
      customer: 'cus_test_123',
      billing_details: {
        email: 'admin@oficina.com',
        name: 'Admin',
        address: null,
        phone: null,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    it('deve encontrar tenant via checkout session e enviar email', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const mockService = service as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockService.stripe.checkout.sessions.list.mockResolvedValue({
        data: [
          {
            id: 'cs_test',
            metadata: { tenantId: 'tenant-id' },
            customer_email: 'admin@oficina.com',
          },
        ],
      });

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(
        mockTenant,
      );

      await service.handleChargeFailed(mockCharge as Stripe.Charge);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalled();
    });

    it('deve usar email do billing_details quando disponível', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
      const mockService = service as any;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mockService.stripe.checkout.sessions.list.mockResolvedValue({
        data: [
          {
            id: 'cs_test',
            metadata: { tenantId: 'tenant-id' },
            customer_email: 'admin@oficina.com',
          },
        ],
      });

      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValue(
        mockTenant,
      );

      await service.handleChargeFailed(mockCharge as Stripe.Charge);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@oficina.com',
        }),
      );
    });
  });

  describe('handleInvoicePaymentFailed', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mockInvoice: Partial<Stripe.Invoice> = {
      id: 'in_test_123',
      customer: 'cus_test_123',
      amount_due: 9900,
      currency: 'brl',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    it('deve encontrar tenant e enviar email de pagamento falhado', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        tenant: {
          ...mockTenant,
          users: mockTenant.users,
        },
      });

      await service.handleInvoicePaymentFailed(mockInvoice as Stripe.Invoice);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalled();
    });
  });

  describe('handleInvoicePaymentSucceeded', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mockInvoice: Partial<Stripe.Invoice> = {
      id: 'in_test_123',
      customer: 'cus_test_123',
      amount_paid: 9900,
      currency: 'brl',
      invoice_pdf: 'https://invoice.pdf',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    it('deve encontrar tenant e enviar email de pagamento bem-sucedido', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        tenant: {
          ...mockTenant,
          users: mockTenant.users,
        },
      });

      await service.handleInvoicePaymentSucceeded(
        mockInvoice as Stripe.Invoice,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendInvoicePaymentSucceededEmail).toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionDeleted', () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_test_123',
      customer: 'cus_test_123',
      status: 'canceled',
    };

    it('deve encontrar tenant e enviar email de cancelamento', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        tenant: {
          ...mockTenant,
          users: mockTenant.users,
        },
      });

      await service.handleSubscriptionDeleted(
        mockSubscription as Stripe.Subscription,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendSubscriptionCancelledEmail).toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionUpdated', () => {
    const mockSubscription = {
      id: 'sub_test_123',
      customer: 'cus_test_123',
      status: 'active',
      items: {
        object: 'list',
        data: [
          {
            id: 'si_test',
            object: 'subscription_item',
            price: {
              id: 'price_test',
              nickname: 'Professional',
              unit_amount: 9900,
              currency: 'brl',
              recurring: {
                interval: 'month',
              },
            },
            billing_thresholds: null,
            created: Math.floor(Date.now() / 1000),
            metadata: {},
            quantity: 1,
            subscription: 'sub_test_123',
            tax_rates: [],
          },
        ],
        has_more: false,
        url: '/v1/subscription_items',
      },
    } as unknown as Stripe.Subscription;

    it('deve encontrar tenant e enviar email de atualização', async () => {
      (prismaService.subscription.findFirst as jest.Mock).mockResolvedValue({
        ...mockSubscription,
        tenant: {
          ...mockTenant,
          users: mockTenant.users,
        },
      });

      await service.handleSubscriptionUpdated(mockSubscription);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendSubscriptionUpdatedEmail).toHaveBeenCalled();
    });
  });
});
