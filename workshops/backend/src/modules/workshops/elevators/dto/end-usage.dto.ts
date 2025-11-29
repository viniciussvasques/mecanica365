import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class EndUsageDto {
  @ApiProperty({
    description: 'ID do uso do elevador a ser finalizado',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do uso deve ser uma string' })
  @IsOptional()
  usageId?: string;

  @ApiProperty({
    description: 'Observações finais sobre o uso do elevador',
    example: 'Serviço concluído com sucesso',
    required: false,
  })
  @IsString({ message: 'Observações devem ser uma string' })
  @IsOptional()
  @Transform(({ value }): string | undefined =>
    value === '' ? undefined : value,
  )
  notes?: string;
}
