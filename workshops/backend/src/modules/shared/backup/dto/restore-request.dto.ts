import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class RestoreRequestDto {
  @IsString()
  backupId: string;

  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsOptional()
  @IsBoolean()
  testRestore?: boolean; // Se true, restaura em banco de teste
}

