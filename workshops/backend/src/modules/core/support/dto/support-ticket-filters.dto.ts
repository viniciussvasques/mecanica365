import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { SupportPriority, SupportCategory } from './create-support-ticket.dto';
import { SupportStatus } from './support-ticket-response.dto';

export class SupportTicketFiltersDto {
  @ApiProperty({
    description: 'Página (começando em 1)',
    minimum: 1,
    default: 1,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({
    description: 'Itens por página',
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiProperty({
    description: 'Status do ticket',
    enum: SupportStatus,
    required: false,
  })
  @IsEnum(SupportStatus)
  @IsOptional()
  status?: SupportStatus;

  @ApiProperty({
    description: 'Prioridade do ticket',
    enum: SupportPriority,
    required: false,
  })
  @IsEnum(SupportPriority)
  @IsOptional()
  priority?: SupportPriority;

  @ApiProperty({
    description: 'Categoria do ticket',
    enum: SupportCategory,
    required: false,
  })
  @IsEnum(SupportCategory)
  @IsOptional()
  category?: SupportCategory;

  @ApiProperty({
    description: 'ID do usuário responsável',
    required: false,
  })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @ApiProperty({
    description: 'ID do tenant',
    required: false,
  })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({
    description: 'Busca por assunto ou mensagem',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;
}
