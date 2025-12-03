import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsUrl, ArrayMinSize, MaxLength } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ description: 'URL do webhook' })
  @IsUrl()
  @IsString()
  url: string;

  @ApiProperty({ description: 'Secret para assinatura HMAC' })
  @IsString()
  @MaxLength(255)
  secret: string;

  @ApiProperty({
    description: 'Eventos que o webhook escuta',
    type: [String],
    example: ['quote.approved', 'service_order.completed'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  events: string[];
}

