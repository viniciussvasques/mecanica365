import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FeatureFlagsService, FeatureName } from '../feature-flags.service';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { RequestWithTenant } from '@common/interfaces/request-with-tenant.interface';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly featureFlagsService: FeatureFlagsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeature = this.reflector.getAllAndOverride<FeatureName>(
      REQUIRE_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredFeature) {
      // Se não há feature requerida, permite acesso
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithTenant>();
    const tenantId = request.tenantId;

    if (!tenantId) {
      throw new ForbiddenException('Tenant não identificado');
    }

    const isEnabled = await this.featureFlagsService.isFeatureEnabled(
      tenantId,
      requiredFeature,
    );

    if (!isEnabled) {
      throw new ForbiddenException(
        `Feature ${requiredFeature} não está habilitada para este plano`,
      );
    }

    return true;
  }
}
