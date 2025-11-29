import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveQuoteDto {
  @ApiProperty({
    description: 'Assinatura do cliente (Base64)',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
    required: false,
  })
  @IsString({ message: 'Assinatura deve ser uma string' })
  @IsOptional()
  customerSignature?: string;

  @ApiProperty({
    description: 'ID do elevador para reservar (se não foi especificado na criação)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do elevador deve ser uma string' })
  @IsOptional()
  elevatorId?: string;
}

