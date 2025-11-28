import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './create-user.dto';

export class UserResponseDto {
  @ApiProperty({ description: 'ID do usuário', example: 'uuid' })
  id: string;

  @ApiProperty({ description: 'ID do tenant', example: 'uuid' })
  tenantId: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@oficina.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  name: string;

  @ApiProperty({
    description: 'Role do usuário',
    enum: UserRole,
    example: UserRole.TECHNICIAN,
  })
  role: UserRole;

  @ApiProperty({ description: 'Se o usuário está ativo', example: true })
  isActive: boolean;

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
