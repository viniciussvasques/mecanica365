import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IntegrationType, IntegrationStatus } from './create-integration.dto';

export class IntegrationResponseDto {
  @ApiProperty({ description: 'ID da integração' })
  id: string;

  @ApiProperty({ description: 'Nome da integração' })
  name: string;

  @ApiProperty({ description: 'Tipo de integração', enum: IntegrationType })
  type: IntegrationType;

  @ApiProperty({ description: 'URL da API' })
  apiUrl: string;

  @ApiPropertyOptional({ description: 'API Key (oculto na resposta)' })
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Configurações adicionais' })
  config?: Record<string, unknown>;

  @ApiProperty({ description: 'Status', enum: IntegrationStatus })
  status: IntegrationStatus;

  @ApiProperty({ description: 'Status ativo' })
  isActive: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}
