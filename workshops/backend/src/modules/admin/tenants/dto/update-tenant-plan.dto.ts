import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTenantPlanDto {
  @IsString()
  @IsNotEmpty()
  planId: string;
}
