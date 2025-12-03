import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WebhookResponseDto {
  @ApiProperty({ description: 'ID do webhook' })
  id: string;

  @ApiProperty({ description: 'URL do webhook' })
  url: string;

  @ApiProperty({ description: 'Secret para assinatura HMAC' })
  secret: string;

  @ApiProperty({ description: 'Eventos que o webhook escuta', type: [String] })
  events: string[];

  @ApiProperty({ description: 'Status ativo' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Última vez que foi acionado' })
  lastTriggeredAt?: Date;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
