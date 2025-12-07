import { ApiProperty } from '@nestjs/swagger';
import { PaymentGatewayType } from './payment-gateway-types.enum';

export class PaymentGatewayResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: PaymentGatewayType })
  type: PaymentGatewayType;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty({ type: Object })
  credentials: Record<string, unknown>;

  @ApiProperty({ type: Object, required: false })
  settings?: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
