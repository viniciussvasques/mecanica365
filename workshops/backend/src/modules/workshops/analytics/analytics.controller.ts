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
import { AnalyticsService } from './analytics.service';
import { DashboardAnalyticsDto } from './dto/analytics-response.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary: 'Dados do dashboard de analytics',
    description:
      'Retorna todas as métricas e dados para o dashboard de analytics do mecânico',
  })
  @ApiResponse({
    status: 200,
    description: 'Dados do dashboard',
    type: DashboardAnalyticsDto,
  })
  async getDashboardAnalytics(
    @TenantId() tenantId: string,
  ): Promise<DashboardAnalyticsDto> {
    return this.analyticsService.getDashboardAnalytics(tenantId);
  }
}
