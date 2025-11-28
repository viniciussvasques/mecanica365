import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithTenant extends Request {
  tenant?: unknown;
  tenantId?: string;
}

export const Tenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.tenant;
  },
);

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithTenant>();
    return request.tenantId;
  },
);
