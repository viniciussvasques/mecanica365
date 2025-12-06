import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateSupportReplyDto {
  @ApiProperty({
    description: 'Conteúdo da resposta',
    example: 'Obrigado pelo contato. Vamos verificar o problema.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Resposta interna (visível apenas para admins)',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isInternal?: boolean = false;

  @ApiProperty({
    description: 'Anexos (URLs ou IDs de arquivos)',
    type: [String],
    required: false,
  })
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
