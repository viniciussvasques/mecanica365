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
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponseDto,
  PaymentFiltersDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { FeatureGuard } from '@core/feature-flags/guards/feature.guard';
import { RequireFeature } from '@core/feature-flags/decorators/require-feature.decorator';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard, FeatureGuard)
@RequireFeature('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Criar um novo pagamento (Premium - Enterprise)' })
  @ApiResponse({
    status: 201,
    description: 'Pagamento criado com sucesso',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  @ApiResponse({ status: 404, description: 'Fatura não encontrada' })
  async create(
    @TenantId() tenantId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.create(tenantId, createPaymentDto);
  }

  @Get()
  @Roles('admin', 'manager', 'receptionist', 'accountant')
  @ApiOperation({
    summary: 'Listar pagamentos com filtros (Premium - Enterprise)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagamentos',
  })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: PaymentFiltersDto,
  ): Promise<{
    data: PaymentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.paymentsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'receptionist', 'accountant')
  @ApiOperation({ summary: 'Buscar pagamento por ID (Premium - Enterprise)' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({
    status: 200,
    description: 'Pagamento encontrado',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Atualizar pagamento (Premium - Enterprise)' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({
    status: 200,
    description: 'Pagamento atualizado com sucesso',
    type: PaymentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível atualizar pagamento reembolsado',
  })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.update(tenantId, id, updatePaymentDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Remover pagamento (Premium - Enterprise)' })
  @ApiParam({ name: 'id', description: 'ID do pagamento' })
  @ApiResponse({ status: 204, description: 'Pagamento removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Pagamento não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível remover pagamento completo ou reembolsado',
  })
  @ApiResponse({
    status: 403,
    description: 'Feature não habilitada para este plano',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.paymentsService.remove(tenantId, id);
  }
}
