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
import { VehiclesService } from './vehicles.service';
import { VehicleQueryService } from './vehicle-query.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleResponseDto,
  VehicleFiltersDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly vehicleQueryService: VehicleQueryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Criar um novo veículo' })
  @ApiResponse({
    status: 201,
    description: 'Veículo criado com sucesso',
    type: VehicleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({ status: 409, description: 'VIN ou placa já cadastrados' })
  async create(
    @TenantId() tenantId: string,
    @Body() createVehicleDto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.create(tenantId, createVehicleDto);
  }

  @Get()
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Listar veículos com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de veículos',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/VehicleResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: VehicleFiltersDto,
  ): Promise<{
    data: VehicleResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.vehiclesService.findAll(tenantId, filters);
  }

  @Get('query/placa/:placa')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Consultar dados do veículo por placa' })
  @ApiParam({ name: 'placa', description: 'Placa do veículo' })
  @ApiResponse({
    status: 200,
    description: 'Dados do veículo encontrados',
    schema: {
      type: 'object',
      properties: {
        make: { type: 'string' },
        model: { type: 'string' },
        year: { type: 'number' },
        color: { type: 'string' },
        vin: { type: 'string' },
        renavan: { type: 'string' },
        fuelType: { type: 'string' },
        engine: { type: 'string' },
        chassis: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Placa inválida ou erro na consulta',
  })
  async queryByPlaca(@Param('placa') placa: string) {
    return this.vehicleQueryService.queryByPlaca(placa);
  }

  @Get('query/renavan/:renavan')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Consultar dados do veículo por RENAVAN' })
  @ApiParam({ name: 'renavan', description: 'RENAVAN do veículo' })
  @ApiResponse({
    status: 200,
    description: 'Dados do veículo encontrados',
    schema: {
      type: 'object',
      properties: {
        make: { type: 'string' },
        model: { type: 'string' },
        year: { type: 'number' },
        color: { type: 'string' },
        vin: { type: 'string' },
        placa: { type: 'string' },
        fuelType: { type: 'string' },
        engine: { type: 'string' },
        chassis: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'RENAVAN inválido ou erro na consulta',
  })
  async queryByRenavan(@Param('renavan') renavan: string) {
    return this.vehicleQueryService.queryByRenavan(renavan);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Buscar um veículo por ID' })
  @ApiParam({ name: 'id', description: 'ID do veículo' })
  @ApiResponse({
    status: 200,
    description: 'Veículo encontrado',
    type: VehicleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Atualizar um veículo' })
  @ApiParam({ name: 'id', description: 'ID do veículo' })
  @ApiResponse({
    status: 200,
    description: 'Veículo atualizado com sucesso',
    type: VehicleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  @ApiResponse({ status: 409, description: 'VIN ou placa já cadastrados' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    return this.vehiclesService.update(tenantId, id, updateVehicleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Remover um veículo' })
  @ApiParam({ name: 'id', description: 'ID do veículo' })
  @ApiResponse({ status: 204, description: 'Veículo removido com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Veículo possui ordens de serviço associadas',
  })
  @ApiResponse({ status: 404, description: 'Veículo não encontrado' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.vehiclesService.remove(tenantId, id);
  }
}
