import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignMechanicDto {
  @ApiProperty({
    description:
      'ID do mecânico a ser atribuído (opcional, se não fornecido, atribui o usuário atual)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsString({ message: 'ID do mecânico deve ser uma string' })
  @IsOptional()
  mechanicId?: string;

  @ApiProperty({
    description: 'Motivo da atribuição',
    example: 'Mecânico disponível para diagnóstico',
    required: false,
  })
  @IsString({ message: 'Motivo deve ser uma string' })
  @IsOptional()
  reason?: string;
}
