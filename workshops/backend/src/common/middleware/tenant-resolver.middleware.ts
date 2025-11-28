import {
  Injectable,
  NestMiddleware,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

type TenantWithSubscription = Prisma.TenantGetPayload<{
  include: { subscription: true };
}>;

interface RequestWithTenant extends Request {
  tenant?: TenantWithSubscription;
  tenantId?: string;
}

@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantResolverMiddleware.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async use(
    req: RequestWithTenant,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    // Usar originalUrl para pegar o path completo (incluindo /api)
    // NestJS remove o prefixo /api do req.path, mas originalUrl mantém
    const fullPath = req.originalUrl || req.url || req.path;
    const pathWithoutQuery = fullPath.split('?')[0]; // Remover query string

    // Bypass para health check
    if (
      fullPath === '/api/health/status' ||
      fullPath === '/health/status' ||
      req.path === '/health/status'
    ) {
      return next();
    }

    // Bypass para rotas públicas de tenants
    // POST /api/tenants - Criar tenant (provisionamento público)
    // GET /api/tenants/subdomain/:subdomain - Buscar por subdomain (público)
    // POST /api/onboarding/register - Registro público (cria tenant pending)
    // POST /api/onboarding/checkout - Checkout público
    // POST /api/onboarding/webhooks/stripe - Webhook do Stripe (público)
    const isPublicTenantRoute =
      (pathWithoutQuery === '/api/tenants' && req.method === 'POST') ||
      pathWithoutQuery.startsWith('/api/tenants/subdomain/');

    const isPublicOnboardingRoute =
      (pathWithoutQuery === '/api/onboarding/register' &&
        req.method === 'POST') ||
      (pathWithoutQuery === '/api/onboarding/checkout' &&
        req.method === 'POST') ||
      (pathWithoutQuery === '/api/onboarding/webhooks/stripe' &&
        req.method === 'POST') ||
      (pathWithoutQuery === '/api/onboarding/check-status' &&
        req.method === 'POST');

    const isPublicEmailRoute =
      (pathWithoutQuery === '/api/email/test' && req.method === 'POST') ||
      (pathWithoutQuery === '/api/email/status' && req.method === 'GET');

    const isPublicAuthRoute =
      (pathWithoutQuery === '/api/auth/find-tenant' && req.method === 'POST') ||
      (pathWithoutQuery === '/api/auth/login' && req.method === 'POST') ||
      (pathWithoutQuery === '/api/auth/refresh' && req.method === 'POST');

    // Permitir rotas públicas sem necessidade de tenant - DEVE SER A PRIMEIRA VERIFICAÇÃO
    if (
      isPublicTenantRoute ||
      isPublicOnboardingRoute ||
      isPublicEmailRoute ||
      isPublicAuthRoute
    ) {
      this.logger.log(
        `✅ Rota pública acessada: ${pathWithoutQuery} (${req.method})`,
      );
      return next();
    }

    // Express normaliza headers para lowercase, então 'X-Tenant-Subdomain' vira 'x-tenant-subdomain'
    const headerSubdomain = (req.headers['x-tenant-subdomain'] as string)
      ?.toLowerCase()
      .trim();
    const host = req.headers.host;
    const hostSubdomain = host?.split('.')[0]?.toLowerCase();

    const subdomain = headerSubdomain || hostSubdomain;

    // Se não há subdomain válido, permitir continuar apenas para rotas públicas
    if (
      !subdomain ||
      subdomain === 'api' ||
      subdomain === 'www' ||
      subdomain === 'localhost'
    ) {
      // Rotas públicas de auth não precisam de tenant
      if (isPublicAuthRoute) {
        return next();
      }
      // Para rotas de auth que precisam de tenant, lançar erro
      if (
        req.path.includes('/auth/login') ||
        req.path.includes('/auth/refresh')
      ) {
        throw new NotFoundException(
          'Tenant subdomain é obrigatório. Use o header X-Tenant-Subdomain ou subdomain no host.',
        );
      }
      return next();
    }

    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { subdomain },
        include: { subscription: true },
      });

      if (!tenant) {
        throw new NotFoundException(`Tenant não encontrado: ${subdomain}`);
      }

      if (tenant.status !== 'active') {
        throw new NotFoundException(`Tenant está ${tenant.status}`);
      }

      // Injetar tenant no request
      req.tenant = tenant;
      req.tenantId = tenant.id;

      next();
    } catch (error) {
      next(error);
    }
  }
}
