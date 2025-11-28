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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CustomerFiltersDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Criar um novo cliente' })
  @ApiResponse({
    status: 201,
    description: 'Cliente criado com sucesso',
    type: CustomerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou CPF inválido',
  })
  @ApiResponse({
    status: 409,
    description: 'Telefone ou CPF já cadastrado',
  })
  async create(
    @TenantId() tenantId: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.create(tenantId, createCustomerDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Listar clientes com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de clientes',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/CustomerResponseDto' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'phone', required: false, type: String })
  @ApiQuery({ name: 'email', required: false, type: String })
  @ApiQuery({ name: 'cpf', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: CustomerFiltersDto,
  ): Promise<{
    data: CustomerResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.customersService.findAll(tenantId, filters);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Buscar cliente por ID' })
  @ApiParam({ name: 'id', description: 'ID do cliente', type: String })
  @ApiResponse({
    status: 200,
    description: 'Cliente encontrado',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<CustomerResponseDto> {
    return this.customersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Atualizar cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente', type: String })
  @ApiResponse({
    status: 200,
    description: 'Cliente atualizado com sucesso',
    type: CustomerResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Telefone ou CPF já cadastrado',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(tenantId, id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Remover cliente' })
  @ApiParam({ name: 'id', description: 'ID do cliente', type: String })
  @ApiResponse({
    status: 204,
    description: 'Cliente removido com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Cliente não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Cliente possui relacionamentos (OS, faturas, agendamentos)',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.customersService.remove(tenantId, id);
  }
}
