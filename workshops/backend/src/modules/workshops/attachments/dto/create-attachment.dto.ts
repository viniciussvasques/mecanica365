import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AttachmentType } from './attachment-type.enum';

export class CreateAttachmentDto {
  @ApiProperty({
    description: 'Tipo do anexo',
    enum: AttachmentType,
    example: AttachmentType.PHOTO_BEFORE,
  })
  @IsEnum(AttachmentType)
  type: AttachmentType;

  @ApiPropertyOptional({
    description: 'ID do orçamento relacionado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  quoteId?: string;

  @ApiPropertyOptional({
    description: 'ID da ordem de serviço relacionada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  serviceOrderId?: string;

  @ApiPropertyOptional({
    description: 'ID do cliente relacionado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({
    description: 'ID do veículo relacionado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiPropertyOptional({
    description: 'Descrição do anexo',
    example: 'Foto do motor antes do serviço',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
