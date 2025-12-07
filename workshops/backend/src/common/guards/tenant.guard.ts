import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

interface UserFromToken {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

interface RequestWithTenant extends Request {
  tenantId?: string;
  user?: UserFromToken;
}

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenantIdFromUrl = request.tenantId;
    const user = request.user;

    // Verificar se o tenant foi resolvido da URL
    if (!tenantIdFromUrl) {
      throw new UnauthorizedException('Tenant not resolved');
    }

    // Se não há usuário autenticado, permitir (rotas públicas)
    if (!user) {
      return true;
    }

    // VALIDAÇÃO CRÍTICA: O tenant do usuário logado DEVE corresponder ao tenant da URL
    // Isso previne que usuários de um tenant acessem dados de outro tenant
    const userTenantId = user.tenantId;

    // Superadmins podem acessar qualquer tenant
    if (user.role === 'superadmin') {
      return true;
    }

    // Para usuários normais, o tenant DEVE corresponder
    if (userTenantId && userTenantId !== tenantIdFromUrl) {
      throw new ForbiddenException(
        'Acesso negado: você não tem permissão para acessar este tenant. Faça login na sua própria oficina.',
      );
    }

    return true;
  }
}
