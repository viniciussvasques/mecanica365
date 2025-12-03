import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BillingService } from '../billing.service';
import { RequestWithTenant } from '@common/interfaces/request-with-tenant.interface';

export enum LimitType {
  SERVICE_ORDERS = 'serviceOrders',
  PARTS = 'parts',
  USERS = 'users',
}

@Injectable()
export class PlanLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly billingService: BillingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenantId = request.tenantId;

    if (!tenantId) {
      return true; // Se não tem tenant, deixa passar (outros guards vão tratar)
    }

    try {
      const subscription = await this.billingService.findByTenantId(tenantId);

      // Verificar limite de service orders
      if (subscription.serviceOrdersLimit !== null) {
        if (subscription.serviceOrdersUsed >= subscription.serviceOrdersLimit) {
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: 'Limite de service orders atingido para este período',
              limit: subscription.serviceOrdersLimit,
              used: subscription.serviceOrdersUsed,
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      // Verificar limite de peças (se necessário)
      // Isso seria verificado em endpoints específicos de criação de peças

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      return true; // Em caso de erro, permite continuar (não bloqueia)
    }
  }
}
