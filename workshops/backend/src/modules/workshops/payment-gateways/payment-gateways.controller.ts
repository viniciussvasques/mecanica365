import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';
import { PaymentGatewaysService } from './payment-gateways.service';
import { CreatePaymentGatewayDto } from './dto/create-payment-gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment-gateway.dto';
import { PaymentGatewayResponseDto } from './dto/payment-gateway-response.dto';

@ApiTags('Payment Gateways')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'accountant', 'superadmin')
@Controller('payment-gateways')
export class PaymentGatewaysController {
  constructor(
    private readonly paymentGatewaysService: PaymentGatewaysService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar gateways configurados' })
  @ApiResponse({ status: 200, type: [PaymentGatewayResponseDto] })
  findAll(@TenantId() tenantId: string): Promise<PaymentGatewayResponseDto[]> {
    return this.paymentGatewaysService.findAll(tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar gateway de pagamento' })
  @ApiResponse({ status: 201, type: PaymentGatewayResponseDto })
  create(
    @TenantId() tenantId: string,
    @Body() createDto: CreatePaymentGatewayDto,
  ): Promise<PaymentGatewayResponseDto> {
    return this.paymentGatewaysService.create(tenantId, createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar gateway' })
  @ApiResponse({ status: 200, type: PaymentGatewayResponseDto })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdatePaymentGatewayDto,
  ): Promise<PaymentGatewayResponseDto> {
    return this.paymentGatewaysService.update(tenantId, id, updateDto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Definir gateway padrão' })
  async setDefault(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.paymentGatewaysService.setDefault(tenantId, id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Testar conexão do gateway' })
  async test(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.paymentGatewaysService.testConnection(tenantId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover gateway' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.paymentGatewaysService.remove(tenantId, id);
  }
}
