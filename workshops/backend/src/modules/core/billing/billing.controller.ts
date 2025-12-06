import {
  Controller,
  Get,
  Post,
  Patch,
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
import { BillingService } from './billing.service';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SubscriptionResponseDto,
  UpgradeSubscriptionDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../../../common/decorators/tenant.decorator';

@ApiTags('Billing')
@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @Roles('admin', 'manager', 'superadmin')
  @ApiOperation({ summary: 'Obter subscription atual do tenant' })
  @ApiResponse({
    status: 200,
    description: 'Subscription encontrada',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Subscription não encontrada' })
  async getCurrentSubscription(
    @TenantId() tenantId: string | undefined,
  ): Promise<SubscriptionResponseDto> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.billingService.findByTenantId(tenantId);
  }

  @Get('plans')
  @Roles('admin', 'manager', 'superadmin', 'user')
  @ApiOperation({ summary: 'Listar planos disponíveis' })
  @ApiResponse({
    status: 200,
    description: 'Lista de planos disponíveis',
  })
  async getAvailablePlans() {
    return this.billingService.getAvailablePlans();
  }

  @Post('subscription')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova subscription (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Subscription criada com sucesso',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async create(
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    return this.billingService.create(createSubscriptionDto);
  }

  @Patch('subscription')
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: 'Atualizar subscription atual' })
  @ApiResponse({
    status: 200,
    description: 'Subscription atualizada com sucesso',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Subscription não encontrada' })
  async update(
    @TenantId() tenantId: string | undefined,
    @Body() updateSubscriptionDto: UpdateSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.billingService.update(tenantId, updateSubscriptionDto);
  }

  @Post('subscription/upgrade')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer upgrade de plano' })
  @ApiResponse({
    status: 200,
    description: 'Upgrade realizado com sucesso',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Plano inválido ou downgrade' })
  @ApiResponse({ status: 404, description: 'Subscription não encontrada' })
  async upgrade(
    @TenantId() tenantId: string | undefined,
    @Body() upgradeDto: UpgradeSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.billingService.upgrade(tenantId, upgradeDto.newPlan);
  }

  @Post('subscription/downgrade')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer downgrade de plano' })
  @ApiResponse({
    status: 200,
    description: 'Downgrade realizado com sucesso',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Plano inválido ou upgrade' })
  @ApiResponse({ status: 404, description: 'Subscription não encontrada' })
  async downgrade(
    @TenantId() tenantId: string | undefined,
    @Body() upgradeDto: UpgradeSubscriptionDto,
  ): Promise<SubscriptionResponseDto> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.billingService.downgrade(tenantId, upgradeDto.newPlan);
  }

  @Post('subscription/cancel')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar subscription' })
  @ApiResponse({
    status: 200,
    description: 'Subscription cancelada com sucesso',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Subscription não encontrada' })
  async cancel(
    @TenantId() tenantId: string | undefined,
  ): Promise<SubscriptionResponseDto> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.billingService.cancel(tenantId);
  }

  @Post('subscription/reactivate')
  @Roles('admin', 'superadmin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reativar subscription cancelada' })
  @ApiResponse({
    status: 200,
    description: 'Subscription reativada com sucesso',
    type: SubscriptionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Subscription não encontrada' })
  async reactivate(
    @TenantId() tenantId: string | undefined,
  ): Promise<SubscriptionResponseDto> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.billingService.reactivate(tenantId);
  }
}
