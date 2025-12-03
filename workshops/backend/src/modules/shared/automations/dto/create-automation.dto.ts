import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  IsArray,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';

export enum AutomationTrigger {
  QUOTE_APPROVED = 'quote.approved',
  SERVICE_ORDER_COMPLETED = 'service_order.completed',
  INVOICE_ISSUED = 'invoice.issued',
  PAYMENT_RECEIVED = 'payment.received',
  STOCK_LOW = 'stock.low',
  APPOINTMENT_SCHEDULED = 'appointment.scheduled',
  CUSTOM = 'custom',
}

export enum AutomationAction {
  SEND_EMAIL = 'send_email',
  SEND_SMS = 'send_sms',
  CREATE_NOTIFICATION = 'create_notification',
  CREATE_JOB = 'create_job',
  UPDATE_STATUS = 'update_status',
  CUSTOM = 'custom',
}

export class CreateAutomationDto {
  @ApiProperty({ description: 'Nome da automação' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Descrição' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({
    description: 'Trigger (evento que dispara a automação)',
    enum: AutomationTrigger,
  })
  @IsEnum(AutomationTrigger)
  trigger: AutomationTrigger;

  @ApiProperty({
    description: 'Ação a ser executada',
    enum: AutomationAction,
  })
  @IsEnum(AutomationAction)
  action: AutomationAction;

  @ApiProperty({ description: 'Condições (opcional)' })
  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown>;

  @ApiProperty({ description: 'Configuração da ação' })
  @IsObject()
  actionConfig: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Status ativo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
