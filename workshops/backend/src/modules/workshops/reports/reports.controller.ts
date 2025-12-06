import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto, ReportResponseDto } from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { FeatureGuard } from '@core/feature-flags/guards/feature.guard';
import { RequireFeature } from '@core/feature-flags/decorators/require-feature.decorator';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';
import { UserId } from '@common/decorators/user.decorator';

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
    @UserId() userId: string | undefined,
    @Body() generateReportDto: GenerateReportDto,
  ): Promise<ReportResponseDto> {
    return this.reportsService.generate(tenantId, generateReportDto, userId);
  }

  @Get()
  @Roles('admin', 'manager', 'accountant')
  @ApiOperation({ summary: 'Listar relatórios gerados' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de relatórios' })
  async findAll(
    @TenantId() tenantId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reportsService.findAll(
      tenantId,
      limit ? Number.parseInt(limit, 10) : 50,
      offset ? Number.parseInt(offset, 10) : 0,
    );
  }

  @Get(':id')
  @Roles('admin', 'manager', 'accountant')
  @ApiOperation({ summary: 'Buscar relatório por ID' })
  @ApiParam({ name: 'id', description: 'ID do relatório' })
  @ApiResponse({ status: 200, description: 'Relatório encontrado' })
  @ApiResponse({ status: 404, description: 'Relatório não encontrado' })
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.reportsService.findOne(tenantId, id);
  }

  @Get(':id/download')
  @Roles('admin', 'manager', 'accountant')
  @ApiOperation({ summary: 'Download do relatório' })
  @ApiParam({ name: 'id', description: 'ID do relatório' })
  @ApiResponse({
    status: 200,
    description: 'Arquivo do relatório',
  })
  @ApiResponse({ status: 404, description: 'Relatório não encontrado' })
  async download(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const report = await this.reportsService.findOne(tenantId, id);
    const fileBuffer = await this.reportsService.getReportFile(tenantId, id);

    // Determinar content-type baseado no formato
    let contentType = 'application/octet-stream';
    let extension = 'bin';
    if (report.format === 'pdf') {
      contentType = 'application/pdf';
      extension = 'pdf';
    } else if (report.format === 'excel' || report.format === 'xlsx') {
      contentType =
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      extension = 'xlsx';
    } else if (report.format === 'csv') {
      contentType = 'text/csv';
      extension = 'csv';
    } else if (report.format === 'json') {
      contentType = 'application/json';
      extension = 'json';
    }

    const filename = report.filename || `relatorio-${id}.${extension}`;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', fileBuffer.length.toString());
    res.send(fileBuffer);
  }
}
