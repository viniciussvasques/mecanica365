import { ApiProperty } from '@nestjs/swagger';
import { TenantStatus, TenantPlan } from './create-tenant.dto';

export class SubscriptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  plan: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  currentPeriodStart: Date;

  @ApiProperty()
  currentPeriodEnd: Date;
}

export class TenantResponseDto {
  @ApiProperty({ description: 'ID do tenant', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Nome da oficina', example: 'Oficina do João' })
  name: string;

  @ApiProperty({ description: 'Tipo de documento', enum: ['cnpj', 'cpf'] })
  documentType: string;

  @ApiProperty({ description: 'CNPJ ou CPF', example: '12345678000199' })
  document: string;

  @ApiProperty({ description: 'Subdomain', example: 'oficina-joao' })
  subdomain: string;

  @ApiProperty({
    description: 'Plano',
    enum: TenantPlan,
    example: TenantPlan.WORKSHOPS_STARTER,
  })
  plan: TenantPlan;

  @ApiProperty({
    description: 'Status',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @ApiProperty({
    description: 'Subscription',
    type: SubscriptionResponseDto,
    required: false,
  })
  subscription?: SubscriptionResponseDto;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
