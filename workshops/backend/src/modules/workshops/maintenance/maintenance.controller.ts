import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';
import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { MaintenanceService } from './maintenance.service';
import {
  CreateMaintenanceTemplateDto,
  CreateVehicleScheduleDto,
  CreateMaintenanceHistoryDto,
  MaintenanceTemplateResponseDto,
  VehicleScheduleResponseDto,
  MaintenanceHistoryResponseDto,
  MaintenanceAlertDto,
  MaintenanceCategory,
  MaintenanceStatus,
} from './dto';

@ApiTags('Manutenção Programada')
@ApiBearerAuth()
@Controller('maintenance')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  // ============================================================
  // TEMPLATES
  // ============================================================

  @Post('templates')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Criar template de manutenção' })
  @ApiResponse({ status: 201, type: MaintenanceTemplateResponseDto })
  async createTemplate(
    @TenantId() tenantId: string,
    @Body() dto: CreateMaintenanceTemplateDto,
  ): Promise<MaintenanceTemplateResponseDto> {
    return this.maintenanceService.createTemplate(tenantId, dto);
  }

  @Get('templates')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Listar templates de manutenção' })
  @ApiQuery({ name: 'category', required: false, enum: MaintenanceCategory })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [MaintenanceTemplateResponseDto] })
  async findAllTemplates(
    @TenantId() tenantId: string,
    @Query('category') category?: MaintenanceCategory,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<MaintenanceTemplateResponseDto[]> {
    return this.maintenanceService.findAllTemplates(
      tenantId,
      category,
      includeInactive === 'true',
    );
  }

  @Get('templates/:id')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Buscar template por ID' })
  @ApiResponse({ status: 200, type: MaintenanceTemplateResponseDto })
  async findTemplateById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<MaintenanceTemplateResponseDto> {
    return this.maintenanceService.findTemplateById(tenantId, id);
  }

  @Patch('templates/:id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Atualizar template' })
  @ApiResponse({ status: 200, type: MaintenanceTemplateResponseDto })
  async updateTemplate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateMaintenanceTemplateDto>,
  ): Promise<MaintenanceTemplateResponseDto> {
    return this.maintenanceService.updateTemplate(tenantId, id, dto);
  }

  @Delete('templates/:id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover template' })
  @ApiResponse({ status: 204 })
  async deleteTemplate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.maintenanceService.deleteTemplate(tenantId, id);
  }

  // ============================================================
  // SCHEDULES (Manutenções programadas)
  // ============================================================

  @Post('schedules')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Criar manutenção programada' })
  @ApiResponse({ status: 201, type: VehicleScheduleResponseDto })
  async createSchedule(
    @TenantId() tenantId: string,
    @Body() dto: CreateVehicleScheduleDto,
    @CurrentUser() user: { id: string },
  ): Promise<VehicleScheduleResponseDto> {
    return this.maintenanceService.createSchedule(tenantId, dto, user.id);
  }

  @Get('schedules')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Listar manutenções programadas' })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: MaintenanceStatus })
  @ApiResponse({ status: 200, type: [VehicleScheduleResponseDto] })
  async findAllSchedules(
    @TenantId() tenantId: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('status') status?: MaintenanceStatus,
  ): Promise<VehicleScheduleResponseDto[]> {
    return this.maintenanceService.findAllSchedules(
      tenantId,
      vehicleId,
      status,
    );
  }

  @Get('schedules/:id')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Buscar manutenção programada por ID' })
  @ApiResponse({ status: 200, type: VehicleScheduleResponseDto })
  async findScheduleById(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<VehicleScheduleResponseDto> {
    return this.maintenanceService.findScheduleById(tenantId, id);
  }

  @Patch('schedules/:id')
  @Roles('admin', 'manager', 'mechanic')
  @ApiOperation({ summary: 'Atualizar manutenção programada' })
  @ApiResponse({ status: 200, type: VehicleScheduleResponseDto })
  async updateSchedule(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateVehicleScheduleDto>,
  ): Promise<VehicleScheduleResponseDto> {
    return this.maintenanceService.updateSchedule(tenantId, id, dto);
  }

  @Post('schedules/:id/complete')
  @Roles('admin', 'manager', 'mechanic')
  @ApiOperation({ summary: 'Marcar manutenção como concluída' })
  @ApiResponse({ status: 200, type: VehicleScheduleResponseDto })
  async completeSchedule(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ): Promise<VehicleScheduleResponseDto> {
    return this.maintenanceService.completeSchedule(tenantId, id, user.id);
  }

  @Delete('schedules/:id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover manutenção programada' })
  @ApiResponse({ status: 204 })
  async deleteSchedule(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.maintenanceService.deleteSchedule(tenantId, id);
  }

  // ============================================================
  // HISTORY (Histórico)
  // ============================================================

  @Post('history')
  @Roles('admin', 'manager', 'mechanic')
  @ApiOperation({ summary: 'Registrar manutenção realizada' })
  @ApiResponse({ status: 201, type: MaintenanceHistoryResponseDto })
  async createHistory(
    @TenantId() tenantId: string,
    @Body() dto: CreateMaintenanceHistoryDto,
    @CurrentUser() user: { id: string },
  ): Promise<MaintenanceHistoryResponseDto> {
    return this.maintenanceService.createHistory(tenantId, dto, user.id);
  }

  @Get('history')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Listar histórico de manutenções' })
  @ApiQuery({ name: 'vehicleId', required: false })
  @ApiQuery({ name: 'category', required: false, enum: MaintenanceCategory })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, type: [MaintenanceHistoryResponseDto] })
  async findAllHistory(
    @TenantId() tenantId: string,
    @Query('vehicleId') vehicleId?: string,
    @Query('category') category?: MaintenanceCategory,
    @Query('limit') limit?: string,
  ): Promise<MaintenanceHistoryResponseDto[]> {
    return this.maintenanceService.findAllHistory(
      tenantId,
      vehicleId,
      category,
      limit ? Number.parseInt(limit, 10) : 50,
    );
  }

  @Get('history/vehicle/:vehicleId')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Histórico de manutenções de um veículo' })
  @ApiResponse({ status: 200, type: [MaintenanceHistoryResponseDto] })
  async findHistoryByVehicle(
    @TenantId() tenantId: string,
    @Param('vehicleId') vehicleId: string,
  ): Promise<MaintenanceHistoryResponseDto[]> {
    return this.maintenanceService.findHistoryByVehicle(tenantId, vehicleId);
  }

  // ============================================================
  // ALERTAS E ANÁLISES
  // ============================================================

  @Get('alerts')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Obter alertas de manutenção' })
  @ApiQuery({ name: 'daysAhead', required: false, type: Number })
  @ApiResponse({ status: 200, type: [MaintenanceAlertDto] })
  async getMaintenanceAlerts(
    @TenantId() tenantId: string,
    @Query('daysAhead') daysAhead?: string,
  ): Promise<MaintenanceAlertDto[]> {
    return this.maintenanceService.getMaintenanceAlerts(
      tenantId,
      daysAhead ? Number.parseInt(daysAhead, 10) : 30,
    );
  }

  @Get('vehicle/:vehicleId/summary')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Resumo de manutenções de um veículo' })
  async getVehicleMaintenanceSummary(
    @TenantId() tenantId: string,
    @Param('vehicleId') vehicleId: string,
  ) {
    return this.maintenanceService.getVehicleMaintenanceSummary(
      tenantId,
      vehicleId,
    );
  }

  @Post('templates/:templateId/apply/:vehicleId')
  @Roles('admin', 'manager', 'mechanic')
  @ApiOperation({ summary: 'Aplicar template a um veículo' })
  @ApiQuery({ name: 'currentMileage', required: false, type: Number })
  @ApiResponse({ status: 201, type: VehicleScheduleResponseDto })
  async applyTemplateToVehicle(
    @TenantId() tenantId: string,
    @Param('templateId') templateId: string,
    @Param('vehicleId') vehicleId: string,
    @Query('currentMileage') currentMileage?: string,
  ): Promise<VehicleScheduleResponseDto> {
    return this.maintenanceService.applyTemplateToVehicle(
      tenantId,
      templateId,
      vehicleId,
      currentMileage ? Number.parseInt(currentMileage, 10) : undefined,
    );
  }
}
