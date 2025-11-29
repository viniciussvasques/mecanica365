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
import { ServiceOrdersService } from './service-orders.service';
import {
  CreateServiceOrderDto,
  UpdateServiceOrderDto,
  ServiceOrderResponseDto,
  ServiceOrderFiltersDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Service Orders')
@ApiBearerAuth()
@Controller('service-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Criar uma nova ordem de serviço' })
  @ApiResponse({
    status: 201,
    description: 'Ordem de serviço criada com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 404,
    description: 'Cliente ou mecânico não encontrado',
  })
  async create(
    @TenantId() tenantId: string,
    @Body() createServiceOrderDto: CreateServiceOrderDto,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.create(tenantId, createServiceOrderDto);
  }

  @Get()
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Listar ordens de serviço com filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de ordens de serviço',
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: ServiceOrderFiltersDto,
  ) {
    return this.serviceOrdersService.findAll(tenantId, filters);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Buscar ordem de serviço por ID' })
  @ApiParam({ name: 'id', description: 'ID da ordem de serviço' })
  @ApiResponse({
    status: 200,
    description: 'Ordem de serviço encontrada',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ordem de serviço não encontrada' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Atualizar ordem de serviço' })
  @ApiParam({ name: 'id', description: 'ID da ordem de serviço' })
  @ApiResponse({
    status: 200,
    description: 'Ordem de serviço atualizada com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ordem de serviço não encontrada' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateServiceOrderDto: UpdateServiceOrderDto,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.update(
      tenantId,
      id,
      updateServiceOrderDto,
    );
  }

  @Post(':id/start')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Iniciar ordem de serviço' })
  @ApiParam({ name: 'id', description: 'ID da ordem de serviço' })
  @ApiResponse({
    status: 200,
    description: 'Ordem de serviço iniciada com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ordem de serviço não encontrada' })
  @ApiResponse({ status: 400, description: 'OS já finalizada ou cancelada' })
  async start(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.start(tenantId, id);
  }

  @Post(':id/complete')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Finalizar ordem de serviço' })
  @ApiParam({ name: 'id', description: 'ID da ordem de serviço' })
  @ApiResponse({
    status: 200,
    description: 'Ordem de serviço finalizada com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ordem de serviço não encontrada' })
  @ApiResponse({ status: 400, description: 'OS já finalizada ou cancelada' })
  async complete(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.complete(tenantId, id);
  }

  @Post(':id/cancel')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Cancelar ordem de serviço' })
  @ApiParam({ name: 'id', description: 'ID da ordem de serviço' })
  @ApiResponse({
    status: 200,
    description: 'Ordem de serviço cancelada com sucesso',
    type: ServiceOrderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ordem de serviço não encontrada' })
  @ApiResponse({ status: 400, description: 'OS já finalizada ou cancelada' })
  async cancel(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<ServiceOrderResponseDto> {
    return this.serviceOrdersService.cancel(tenantId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Remover ordem de serviço' })
  @ApiParam({ name: 'id', description: 'ID da ordem de serviço' })
  @ApiResponse({
    status: 204,
    description: 'Ordem de serviço removida com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Ordem de serviço não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover OS com fatura associada',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.serviceOrdersService.remove(tenantId, id);
  }
}
