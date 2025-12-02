import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CompleteServiceOrderDto {
  @ApiPropertyOptional({
    description: 'Notas finais do mecânico sobre o serviço realizado',
    example:
      'Serviço concluído com sucesso. Todas as peças foram substituídas conforme especificado.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  finalNotes?: string;
}
