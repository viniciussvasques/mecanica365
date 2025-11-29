import { ApiProperty } from '@nestjs/swagger';

export class VehicleResponseDto {
  @ApiProperty({
    description: 'ID do veículo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'ID do cliente proprietário',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  customerId: string;

  @ApiProperty({
    description: 'VIN do veículo',
    example: '1HGBH41JXMN109186',
    required: false,
  })
  vin?: string | null;

  @ApiProperty({
    description: 'RENAVAN do veículo',
    example: '12345678901',
    required: false,
  })
  renavan?: string | null;

  @ApiProperty({
    description: 'Placa do veículo',
    example: 'ABC1234',
    required: false,
  })
  placa?: string | null;

  @ApiProperty({
    description: 'Marca do veículo',
    example: 'Honda',
    required: false,
  })
  make?: string | null;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Civic',
    required: false,
  })
  model?: string | null;

  @ApiProperty({
    description: 'Ano do veículo',
    example: 2020,
    required: false,
  })
  year?: number | null;

  @ApiProperty({
    description: 'Cor do veículo',
    example: 'Branco',
    required: false,
  })
  color?: string | null;

  @ApiProperty({
    description: 'Quilometragem atual',
    example: 50000,
    required: false,
  })
  mileage?: number | null;

  @ApiProperty({
    description: 'Se é o veículo padrão do cliente',
    example: false,
  })
  isDefault: boolean;

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
