import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max } from 'class-validator';

export class RateKnowledgeDto {
  @ApiProperty({
    description: 'Avaliação de 1 a 5 estrelas',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1, { message: 'Avaliação mínima é 1' })
  @Max(5, { message: 'Avaliação máxima é 5' })
  rating: number;

  @ApiProperty({
    description: 'Se a solução funcionou',
    example: true,
  })
  worked: boolean;
}
