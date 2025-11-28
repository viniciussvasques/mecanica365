import { IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TenantStatus, TenantPlan } from './create-tenant.dto';

export class UpdateTenantDto {
  @ApiProperty({
    description: 'Nome da oficina/empresa',
    example: 'Oficina do João Atualizada',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  name?: string;

  @ApiProperty({
    description: 'Status do tenant',
    enum: TenantStatus,
    example: TenantStatus.ACTIVE,
    required: false,
  })
  @IsOptional()
  @IsEnum(TenantStatus, { message: 'Status inválido' })
  status?: TenantStatus;

  @ApiProperty({
    description: 'Plano do tenant',
    enum: TenantPlan,
    example: TenantPlan.WORKSHOPS_PROFESSIONAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(TenantPlan, { message: 'Plano inválido' })
  plan?: TenantPlan;
}

