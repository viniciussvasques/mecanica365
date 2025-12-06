import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { SupportPriority, SupportCategory } from './create-support-ticket.dto';
import { SupportStatus } from './support-ticket-response.dto';

export class UpdateSupportTicketDto {
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
    description: 'Notas internas (visíveis apenas para admins)',
    required: false,
  })
  @IsString()
  @IsOptional()
  internalNotes?: string;
}
