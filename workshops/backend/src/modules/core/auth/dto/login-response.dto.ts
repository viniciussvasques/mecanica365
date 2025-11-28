import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty({
    description: 'Access token JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Refresh token para renovar o access token',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'usuario@oficina.com',
      name: 'João Silva',
      role: 'technician',
    },
  })
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };

  @ApiProperty({
    description:
      'Indica se é o primeiro login do usuário (usuário criado recentemente)',
    example: true,
    required: false,
  })
  isFirstLogin?: boolean;
}
