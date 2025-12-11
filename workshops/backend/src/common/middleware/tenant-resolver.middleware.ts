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
    const fullPath = req.originalUrl || req.url || req.path;
    const pathWithoutQuery = fullPath.split('?')[0];

    if (this.isHealthCheckRoute(fullPath, req.path)) {
      return next();
    }

    if (this.isPublicRoute(pathWithoutQuery, req.method)) {
      this.logger.log(
        `✅ Rota pública acessada: ${pathWithoutQuery} (${req.method})`,
      );
      return next();
    }

    const subdomain = this.extractSubdomain(req);

    if (!this.isValidSubdomain(subdomain)) {
      return this.handleInvalidSubdomain(req, pathWithoutQuery, next);
    }

    if (subdomain) {
      await this.resolveAndInjectTenant(req, subdomain, next);
    }
  }

  private isHealthCheckRoute(fullPath: string, path: string): boolean {
    return (
      fullPath === '/api/health/status' ||
      fullPath === '/health/status' ||
      path === '/health/status'
    );
  }

  private isPublicRoute(pathWithoutQuery: string, method: string): boolean {
    return (
      this.isPublicTenantRoute(pathWithoutQuery, method) ||
      this.isPublicOnboardingRoute(pathWithoutQuery, method) ||
      this.isPublicEmailRoute(pathWithoutQuery, method) ||
      this.isPublicAuthRoute(pathWithoutQuery, method)
    );
  }

  private isPublicTenantRoute(
    pathWithoutQuery: string,
    method: string,
  ): boolean {
    return (
      (pathWithoutQuery === '/api/tenants' && method === 'POST') ||
      pathWithoutQuery.startsWith('/api/tenants/subdomain/')
    );
  }

  private isPublicOnboardingRoute(
    pathWithoutQuery: string,
    method: string,
  ): boolean {
    return (
      (pathWithoutQuery === '/api/onboarding/register' && method === 'POST') ||
      (pathWithoutQuery === '/api/onboarding/checkout' && method === 'POST') ||
      (pathWithoutQuery === '/api/onboarding/webhooks/stripe' &&
        method === 'POST') ||
      (pathWithoutQuery === '/api/onboarding/check-status' && method === 'POST')
    );
  }

  private isPublicEmailRoute(
    pathWithoutQuery: string,
    method: string,
  ): boolean {
    return (
      (pathWithoutQuery === '/api/email/test' && method === 'POST') ||
      (pathWithoutQuery === '/api/email/status' && method === 'GET')
    );
  }

  private isPublicAuthRoute(pathWithoutQuery: string, method: string): boolean {
    return (
      (pathWithoutQuery === '/api/auth/find-tenant' && method === 'POST') ||
      (pathWithoutQuery === '/api/auth/login' && method === 'POST') ||
      (pathWithoutQuery === '/api/auth/refresh' && method === 'POST') ||
      (pathWithoutQuery === '/api/auth/forgot-password' && method === 'POST') ||
      (pathWithoutQuery === '/api/auth/reset-password' && method === 'POST') ||
      (pathWithoutQuery === '/api/auth/validate-reset-token' &&
        method === 'GET')
    );
  }

  private extractSubdomain(req: RequestWithTenant): string | undefined {
    const headerSubdomain = (req.headers['x-tenant-subdomain'] as string)
      ?.toLowerCase()
      .trim();
    const host = req.headers.host;
    const hostSubdomain = host?.split('.')[0]?.toLowerCase();
    return headerSubdomain || hostSubdomain;
  }

  private isValidSubdomain(subdomain?: string): boolean {
    return (
      !!subdomain &&
      subdomain !== 'api' &&
      subdomain !== 'www' &&
      subdomain !== 'localhost'
    );
  }

  private handleInvalidSubdomain(
    req: RequestWithTenant,
    pathWithoutQuery: string,
    next: NextFunction,
  ): void {
    const isPublicAuthRoute = this.isPublicAuthRoute(
      pathWithoutQuery,
      req.method,
    );

    if (isPublicAuthRoute) {
      return next();
    }

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

  private async resolveAndInjectTenant(
    req: RequestWithTenant,
    subdomain: string,
    next: NextFunction,
  ): Promise<void> {
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

      req.tenant = tenant;
      req.tenantId = tenant.id;

      next();
    } catch (error: unknown) {
      next(error);
    }
  }
}
