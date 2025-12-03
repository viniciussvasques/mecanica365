import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../../database/prisma.service';
import { TenantsService } from '../tenants/tenants.service';
import { BillingService } from '../billing/billing.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../../shared/email/email.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { generateRandomPassword } from './utils/password-generator.util';
import { UserRole } from '../users/dto/create-user.dto';
import {
  BillingCycle,
  SubscriptionPlan,
  SubscriptionStatus,
} from '../billing/dto/subscription-response.dto';
import { TenantStatus, TenantPlan } from '../tenants/dto/create-tenant.dto';

// Type helpers para evitar warnings de type safety com Stripe e Prisma
type StripeError = {
  message?: string;
  stack?: string;
};
type TenantWithUsers = {
  id: string;
  subdomain: string;
  status: string;
  adminEmail?: string | null;
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
  }>;
};
type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};
type DbSubscription = {
  id: string;
  tenantId: string;
  plan: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd: Date;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
};

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantsService: TenantsService,
    private readonly billingService: BillingService,
    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      this.logger.warn(
        'STRIPE_SECRET_KEY não configurado. Stripe desabilitado.',
      );
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-11-17.clover',
      });
    }
  }

  /**
   * Verifica se existe um tenant pendente com o mesmo documento
   */
  async checkPendingTenant(
    document: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _email: string, // Parâmetro mantido para compatibilidade, mas não usado diretamente
  ): Promise<{ tenantId: string; subdomain: string; exists: boolean } | null> {
    // Buscar tenant pendente pelo documento (o email será verificado no adminEmail via users depois)
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        document,
        status: TenantStatus.PENDING,
      },
      select: {
        id: true,
        subdomain: true,
      },
    });

    if (tenant) {
      return {
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
        exists: true,
      };
    }

    return null;
  }

  /**
   * Registra um novo tenant (status: pending) - ANTES do pagamento
   */
  async register(
    createOnboardingDto: CreateOnboardingDto,
  ): Promise<{ tenantId: string; subdomain: string }> {
    // Verificar se já existe um tenant pendente com o mesmo documento ou email
    const existingPending = await this.checkPendingTenant(
      createOnboardingDto.document,
      createOnboardingDto.email,
    );

    if (existingPending) {
      this.logger.log(
        `Tenant pendente encontrado: ${existingPending.tenantId} (${existingPending.subdomain})`,
      );
      // Retornar o tenant existente para continuar o fluxo
      return {
        tenantId: existingPending.tenantId,
        subdomain: existingPending.subdomain,
      };
    }

    // Criar tenant com status PENDING (será ativado após pagamento)
    const tenant = await this.tenantsService.create({
      name: createOnboardingDto.name,
      documentType: createOnboardingDto.documentType,
      document: createOnboardingDto.document,
      subdomain: createOnboardingDto.subdomain.toLowerCase(),
      plan: createOnboardingDto.plan, // Plano escolhido pelo usuário
      status: TenantStatus.PENDING, // Pendente até confirmação de pagamento
      adminEmail: createOnboardingDto.email,
      adminPassword: createOnboardingDto.password || undefined, // Senha opcional, será usada após pagamento
    });

    this.logger.log(
      `Tenant registrado (pending): ${tenant.id} (${tenant.subdomain})`,
    );

    return {
      tenantId: tenant.id,
      subdomain: tenant.subdomain,
    };
  }

  /**
   * Cria uma sessão de checkout no Stripe para um tenant existente
   */
  async createCheckoutSession(
    createCheckoutDto: CreateCheckoutDto,
  ): Promise<{ sessionId: string; url: string }> {
    if (!this.stripe) {
      throw new BadRequestException('Stripe não configurado');
    }

    // Buscar tenant existente
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: createCheckoutDto.tenantId },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant não encontrado');
    }

    const tenantStatus = tenant.status;
    if (tenantStatus !== 'pending') {
      throw new BadRequestException(
        `Tenant já foi processado. Status atual: ${tenantStatus}`,
      );
    }

    // Buscar email do admin: primeiro do campo adminEmail do tenant, depois do usuário existente
    const tenantName = tenant.name;
    const tenantEmail =
      tenant.adminEmail ||
      (
        await this.prisma.user.findFirst({
          where: { tenantId: tenant.id },
        })
      )?.email ||
      tenantName.toLowerCase().replace(/\s+/g, '.') + '@temp.com';

    if (!tenantEmail || tenantEmail.includes('@temp.com')) {
      this.logger.warn(
        `Email do admin não encontrado para tenant ${tenant.id}. Usando email temporário: ${tenantEmail}`,
      );
    }

    // Obter preço do plano
    const planPrice = this.getPlanPrice(
      createCheckoutDto.plan,
      createCheckoutDto.billingCycle || BillingCycle.MONTHLY,
    );

    // Criar sessão de checkout
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Plano ${createCheckoutDto.plan}`,
              description: `Assinatura ${createCheckoutDto.plan} - Mecânica365`,
            },
            unit_amount: Math.round(planPrice * 100), // Stripe usa centavos
            recurring: {
              interval:
                createCheckoutDto.billingCycle === BillingCycle.ANNUAL
                  ? 'year'
                  : 'month',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        tenantId: tenant.id,
        tenantName: tenantName,
        tenantEmail: tenantEmail,
        plan: createCheckoutDto.plan,
        billingCycle: createCheckoutDto.billingCycle || BillingCycle.MONTHLY,
      },
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding/cancel`,
      customer_email: tenantEmail,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // Expira em 1 hora
      allow_promotion_codes: true,
    });

    const sessionId = session.id;
    const sessionUrl = session.url;
    const sessionStatus = session.status as string;
    const sessionExpiresAt = session.expires_at as number | null;
    this.logger.log(
      `Checkout session criada: ${sessionId} para tenant ${tenant.id}`,
    );
    this.logger.log(`URL da sessão: ${sessionUrl}`);
    this.logger.log(`Status da sessão: ${sessionStatus}`);
    if (sessionExpiresAt) {
      this.logger.log(
        `Expira em: ${new Date(sessionExpiresAt * 1000).toISOString()}`,
      );
    }

    if (!session.url) {
      this.logger.error(
        `Sessão criada mas URL não disponível. Session ID: ${session.id}`,
      );
      throw new BadRequestException(
        'Erro ao criar sessão de checkout. URL não disponível.',
      );
    }

    return {
      sessionId: session.id,
      url: session.url,
    };
  }

  /**
   * Processa webhook do Stripe quando checkout é completado
   * Ativa o tenant e cria subscription + user admin
   */
  async handleCheckoutCompleted(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    try {
      const metadata = session.metadata;
      if (!metadata) {
        throw new BadRequestException('Metadata não encontrada na sessão');
      }

      const { tenantId, tenantName, tenantEmail, plan, billingCycle } =
        metadata;

      if (!tenantId) {
        throw new BadRequestException('Tenant ID não encontrado na metadata');
      }

      // Buscar tenant existente
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        include: { users: true },
      });

      if (!tenant) {
        throw new BadRequestException(`Tenant não encontrado: ${tenantId}`);
      }

      if (tenant.status !== 'pending') {
        this.logger.warn(
          `Tenant ${tenantId} já foi processado. Status atual: ${tenant.status}`,
        );
        return; // Idempotência - já foi processado
      }

      this.logger.log(
        `Processando ativação do tenant: ${tenant.id} (${tenant.subdomain})`,
      );

      // 1. Ativar Tenant
      await this.tenantsService.update(tenant.id, {
        status: TenantStatus.ACTIVE,
        plan: plan as TenantPlan,
      });

      this.logger.log(`Tenant ativado: ${tenant.id}`);

      // 2. Criar/Atualizar Subscription
      try {
        // Tentar buscar subscription existente
        await this.billingService.findByTenantId(tenant.id);

        // Se existe, atualizar
        await this.billingService.update(tenant.id, {
          plan: plan as SubscriptionPlan,
          billingCycle: billingCycle as BillingCycle,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          status: SubscriptionStatus.ACTIVE,
        });
        this.logger.log(`Subscription atualizada para tenant ${tenant.id}`);
      } catch (error: unknown) {
        // Se não existe (NotFoundException), criar nova
        if (error instanceof NotFoundException) {
          await this.billingService.create({
            tenantId: tenant.id,
            plan: plan as SubscriptionPlan,
            billingCycle: billingCycle as BillingCycle,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
          });
          this.logger.log(`Subscription criada para tenant ${tenant.id}`);
        } else {
          throw error;
        }
      }

      // 3. Criar User Admin (se ainda não existe)
      let adminUser = tenant.users.find((u) => u.role === 'admin');
      let userPassword: string | undefined;

      if (!adminUser) {
        // Buscar senha salva ou gerar nova
        userPassword = generateRandomPassword(12);

        // Usar email do tenant.adminEmail (salvo no registro) ou da metadata da session
        const adminEmailToUse =
          tenant.adminEmail ||
          tenantEmail ||
          session.customer_email ||
          `${tenant.subdomain}@temp.com`;

        const createdUser = await this.usersService.create(tenant.id, {
          email: adminEmailToUse,
          name: tenantName || tenant.name,
          password: userPassword,
          role: UserRole.ADMIN,
          isActive: true,
        });

        // Buscar usuário completo do banco para ter acesso a todos os campos
        const newAdminUser = await this.prisma.user.findUnique({
          where: { id: createdUser.id },
        });

        if (!newAdminUser) {
          throw new BadRequestException('Erro ao criar usuário admin');
        }

        adminUser = newAdminUser;
        const createdAdminUser = adminUser; // Constante para TypeScript narrowing
        this.logger.log(`Usuário admin criado: ${createdAdminUser.id}`);

        // 4. Enviar email de boas-vindas (apenas se usuário foi criado agora)
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const loginUrl = `${frontendUrl}/login?subdomain=${tenant.subdomain}`;

        await this.emailService.sendWelcomeEmail({
          to: createdAdminUser.email,
          name: createdAdminUser.name,
          subdomain: tenant.subdomain,
          email: createdAdminUser.email,
          password: userPassword,
          loginUrl,
        });

        this.logger.log(
          `Email de boas-vindas enviado para: ${createdAdminUser.email}`,
        );
      } else {
        // adminUser já existe, TypeScript sabe que não é undefined aqui
        const existingAdminUser = adminUser;
        this.logger.log(`Usuário admin já existe: ${existingAdminUser.id}`);
        // Não enviar email se usuário já existe
      }

      // Garantir que adminUser não é undefined (TypeScript narrowing)
      if (!adminUser) {
        throw new BadRequestException(
          'Erro: usuário admin não encontrado após processamento',
        );
      }

      // Criar constante para garantir narrowing do TypeScript
      const finalAdminUser = adminUser;
      this.logger.log(
        `Onboarding completo para tenant: ${tenant.subdomain} (${finalAdminUser.email})`,
      );
    } catch (error: unknown) {
      const err = error as StripeError;
      this.logger.error(
        `Erro ao processar checkout: ${err.message || 'Erro desconhecido'}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Busca tenant por Stripe Customer ID ou Subscription ID
   */
  private async findTenantByStripeId(
    customerId?: string | null,
    subscriptionId?: string | null,
  ): Promise<{
    tenant: TenantWithUsers;
    subscription: DbSubscription | null;
    adminUser: AdminUser | null;
  } | null> {
    try {
      // Primeiro, tentar buscar por subscription
      if (customerId || subscriptionId) {
        const dbSubscription = await this.prisma.subscription.findFirst({
          where: {
            OR: [
              customerId ? { stripeCustomerId: customerId } : {},
              subscriptionId ? { stripeSubscriptionId: subscriptionId } : {},
            ],
          },
          include: {
            tenant: {
              include: {
                users: {
                  where: { role: UserRole.ADMIN },
                  take: 1,
                },
              },
            },
          },
        });

        if (dbSubscription) {
          const subscriptionData: DbSubscription = {
            id: dbSubscription.id,
            tenantId: dbSubscription.tenantId,
            plan: dbSubscription.plan,
            status: dbSubscription.status,
            billingCycle: dbSubscription.billingCycle,
            currentPeriodEnd: dbSubscription.currentPeriodEnd,
            stripeSubscriptionId: dbSubscription.stripeSubscriptionId,
            stripeCustomerId: dbSubscription.stripeCustomerId,
          };
          return {
            tenant: dbSubscription.tenant as TenantWithUsers,
            subscription: subscriptionData,
            adminUser:
              (dbSubscription.tenant.users[0] as AdminUser | undefined) || null,
          };
        }
      }

      // Se não encontrou por subscription, tentar buscar tenant pendente
      // que pode ter sido criado mas ainda não tem subscription ativa
      if (customerId) {
        // Buscar todos os tenants pendentes e verificar se algum tem o customer ID
        // Como não temos customer ID salvo no tenant, vamos buscar pelo email do admin
        // ou tentar encontrar pela session de checkout mais recente
        const tenants = await this.prisma.tenant.findMany({
          where: {
            status: 'pending',
          },
          include: {
            users: {
              where: { role: UserRole.ADMIN },
              take: 1,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10, // Buscar os 10 mais recentes
        });

        // Retornar o primeiro tenant pendente com admin user
        for (const tenant of tenants) {
          if (tenant.users[0]) {
            return {
              tenant,
              subscription: null,
              adminUser: tenant.users[0],
            };
          }
        }
      }

      return null;
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.error(
        `Erro ao buscar tenant por Stripe ID: ${err.message || String(error)}`,
      );
      return null;
    }
  }

  /**
   * Handler para pagamento assíncrono falhado
   */
  async handleAsyncPaymentFailed(
    session: Stripe.Checkout.Session,
  ): Promise<void> {
    try {
      const metadata = session.metadata;
      if (!metadata?.tenantId) {
        this.logger.warn(
          'Metadata não encontrada em checkout.session.async_payment_failed',
        );
        return;
      }

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: metadata.tenantId },
        include: { users: { where: { role: UserRole.ADMIN }, take: 1 } },
      });

      if (!tenant || !tenant.users[0]) {
        this.logger.warn(
          `Tenant ou admin user não encontrado: ${metadata.tenantId}`,
        );
        return;
      }

      const adminUser = tenant.users[0];
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const retryUrl = `${frontendUrl}/onboarding/checkout?tenantId=${tenant.id}`;

      await this.emailService.sendPaymentFailedEmail({
        to: adminUser.email,
        name: adminUser.name,
        subdomain: tenant.subdomain,
        amount: session.amount_total || 0,
        currency: session.currency || 'brl',
        invoiceUrl:
          session.invoice && typeof session.invoice === 'string'
            ? `https://dashboard.stripe.com/invoices/${session.invoice}`
            : undefined,
        paymentMethod: 'Cartão de Crédito',
        failureReason:
          'O pagamento não pôde ser processado. Verifique os dados do seu cartão.',
        retryUrl,
        supportUrl: `${frontendUrl}/suporte`,
      });

      this.logger.log(
        `Email de pagamento falhado enviado para: ${adminUser.email}`,
      );
    } catch (error: unknown) {
      const err = error as StripeError;
      this.logger.error(
        `Erro ao processar async_payment_failed: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Handler para charge falhado
   */
  async handleChargeFailed(charge: Stripe.Charge): Promise<void> {
    try {
      const customerId = this.extractCustomerId(charge);
      if (!customerId) {
        this.logger.warn('Customer ID não encontrado em charge.failed');
        return;
      }

      this.logChargeFailedInfo(charge, customerId);

      const result = await this.findTenantForChargeFailed(charge, customerId);
      if (!result || !result.adminUser) {
        this.logger.warn(
          `Tenant não encontrado para charge: ${charge.id}, customer: ${customerId}`,
        );
        return;
      }

      await this.sendChargeFailedEmail(charge, result.tenant, result.adminUser);
      this.logger.log(
        `Email de charge failed enviado para: ${result.adminUser.email}`,
      );
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Erro ao processar charge.failed: ${err.message || String(error)}`,
        err.stack,
      );
    }
  }

  private extractCustomerId(charge: Stripe.Charge): string | undefined {
    return typeof charge.customer === 'string'
      ? charge.customer
      : charge.customer?.id;
  }

  private logChargeFailedInfo(charge: Stripe.Charge, customerId: string): void {
    this.logger.log(
      `Processando charge.failed: ${charge.id}, customer: ${customerId}`,
    );
    this.logger.log(
      `Billing email: ${charge.billing_details?.email || 'não disponível'}`,
    );
  }

  private async findTenantForChargeFailed(
    charge: Stripe.Charge,
    customerId: string,
  ): Promise<{
    tenant: TenantWithUsers;
    subscription: unknown;
    adminUser: AdminUser | null;
  } | null> {
    let result = await this.findTenantByCheckoutSession(customerId);
    if (result) {
      return result;
    }

    result = await this.findTenantByStripeId(customerId, undefined);
    if (result) {
      return result;
    }

    if (charge.billing_details?.email) {
      result = await this.findTenantByBillingEmail(charge.billing_details.email);
      if (result) {
        return result;
      }
    }

    return await this.findPendingTenantForChargeFailed(charge, customerId);
  }

  private async findTenantByCheckoutSession(
    customerId: string,
  ): Promise<{
    tenant: TenantWithUsers;
    subscription: unknown;
    adminUser: AdminUser | null;
  } | null> {
    if (!this.stripe) {
      return null;
    }

    try {
      const sessions = await this.stripe.checkout.sessions.list({
        customer: customerId,
        limit: 5,
      });

      for (const session of sessions.data) {
        const result = await this.findTenantFromSession(session);
        if (result) {
          return result;
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.warn(
        `Erro ao buscar checkout sessions: ${err.message || String(error)}`,
      );
    }

    return null;
  }

  private async findTenantFromSession(
    session: Stripe.Checkout.Session,
  ): Promise<{
    tenant: TenantWithUsers;
    subscription: unknown;
    adminUser: AdminUser | null;
  } | null> {
    const currentSessionMetadata = session.metadata as Record<
      string,
      string
    > | null;
    const sessionTenantId = currentSessionMetadata?.tenantId;
    if (!sessionTenantId) {
      return null;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: sessionTenantId },
      include: {
        users: {
          where: { role: UserRole.ADMIN },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return null;
    }

    const adminUser = this.createAdminUserFromTenant(tenant, session);
    if (!adminUser) {
      return null;
    }

    this.logger.log(
      `Tenant encontrado via checkout session: ${tenant.id}`,
    );

    return {
      tenant,
      subscription: null,
      adminUser,
    };
  }

  private createAdminUserFromTenant(
    tenant: TenantWithUsers,
    session?: Stripe.Checkout.Session,
  ): AdminUser | null {
    if (tenant.users[0]) {
      return {
        id: tenant.users[0].id,
        email: tenant.users[0].email,
        name: tenant.users[0].name,
        role: tenant.users[0].role,
      };
    }

    if (session?.customer_email) {
      const currentSessionMetadata = session.metadata as Record<
        string,
        string
      > | null;
      const sessionTenantName =
        (currentSessionMetadata?.tenantName as string | undefined) ||
        tenant.subdomain;
      return {
        id: 'temp',
        email: session.customer_email,
        name: sessionTenantName,
        role: 'admin',
      };
    }

    return null;
  }

  private async findTenantByBillingEmail(
    email: string,
  ): Promise<{
    tenant: TenantWithUsers;
    subscription: unknown;
    adminUser: AdminUser | null;
  } | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        isActive: true,
      },
      include: {
        tenant: {
          include: {
            users: {
              where: { role: UserRole.ADMIN },
              take: 1,
            },
          },
        },
      },
    });

    if (user && user.tenant) {
      return {
        tenant: user.tenant,
        subscription: null,
        adminUser: user.tenant.users[0] || user,
      };
    }

    return null;
  }

  private async findPendingTenantForChargeFailed(
    charge: Stripe.Charge,
    customerId: string,
  ): Promise<{
    tenant: TenantWithUsers;
    subscription: unknown;
    adminUser: AdminUser | null;
  } | null> {
    this.logger.log('Buscando tenant pendente mais recente...');
    const pendingTenant = await this.prisma.tenant.findFirst({
      where: {
        status: TenantStatus.PENDING,
      },
      include: {
        users: {
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!pendingTenant) {
      this.logger.warn('Nenhum tenant pendente encontrado');
      return null;
    }

    this.logger.log(
      `Tenant pendente encontrado: ${pendingTenant.id} (${pendingTenant.subdomain})`,
    );

    const adminUser = await this.createAdminUserForPendingTenant(
      pendingTenant,
      charge,
      customerId,
    );

    if (!adminUser) {
      return null;
    }

    this.logger.log(
      `Tenant encontrado! Enviando email para: ${adminUser.email}`,
    );

    return {
      tenant: pendingTenant,
      subscription: null,
      adminUser,
    };
  }

  private async createAdminUserForPendingTenant(
    pendingTenant: TenantWithUsers,
    charge: Stripe.Charge,
    customerId: string,
  ): Promise<AdminUser | null> {
    if (pendingTenant.users[0]) {
      return {
        id: pendingTenant.users[0].id,
        email: pendingTenant.users[0].email,
        name: pendingTenant.users[0].name,
        role: pendingTenant.users[0].role,
      };
    }

    if (charge.billing_details?.email) {
      this.logger.log(
        `Usando email do billing: ${charge.billing_details.email}`,
      );
      return {
        id: 'temp',
        email: charge.billing_details.email,
        name: charge.billing_details.name || pendingTenant.subdomain,
        role: 'admin',
      };
    }

    const sessionEmail = await this.getEmailFromCheckoutSession(customerId);
    if (sessionEmail) {
      this.logger.log(`Email da session: ${sessionEmail}`);
      return {
        id: 'temp',
        email: sessionEmail,
        name: pendingTenant.subdomain,
        role: 'admin',
      };
    }

    const tenantEmail = `${pendingTenant.subdomain}@temp.com`;
    this.logger.log(`Usando email gerado: ${tenantEmail}`);
    return {
      id: 'temp',
      email: tenantEmail,
      name: pendingTenant.subdomain,
      role: 'admin',
    };
  }

  private async getEmailFromCheckoutSession(
    customerId: string,
  ): Promise<string | null> {
    if (!this.stripe) {
      return null;
    }

    try {
      const sessions = await this.stripe.checkout.sessions.list({
        customer: customerId,
        limit: 1,
      });

      return sessions.data[0]?.customer_email || null;
    } catch (error: unknown) {
      const err = error as { message?: string };
      this.logger.warn(
        `Erro ao buscar session: ${err.message || String(error)}`,
      );
      return null;
    }
  }

  private async sendChargeFailedEmail(
    charge: Stripe.Charge,
    tenant: TenantWithUsers,
    adminUser: AdminUser,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const retryUrl = `${frontendUrl}/onboarding/checkout?tenantId=${tenant.id}`;

    const failureReason =
      charge.failure_message ||
      charge.outcome?.reason ||
      'Falha no processamento do pagamento. Verifique os dados do seu cartão.';

    await this.emailService.sendPaymentFailedEmail({
      to: adminUser.email,
      name: adminUser.name,
      subdomain: tenant.subdomain,
      amount: charge.amount,
      currency: charge.currency,
      paymentMethod:
        (charge.payment_method_details as { type?: string })?.type || 'Cartão',
      failureReason,
      retryUrl,
      supportUrl: `${frontendUrl}/suporte`,
    });
  }

  /**
   * Handler para payment intent falhado
   */
  async handlePaymentIntentFailed(
    paymentIntent: Stripe.PaymentIntent,
  ): Promise<void> {
    try {
      const customerId =
        typeof paymentIntent.customer === 'string'
          ? paymentIntent.customer
          : paymentIntent.customer?.id;

      if (!customerId) {
        this.logger.warn(
          'Customer ID não encontrado em payment_intent.payment_failed',
        );
        return;
      }

      const result = await this.findTenantByStripeId(customerId);
      if (!result) {
        this.logger.warn(`Tenant não encontrado para customer: ${customerId}`);
        return;
      }

      const { tenant, adminUser } = result;
      if (!adminUser) {
        this.logger.warn(
          `Admin user não encontrado para payment intent: ${paymentIntent.id}`,
        );
        return;
      }
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const retryUrl = `${frontendUrl}/onboarding/checkout?tenantId=${tenant.id}`;

      await this.emailService.sendPaymentFailedEmail({
        to: adminUser.email,
        name: adminUser.name,
        subdomain: tenant.subdomain,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        paymentMethod: paymentIntent.payment_method_types[0] || 'Cartão',
        failureReason:
          paymentIntent.last_payment_error?.message ||
          'Falha no processamento do pagamento',
        retryUrl,
        supportUrl: `${frontendUrl}/suporte`,
      });

      this.logger.log(
        `Email de payment intent falhado enviado para: ${adminUser.email}`,
      );
    } catch (error: unknown) {
      const err = error as StripeError;
      this.logger.error(
        `Erro ao processar payment_intent.payment_failed: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Handler para invoice payment failed
   */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      const customerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;
      const invoiceData = invoice as unknown as {
        subscription?: string | { id: string } | null;
        payment_method_types?: string[];
        last_finalization_error?: { message?: string };
      };
      const subscriptionId =
        typeof invoiceData.subscription === 'string'
          ? invoiceData.subscription
          : invoiceData.subscription?.id || undefined;

      if (!customerId && !subscriptionId) {
        this.logger.warn(
          'Customer ou Subscription ID não encontrado em invoice.payment_failed',
        );
        return;
      }

      const result = await this.findTenantByStripeId(
        customerId,
        subscriptionId,
      );
      if (!result) {
        // Invoice pode não estar relacionado ao nosso sistema (ex: invoices de teste do Stripe)
        this.logger.debug(
          `Invoice ${invoice.id} não está associado a nenhum tenant do sistema. Customer: ${customerId}, Subscription: ${subscriptionId}`,
        );
        return;
      }

      const { tenant, adminUser } = result;
      if (!adminUser) {
        this.logger.warn(
          `Admin user não encontrado para invoice: ${invoice.id}`,
        );
        return;
      }
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const retryUrl = `${frontendUrl}/billing/update-payment?tenantId=${tenant.id}`;

      // Atualizar status da subscription para past_due
      await this.billingService.update(tenant.id, {
        status: SubscriptionStatus.PAST_DUE,
      });

      await this.emailService.sendPaymentFailedEmail({
        to: adminUser.email,
        name: adminUser.name,
        subdomain: tenant.subdomain,
        amount: invoice.amount_due,
        currency: invoice.currency,
        invoiceUrl: invoice.hosted_invoice_url || undefined,
        paymentMethod: invoiceData.payment_method_types?.[0] || 'Cartão',
        failureReason:
          invoiceData.last_finalization_error?.message ||
          'Falha no processamento da fatura',
        retryUrl,
        supportUrl: `${frontendUrl}/suporte`,
      });

      this.logger.log(
        `Email de invoice payment failed enviado para: ${adminUser.email}`,
      );
    } catch (error: unknown) {
      const err = error as StripeError;
      this.logger.error(
        `Erro ao processar invoice.payment_failed: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Handler para invoice payment succeeded
   */
  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      const customerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;
      const invoiceData = invoice as unknown as {
        subscription?: string | { id: string } | null;
        receipt_url?: string;
      };
      const subscriptionId =
        typeof invoiceData.subscription === 'string'
          ? invoiceData.subscription
          : invoiceData.subscription?.id || undefined;

      if (!customerId && !subscriptionId) {
        this.logger.warn(
          'Customer ou Subscription ID não encontrado em invoice.payment_succeeded',
        );
        return;
      }

      const result = await this.findTenantByStripeId(
        customerId,
        subscriptionId,
      );
      if (!result) {
        // Invoice pode não estar relacionado ao nosso sistema (ex: invoices de teste do Stripe)
        this.logger.debug(
          `Invoice ${invoice.id} não está associado a nenhum tenant do sistema. Customer: ${customerId}, Subscription: ${subscriptionId}`,
        );
        return;
      }

      const { tenant, adminUser } = result;
      if (!adminUser) {
        this.logger.warn(
          `Admin user não encontrado para invoice: ${invoice.id}`,
        );
        return;
      }

      // Atualizar status da subscription para active
      await this.billingService.update(tenant.id, {
        status: SubscriptionStatus.ACTIVE,
      });

      // Buscar subscription atualizada para pegar next billing date
      const updatedSubscription = await this.billingService.findByTenantId(
        tenant.id,
      );

      await this.emailService.sendInvoicePaymentSucceededEmail({
        to: adminUser.email,
        name: adminUser.name,
        subdomain: tenant.subdomain,
        invoiceNumber: invoice.number || invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        invoiceUrl: invoice.hosted_invoice_url || undefined,
        receiptUrl: invoiceData.receipt_url || undefined,
        nextBillingDate: updatedSubscription.currentPeriodEnd,
      });

      this.logger.log(
        `Email de invoice payment succeeded enviado para: ${adminUser.email}`,
      );
    } catch (error: unknown) {
      const err = error as StripeError;
      this.logger.error(
        `Erro ao processar invoice.payment_succeeded: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Handler para invoice upcoming
   */
  async handleInvoiceUpcoming(invoice: Stripe.Invoice): Promise<void> {
    try {
      const customerId =
        typeof invoice.customer === 'string'
          ? invoice.customer
          : invoice.customer?.id;
      const invoiceData = invoice as unknown as {
        subscription?: string | { id: string } | null;
      };
      const subscriptionId =
        typeof invoiceData.subscription === 'string'
          ? invoiceData.subscription
          : invoiceData.subscription?.id || undefined;

      if (!customerId && !subscriptionId) {
        this.logger.warn(
          'Customer ou Subscription ID não encontrado em invoice.upcoming',
        );
        return;
      }

      const result = await this.findTenantByStripeId(
        customerId,
        subscriptionId,
      );
      if (!result) {
        // Invoice pode não estar relacionado ao nosso sistema (ex: invoices de teste do Stripe)
        this.logger.debug(
          `Invoice ${invoice.id} não está associado a nenhum tenant do sistema. Customer: ${customerId}, Subscription: ${subscriptionId}`,
        );
        return;
      }

      const { tenant, adminUser } = result;
      if (!adminUser) {
        this.logger.warn(
          `Admin user não encontrado para invoice: ${invoice.id}`,
        );
        return;
      }
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      await this.emailService.sendInvoiceUpcomingEmail({
        to: adminUser.email,
        name: adminUser.name,
        subdomain: tenant.subdomain,
        amount: invoice.amount_due,
        currency: invoice.currency,
        dueDate: new Date(
          invoice.due_date ? invoice.due_date * 1000 : Date.now(),
        ),
        invoiceUrl: invoice.hosted_invoice_url || undefined,
        updatePaymentMethodUrl: `${frontendUrl}/billing/update-payment?tenantId=${tenant.id}`,
      });

      this.logger.log(
        `Email de invoice upcoming enviado para: ${adminUser.email}`,
      );
    } catch (error: unknown) {
      const err = error as StripeError;
      this.logger.error(
        `Erro ao processar invoice.upcoming: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Handler para subscription deleted
   */
  async handleSubscriptionDeleted(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    try {
      const result = await this.findTenantByStripeId(
        subscription.customer as string,
        subscription.id,
      );

      if (!result) {
        this.logger.warn(
          `Tenant não encontrado para subscription: ${subscription.id}`,
        );
        return;
      }

      const { tenant, subscription: dbSubscription, adminUser } = result;
      if (!adminUser) {
        this.logger.warn(
          `Admin user não encontrado para subscription: ${subscription.id}`,
        );
        return;
      }
      if (!dbSubscription) {
        this.logger.warn(
          `Subscription não encontrada no banco para: ${subscription.id}`,
        );
        return;
      }
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // Atualizar status da subscription para cancelled
      await this.billingService.update(tenant.id, {
        status: SubscriptionStatus.CANCELLED,
      });

      // Suspender tenant
      await this.tenantsService.suspend(tenant.id);

      const planName = dbSubscription.plan || 'Plano';
      const subscriptionData = subscription as unknown as {
        canceled_at?: number | null;
        current_period_end?: number;
      };
      const cancellationDate = new Date(
        subscriptionData.canceled_at
          ? subscriptionData.canceled_at * 1000
          : Date.now(),
      );
      const accessUntilDate = new Date(
        (subscriptionData.current_period_end || Date.now() / 1000) * 1000,
      );

      await this.emailService.sendSubscriptionCancelledEmail({
        to: adminUser.email,
        name: adminUser.name,
        subdomain: tenant.subdomain,
        planName,
        cancellationDate,
        accessUntilDate,
        reactivateUrl: `${frontendUrl}/billing/reactivate?tenantId=${tenant.id}`,
        supportUrl: `${frontendUrl}/suporte`,
      });

      this.logger.log(
        `Email de subscription deleted enviado para: ${adminUser.email}`,
      );
    } catch (error: unknown) {
      const err = error as StripeError;
      this.logger.error(
        `Erro ao processar customer.subscription.deleted: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Handler para subscription updated
   */
  async handleSubscriptionUpdated(
    subscription: Stripe.Subscription,
  ): Promise<void> {
    try {
      const result = await this.findTenantByStripeId(
        subscription.customer as string,
        subscription.id,
      );

      if (!result) {
        this.logger.warn(
          `Tenant não encontrado para subscription: ${subscription.id}`,
        );
        return;
      }

      const { tenant, subscription: dbSubscription, adminUser } = result;
      if (!adminUser) {
        this.logger.warn(
          `Admin user não encontrado para subscription: ${subscription.id}`,
        );
        return;
      }
      if (!dbSubscription) {
        this.logger.warn(
          `Subscription não encontrada no banco para: ${subscription.id}`,
        );
        return;
      }
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // Buscar plano atualizado do Stripe
      const planName =
        subscription.items.data[0]?.price?.nickname || dbSubscription.plan;
      const billingCycle =
        subscription.items.data[0]?.price?.recurring?.interval === 'year'
          ? BillingCycle.ANNUAL
          : BillingCycle.MONTHLY;
      const amount = subscription.items.data[0]?.price?.unit_amount || 0;
      const currency = subscription.items.data[0]?.price?.currency || 'brl';

      // Atualizar subscription no banco
      await this.billingService.update(tenant.id, {
        plan: planName as SubscriptionPlan,
        billingCycle,
        status:
          subscription.status === 'active'
            ? SubscriptionStatus.ACTIVE
            : (dbSubscription.status as SubscriptionStatus),
      });

      await this.emailService.sendSubscriptionUpdatedEmail({
        to: adminUser.email,
        name: adminUser.name,
        subdomain: tenant.subdomain,
        oldPlan: dbSubscription.plan,
        newPlan: planName,
        billingCycle,
        nextBillingDate: new Date(
          ((subscription as unknown as { current_period_end?: number })
            .current_period_end || Date.now() / 1000) * 1000,
        ),
        amount,
        currency,
        loginUrl: `${frontendUrl}/login?subdomain=${tenant.subdomain}`,
      });

      this.logger.log(
        `Email de subscription updated enviado para: ${adminUser.email}`,
      );
    } catch (error: unknown) {
      const err = error as StripeError;
      this.logger.error(
        `Erro ao processar customer.subscription.updated: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Handler para trial will end
   */
  async handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
    try {
      const result = await this.findTenantByStripeId(
        subscription.customer as string,
        subscription.id,
      );

      if (!result) {
        this.logger.warn(
          `Tenant não encontrado para subscription: ${subscription.id}`,
        );
        return;
      }

      const { tenant, subscription: dbSubscription, adminUser } = result;
      if (!adminUser) {
        this.logger.warn(
          `Admin user não encontrado para subscription: ${subscription.id}`,
        );
        return;
      }
      if (!dbSubscription) {
        this.logger.warn(
          `Subscription não encontrada no banco para: ${subscription.id}`,
        );
        return;
      }
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      const planName = dbSubscription.plan || 'Plano';
      const trialEndDate = new Date(
        subscription.trial_end ? subscription.trial_end * 1000 : Date.now(),
      );
      const amount = subscription.items.data[0]?.price?.unit_amount || 0;
      const currency = subscription.items.data[0]?.price?.currency || 'brl';

      await this.emailService.sendTrialEndingEmail({
        to: adminUser.email,
        name: adminUser.name,
        subdomain: tenant.subdomain,
        trialEndDate,
        planName,
        amount,
        currency,
        subscribeUrl: `${frontendUrl}/billing/subscribe?tenantId=${tenant.id}`,
        supportUrl: `${frontendUrl}/suporte`,
      });

      this.logger.log(`Email de trial ending enviado para: ${adminUser.email}`);
    } catch (error: unknown) {
      const err = error as StripeError;
      this.logger.error(
        `Erro ao processar customer.subscription.trial_will_end: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Obtém o preço do plano
   */
  private getPlanPrice(plan: string, billingCycle: string): number {
    const prices: Record<string, Record<string, number>> = {
      workshops_starter: {
        monthly: 49.9,
        annual: 499.0,
      },
      workshops_professional: {
        monthly: 149.9,
        annual: 1499.0,
      },
      workshops_enterprise: {
        monthly: 499.9,
        annual: 4999.0,
      },
    };

    return prices[plan]?.[billingCycle] || prices[plan]?.monthly || 0;
  }
}
