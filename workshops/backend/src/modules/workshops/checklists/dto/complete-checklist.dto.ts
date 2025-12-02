import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  ValidateNested,
  IsUUID,
  IsBoolean,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class CompleteChecklistItemDto {
  @ApiProperty({
    description: 'ID do item do checklist',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  itemId: string;

  @ApiProperty({
    description: 'Se o item está completo',
    example: true,
  })
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return Boolean(value);
  })
  @IsBoolean()
  isCompleted: boolean;

  @ApiPropertyOptional({
    description: 'Notas do item',
    example: 'Verificado e aprovado',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CompleteChecklistDto {
  @ApiProperty({
    description: 'Itens completados',
    type: [CompleteChecklistItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CompleteChecklistItemDto)
  items: CompleteChecklistItemDto[];

  @ApiPropertyOptional({
    description: 'Notas gerais do checklist',
    example: 'Todos os itens foram verificados com sucesso',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
