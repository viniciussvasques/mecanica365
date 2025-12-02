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
} from '@nestjs/swagger';
import { InvoicingService } from './invoicing.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceResponseDto,
  InvoiceFiltersDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { FeatureGuard } from '@core/feature-flags/guards/feature.guard';
import { RequireFeature } from '@core/feature-flags/decorators/require-feature.decorator';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Invoicing')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('invoices')
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Criar uma nova fatura (Premium - Enterprise)' })
  @ApiResponse({
    status: 201,
    description: 'Fatura criada com sucesso',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  @ApiResponse({
    status: 404,
    description: 'Cliente ou ordem de serviço não encontrada',
  })
  async create(
    @TenantId() tenantId: string,
    @Body() createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoicingService.create(tenantId, createInvoiceDto);
  }

  @Get()
  @Roles('admin', 'manager', 'receptionist', 'accountant')
  @ApiOperation({
    summary: 'Listar faturas com filtros (Premium - Enterprise)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de faturas',
  })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: InvoiceFiltersDto,
  ): Promise<{
    data: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.invoicingService.findAll(tenantId, filters);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'receptionist', 'accountant')
  @ApiOperation({ summary: 'Buscar fatura por ID (Premium - Enterprise)' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Fatura encontrada',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicingService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Atualizar fatura (Premium - Enterprise)' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Fatura atualizada com sucesso',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível atualizar fatura emitida ou paga',
  })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    return this.invoicingService.update(tenantId, id, updateInvoiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Remover fatura (Premium - Enterprise)' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({ status: 204, description: 'Fatura removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover fatura emitida ou paga',
  })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.invoicingService.remove(tenantId, id);
  }

  @Post(':id/issue')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Emitir fatura (Premium - Enterprise)' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Fatura emitida com sucesso',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Fatura já foi emitida ou está cancelada',
  })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  async issue(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicingService.issue(tenantId, id);
  }

  @Post(':id/cancel')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Cancelar fatura (Premium - Enterprise)' })
  @ApiParam({ name: 'id', description: 'ID da fatura' })
  @ApiResponse({
    status: 200,
    description: 'Fatura cancelada com sucesso',
    type: InvoiceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível cancelar fatura paga',
  })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  async cancel(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<InvoiceResponseDto> {
    return this.invoicingService.cancel(tenantId, id);
  }
}
