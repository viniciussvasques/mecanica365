import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { TenantId } from '@common/decorators/tenant.decorator';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('Feature Flags')
@Controller('feature-flags')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar todas as features disponíveis para o tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Features disponíveis',
  })
  async getFeatures(@TenantId() tenantId: string) {
    const features = await this.featureFlagsService.getTenantFeatures(tenantId);
    return {
      features,
      tenantId,
    };
  }

  @Get('plans')
  @ApiOperation({ summary: 'Listar todos os planos disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Planos disponíveis',
  })
  getPlans() {
    const plans = this.featureFlagsService.getAvailablePlans();
    return {
      plans,
    };
  }
}
