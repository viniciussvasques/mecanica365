import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

interface RequestWithTenant extends Request {
  tenantId?: string;
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }

    return true;
  }
}
