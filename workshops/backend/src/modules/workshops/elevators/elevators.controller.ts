import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
  ApiParam,
} from '@nestjs/swagger';
import { ElevatorsService } from './elevators.service';
import {
  CreateElevatorDto,
  UpdateElevatorDto,
  ElevatorResponseDto,
  ElevatorFiltersDto,
  StartUsageDto,
  EndUsageDto,
  ReserveElevatorDto,
  UsageResponseDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Elevators')
@ApiBearerAuth()
@Controller('elevators')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ElevatorsController {
  constructor(private readonly elevatorsService: ElevatorsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Criar um novo elevador' })
  @ApiResponse({
    status: 201,
    description: 'Elevador criado com sucesso',
    type: ElevatorResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Elevador já existe' })
  async create(
    @TenantId() tenantId: string,
    @Body() createElevatorDto: CreateElevatorDto,
  ): Promise<ElevatorResponseDto> {
    return this.elevatorsService.create(tenantId, createElevatorDto);
  }

  @Get()
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Listar elevadores com filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de elevadores',
    type: [ElevatorResponseDto],
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: ElevatorFiltersDto,
  ) {
    return this.elevatorsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Buscar elevador por ID' })
  @ApiParam({ name: 'id', description: 'ID do elevador' })
  @ApiResponse({
    status: 200,
    description: 'Elevador encontrado',
    type: ElevatorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Elevador não encontrado' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<ElevatorResponseDto> {
    return this.elevatorsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Atualizar elevador' })
  @ApiParam({ name: 'id', description: 'ID do elevador' })
  @ApiResponse({
    status: 200,
    description: 'Elevador atualizado com sucesso',
    type: ElevatorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Elevador não encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito (número já existe)' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateElevatorDto: UpdateElevatorDto,
  ): Promise<ElevatorResponseDto> {
    return this.elevatorsService.update(tenantId, id, updateElevatorDto);
  }

  @Post(':id/start-usage')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Iniciar uso do elevador (quando OS é iniciada)' })
  @ApiParam({ name: 'id', description: 'ID do elevador' })
  @ApiResponse({
    status: 200,
    description: 'Uso iniciado com sucesso',
    type: UsageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Elevador não encontrado' })
  @ApiResponse({ status: 400, description: 'Elevador não disponível' })
  @ApiResponse({ status: 409, description: 'Elevador já está em uso' })
  async startUsage(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() startUsageDto: StartUsageDto,
  ): Promise<UsageResponseDto> {
    return this.elevatorsService.startUsage(tenantId, id, startUsageDto);
  }

  @Post(':id/end-usage')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({
    summary: 'Finalizar uso do elevador (quando OS é finalizada)',
  })
  @ApiParam({ name: 'id', description: 'ID do elevador' })
  @ApiResponse({
    status: 200,
    description: 'Uso finalizado com sucesso',
    type: UsageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Elevador ou uso não encontrado' })
  async endUsage(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() endUsageDto: EndUsageDto,
  ): Promise<UsageResponseDto> {
    return this.elevatorsService.endUsage(tenantId, id, endUsageDto);
  }

  @Post(':id/reserve')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Reservar elevador (quando orçamento é aprovado)' })
  @ApiParam({ name: 'id', description: 'ID do elevador' })
  @ApiResponse({
    status: 200,
    description: 'Elevador reservado com sucesso',
    type: UsageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Elevador não encontrado' })
  @ApiResponse({ status: 400, description: 'Elevador não disponível' })
  @ApiResponse({ status: 409, description: 'Elevador já está ocupado' })
  async reserve(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() reserveDto: ReserveElevatorDto,
  ): Promise<UsageResponseDto> {
    return this.elevatorsService.reserve(tenantId, id, reserveDto);
  }

  @Get(':id/current-usage')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Buscar uso atual do elevador' })
  @ApiParam({ name: 'id', description: 'ID do elevador' })
  @ApiResponse({
    status: 200,
    description: 'Uso atual encontrado',
    type: UsageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Elevador não encontrado' })
  async getCurrentUsage(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<UsageResponseDto | null> {
    return this.elevatorsService.getCurrentUsage(tenantId, id);
  }

  @Get(':id/usage-history')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Buscar histórico de uso do elevador' })
  @ApiParam({ name: 'id', description: 'ID do elevador' })
  @ApiResponse({
    status: 200,
    description: 'Histórico de uso',
  })
  @ApiResponse({ status: 404, description: 'Elevador não encontrado' })
  async getUsageHistory(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.elevatorsService.getUsageHistory(tenantId, id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('status/overview')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({
    summary: 'Dashboard: Status de todos os elevadores em tempo real',
  })
  @ApiResponse({
    status: 200,
    description: 'Status dos elevadores',
  })
  async getStatusOverview(@TenantId() tenantId: string) {
    const elevators = await this.elevatorsService.findAll(tenantId, {
      limit: 100,
      page: 1,
    });

    const elevatorsWithUsage = await Promise.all(
      elevators.data.map(async (elevator) => {
        const currentUsage = await this.elevatorsService.getCurrentUsage(
          tenantId,
          elevator.id,
        );

        return {
          ...elevator,
          currentUsage: currentUsage || null,
        };
      }),
    );

    return {
      elevators: elevatorsWithUsage,
      total: elevators.total,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Remover elevador' })
  @ApiParam({ name: 'id', description: 'ID do elevador' })
  @ApiResponse({ status: 204, description: 'Elevador removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Elevador não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover elevador com uso ativo',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.elevatorsService.remove(tenantId, id);
  }
}
