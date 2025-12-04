import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateWebhookDto } from './create-webhook.dto';

export class UpdateWebhookDto extends PartialType(CreateWebhookDto) {
  @ApiPropertyOptional({ description: 'Status ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
