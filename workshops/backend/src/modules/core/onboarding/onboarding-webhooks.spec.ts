import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../../../database/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { BillingService } from '../billing/billing.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../shared/email/email.service';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

describe('OnboardingService - Webhook Handlers', () => {
  let service: OnboardingService;
  let prismaService: jest.Mocked<PrismaService>;
  let tenantsService: jest.Mocked<TenantsService>;
  let billingService: jest.Mocked<BillingService>;
  let usersService: jest.Mocked<UsersService>;
  let emailService: jest.Mocked<EmailService>;

  const mockTenant = {
    id: 'tenant-id',
    name: 'Oficina Teste',
    subdomain: 'oficina-teste',
    adminEmail: 'admin@oficina.com',
    status: 'pending',
    users: [],
  };

  const mockSubscription = {
    id: 'sub-id',
    tenantId: 'tenant-id',
    stripeCustomerId: 'cus_test',
    stripeSubscriptionId: 'sub_test',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      tenant: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
    };

    const mockTenantsService = {
      update: jest.fn(),
    };

    const mockBillingService = {
      findByTenantId: jest.fn(),
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
    const mockCharge: Partial<Stripe.Charge> = {
      id: 'ch_test_123',
      customer: 'cus_test_123',
      billing_details: {
        email: 'admin@oficina.com',
        name: 'Admin',
        address: null,
        phone: null,
      },
    } as any;

    it('deve encontrar tenant via checkout session e enviar email', async () => {
      (
        (service as any).stripe.checkout.sessions.list as jest.Mock
      ).mockResolvedValue({
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

      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalled();
    });

    it('deve usar email do billing_details quando disponível', async () => {
      (
        (service as any).stripe.checkout.sessions.list as jest.Mock
      ).mockResolvedValue({
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

      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@oficina.com',
        }),
      );
    });
  });

  describe('handleInvoicePaymentFailed', () => {
    const mockInvoice: Partial<Stripe.Invoice> = {
      id: 'in_test_123',
      customer: 'cus_test_123',
      amount_due: 9900,
      currency: 'brl',
    } as any;

    it('deve encontrar tenant e enviar email de pagamento falhado', async () => {
      (prismaService.tenant.findFirst as jest.Mock).mockResolvedValue(
        mockTenant,
      );
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'admin@oficina.com',
        name: 'Admin',
        role: 'admin',
      });

      await service.handleInvoicePaymentFailed(mockInvoice as Stripe.Invoice);

      expect(emailService.sendPaymentFailedEmail).toHaveBeenCalled();
    });
  });

  describe('handleInvoicePaymentSucceeded', () => {
    const mockInvoice: Partial<Stripe.Invoice> = {
      id: 'in_test_123',
      customer: 'cus_test_123',
      amount_paid: 9900,
      currency: 'brl',
      invoice_pdf: 'https://invoice.pdf',
    } as any;

    it('deve encontrar tenant e enviar email de pagamento bem-sucedido', async () => {
      (prismaService.tenant.findFirst as jest.Mock).mockResolvedValue(
        mockTenant,
      );
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'admin@oficina.com',
        name: 'Admin',
        role: 'admin',
      });

      await service.handleInvoicePaymentSucceeded(
        mockInvoice as Stripe.Invoice,
      );

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
      (prismaService.tenant.findFirst as jest.Mock).mockResolvedValue(
        mockTenant,
      );
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'admin@oficina.com',
        name: 'Admin',
        role: 'admin',
      });

      await service.handleSubscriptionDeleted(
        mockSubscription as Stripe.Subscription,
      );

      expect(emailService.sendSubscriptionCancelledEmail).toHaveBeenCalled();
    });
  });

  describe('handleSubscriptionUpdated', () => {
    const mockSubscription: Partial<Stripe.Subscription> = {
      id: 'sub_test_123',
      customer: 'cus_test_123',
      status: 'active',
      items: {
        data: [
          {
            price: {
              id: 'price_test',
              nickname: 'Professional',
            } as any,
          },
        ],
      },
    };

    it('deve encontrar tenant e enviar email de atualização', async () => {
      (prismaService.tenant.findFirst as jest.Mock).mockResolvedValue(
        mockTenant,
      );
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
        id: 'user-id',
        email: 'admin@oficina.com',
        name: 'Admin',
        role: 'admin',
      });

      await service.handleSubscriptionUpdated(
        mockSubscription as Stripe.Subscription,
      );

      expect(emailService.sendSubscriptionUpdatedEmail).toHaveBeenCalled();
    });
  });
});
