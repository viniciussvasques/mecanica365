import { ApiProperty } from '@nestjs/swagger';

export class BulkEmailErrorDto {
  @ApiProperty({ description: 'Email do destinatário que falhou' })
  email: string;

  @ApiProperty({ description: 'Mensagem de erro' })
  error: string;
}

export class BulkEmailResponseDto {
  @ApiProperty({ description: 'Total de destinatários' })
  total: number;

  @ApiProperty({ description: 'Quantidade de emails enviados com sucesso' })
  sent: number;

  @ApiProperty({ description: 'Quantidade de emails que falharam' })
  failed: number;

  @ApiProperty({
    description: 'Lista de erros ocorridos',
    type: [BulkEmailErrorDto],
  })
  errors: BulkEmailErrorDto[];

  @ApiProperty({ description: 'Mensagem de status' })
  message: string;
}

