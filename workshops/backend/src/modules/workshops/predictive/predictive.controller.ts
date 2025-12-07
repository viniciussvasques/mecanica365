import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { TenantId } from '@common/decorators/tenant.decorator';
import { PredictiveService } from './predictive.service';
import {
  VehiclePredictionDto,
  PredictionAlertDto,
  PredictiveInsightsDto,
} from './dto/predictive-response.dto';

@ApiTags('Predictive Maintenance')
@ApiBearerAuth()
@Controller('predictive')
@UseGuards(JwtAuthGuard, TenantGuard)
export class PredictiveController {
  constructor(private readonly predictiveService: PredictiveService) {}

  @Get('insights')
  @ApiOperation({
    summary: 'Insights preditivos para dashboard',
    description:
      'Retorna insights preditivos para todos os veículos da oficina',
  })
  @ApiResponse({
    status: 200,
    description: 'Insights preditivos gerados',
    type: PredictiveInsightsDto,
  })
  async getPredictiveInsights(
    @TenantId() tenantId: string,
  ): Promise<PredictiveInsightsDto> {
    return this.predictiveService.generatePredictiveInsights(tenantId);
  }

  @Get('vehicle/:vehicleId')
  @ApiOperation({
    summary: 'Previsões para um veículo específico',
    description:
      'Gera previsões de manutenção para um veículo baseado em seu histórico',
  })
  @ApiParam({ name: 'vehicleId', description: 'ID do veículo' })
  @ApiResponse({
    status: 200,
    description: 'Previsões geradas para o veículo',
    type: VehiclePredictionDto,
  })
  async getVehiclePredictions(
    @TenantId() tenantId: string,
    @Param('vehicleId') vehicleId: string,
  ): Promise<VehiclePredictionDto> {
    return this.predictiveService.generateVehiclePredictions(
      tenantId,
      vehicleId,
    );
  }

  @Get('alerts')
  @ApiOperation({
    summary: 'Alertas de manutenção',
    description:
      'Retorna alertas de manutenções urgentes e próximas para todos os veículos',
  })
  @ApiResponse({
    status: 200,
    description: 'Alertas de manutenção gerados',
    type: [PredictionAlertDto],
  })
  async getMaintenanceAlerts(
    @TenantId() tenantId: string,
  ): Promise<PredictionAlertDto[]> {
    return this.predictiveService.generateMaintenanceAlerts(tenantId);
  }
}
