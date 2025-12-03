import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class TestIntegrationDto {
  @ApiProperty({ description: 'Dados de teste' })
  @IsObject()
  testData: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Parâmetros adicionais' })
  @IsOptional()
  @IsObject()
  params?: Record<string, unknown>;
}
