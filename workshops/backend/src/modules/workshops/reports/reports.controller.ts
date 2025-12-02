import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GenerateReportDto, ReportResponseDto } from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { FeatureGuard } from '@core/feature-flags/guards/feature.guard';
import { RequireFeature } from '@core/feature-flags/decorators/require-feature.decorator';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'accountant')
  @ApiOperation({ summary: 'Gerar relatório (Premium - Enterprise)' })
  @ApiResponse({
    status: 201,
    description: 'Relatório gerado com sucesso',
    type: ReportResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  async generate(
    @TenantId() tenantId: string,
    @Body() generateReportDto: GenerateReportDto,
  ): Promise<ReportResponseDto> {
    return this.reportsService.generate(tenantId, generateReportDto);
  }
}
