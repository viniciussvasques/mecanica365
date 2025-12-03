import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';

export enum IntegrationType {
  RENAVAN = 'renavan',
  VIN = 'vin',
  CEP = 'cep',
  CUSTOM = 'custom',
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

export class CreateIntegrationDto {
  @ApiProperty({ description: 'Nome da integração' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Tipo de integração', enum: IntegrationType })
  @IsEnum(IntegrationType)
  type: IntegrationType;

  @ApiProperty({ description: 'URL da API' })
  @IsString()
  @MaxLength(500)
  apiUrl: string;

  @ApiPropertyOptional({ description: 'API Key' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  apiKey?: string;

  @ApiPropertyOptional({ description: 'Configurações adicionais' })
  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Status ativo', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
