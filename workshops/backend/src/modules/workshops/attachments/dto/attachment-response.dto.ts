import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentType } from './attachment-type.enum';

export class AttachmentResponseDto {
  @ApiProperty({
    description: 'ID do anexo',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Tipo do anexo',
    enum: AttachmentType,
    example: AttachmentType.PHOTO_BEFORE,
  })
  type: AttachmentType;

  @ApiProperty({
    description: 'Nome do arquivo salvo',
    example: 'photo-1234567890-123456789.jpg',
  })
  fileName: string;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'motor-antes.jpg',
  })
  originalName: string;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
    example: 'image/jpeg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 1024000,
  })
  fileSize: number;

  @ApiProperty({
    description: 'Caminho relativo do arquivo',
    example: 'attachments/tenant-123/photo-1234567890.jpg',
  })
  filePath: string;

  @ApiProperty({
    description: 'URL pública para acesso ao arquivo',
    example: '/uploads/attachments/tenant-123/photo-1234567890.jpg',
  })
  url: string;

  @ApiPropertyOptional({
    description: 'ID do orçamento relacionado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  quoteId?: string;

  @ApiPropertyOptional({
    description: 'ID da ordem de serviço relacionada',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  serviceOrderId?: string;

  @ApiPropertyOptional({
    description: 'ID do cliente relacionado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  customerId?: string;

  @ApiPropertyOptional({
    description: 'ID do veículo relacionado',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  vehicleId?: string;

  @ApiPropertyOptional({
    description: 'Descrição do anexo',
    example: 'Foto do motor antes do serviço',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'ID do usuário que fez o upload',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  uploadedById?: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-12-01T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2025-12-01T10:00:00.000Z',
  })
  updatedAt: Date;
}
