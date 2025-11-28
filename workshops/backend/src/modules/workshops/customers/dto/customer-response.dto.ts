import { ApiProperty } from '@nestjs/swagger';

export class CustomerResponseDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do tenant',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  tenantId: string;

  @ApiProperty({
    description: 'Nome completo do cliente',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Email do cliente',
    example: 'joao.silva@email.com',
    required: false,
    nullable: true,
  })
  email: string | null;

  @ApiProperty({
    description: 'Telefone do cliente',
    example: '(11) 98765-4321',
  })
  phone: string;

  @ApiProperty({
    description: 'CPF do cliente',
    example: '12345678901',
    required: false,
    nullable: true,
  })
  cpf: string | null;

  @ApiProperty({
    description: 'Endereço completo do cliente',
    example: 'Rua das Flores, 123 - Centro - São Paulo/SP',
    required: false,
    nullable: true,
  })
  address: string | null;

  @ApiProperty({
    description: 'Observações sobre o cliente',
    example: 'Cliente preferencial, sempre paga em dia',
    required: false,
    nullable: true,
  })
  notes: string | null;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
