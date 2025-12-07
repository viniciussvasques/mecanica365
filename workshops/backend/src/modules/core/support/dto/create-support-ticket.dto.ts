import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';

export enum SupportPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum SupportCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  ACCOUNT = 'account',
  FEATURE_REQUEST = 'feature_request',
  GENERAL = 'general',
}

export class CreateSupportTicketDto {
  @ApiProperty({
    description: 'Assunto do ticket',
    example: 'Problema com login',
  })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({
    description: 'Mensagem do ticket',
    example: 'Não consigo fazer login no sistema',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Categoria do ticket',
    enum: SupportCategory,
    required: false,
  })
  @IsEnum(SupportCategory)
  @IsOptional()
  category?: SupportCategory;

  @ApiProperty({
    description: 'Prioridade do ticket',
    enum: SupportPriority,
    default: SupportPriority.NORMAL,
    required: false,
  })
  @IsEnum(SupportPriority)
  @IsOptional()
  priority?: SupportPriority = SupportPriority.NORMAL;

  @ApiProperty({
    description:
      'Email do usuário (opcional, será preenchido automaticamente se logado)',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  userEmail?: string;

  @ApiProperty({
    description:
      'Nome do usuário (opcional, será preenchido automaticamente se logado)',
    required: false,
  })
  @IsString()
  @IsOptional()
  userName?: string;
}
