import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  AppointmentResponseDto,
  AppointmentFiltersDto,
  CheckAvailabilityDto,
  GetAvailableSlotsDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';
import { CurrentUser } from '@core/auth/decorators/current-user.decorator';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('admin', 'manager', 'receptionist')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um novo agendamento' })
  @ApiResponse({
    status: 201,
    description: 'Agendamento criado com sucesso',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Recurso não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  async create(
    @TenantId() tenantId: string,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.create(tenantId, createAppointmentDto);
  }

  @Get()
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Lista agendamentos com filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de agendamentos',
    type: [AppointmentResponseDto],
  })
  async findMany(
    @TenantId() tenantId: string,
    @Query() filters: AppointmentFiltersDto,
  ): Promise<{
    data: AppointmentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.appointmentsService.findMany(tenantId, filters);
  }

  @Get('check-availability')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Verifica disponibilidade para agendamento' })
  @ApiResponse({
    status: 200,
    description: 'Disponibilidade verificada',
  })
  async checkAvailability(
    @TenantId() tenantId: string,
    @Query() checkAvailabilityDto: CheckAvailabilityDto,
  ): Promise<{
    available: boolean;
    conflicts: Array<{
      type: 'mechanic' | 'elevator';
      id: string;
      name: string;
      startTime: Date;
      endTime: Date;
    }>;
  }> {
    return this.appointmentsService.checkAvailability(
      tenantId,
      checkAvailabilityDto,
    );
  }

  @Get('available-slots')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Lista horários disponíveis de um dia' })
  @ApiResponse({
    status: 200,
    description: 'Lista de horários disponíveis',
    schema: {
      type: 'object',
      properties: {
        date: { type: 'string', example: '2024-01-15' },
        availableSlots: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              startTime: { type: 'string', example: '2024-01-15T08:00:00Z' },
              endTime: { type: 'string', example: '2024-01-15T09:00:00Z' },
              available: { type: 'boolean', example: true },
              reason: { type: 'string', example: 'Agendamento existente' },
            },
          },
        },
        hasAvailability: { type: 'boolean', example: true },
      },
    },
  })
  async getAvailableSlots(
    @TenantId() tenantId: string,
    @Query() getAvailableSlotsDto: GetAvailableSlotsDto,
  ): Promise<{
    date: string;
    availableSlots: Array<{
      startTime: string;
      endTime: string;
      available: boolean;
      reason?: string;
    }>;
    hasAvailability: boolean;
  }> {
    return this.appointmentsService.getAvailableSlots(
      tenantId,
      getAvailableSlotsDto,
    );
  }

  @Get(':id')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Busca um agendamento por ID' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento encontrado',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.findOne(tenantId, id);
  }

  @Put(':id')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Atualiza um agendamento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento atualizado com sucesso',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito de horário' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.update(tenantId, id, updateAppointmentDto);
  }

  @Delete(':id')
  @Roles('admin', 'manager', 'receptionist')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um agendamento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 204, description: 'Agendamento removido' })
  @ApiResponse({ status: 400, description: 'Não é possível remover' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.appointmentsService.remove(tenantId, id);
  }

  @Post(':id/cancel')
  @Roles('admin', 'manager', 'receptionist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela um agendamento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento cancelado com sucesso',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Não é possível cancelar' })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  async cancel(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.cancel(tenantId, id);
  }

  @Post(':id/claim')
  @Roles('mechanic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mecânico pegar agendamento disponível' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({
    status: 200,
    description: 'Agendamento atribuído ao mecânico com sucesso',
    type: AppointmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Agendamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Agendamento já tem mecânico atribuído ou não está disponível',
  })
  async claim(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @CurrentUser('id') currentUserId: string,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.claim(tenantId, id, currentUserId);
  }
}
