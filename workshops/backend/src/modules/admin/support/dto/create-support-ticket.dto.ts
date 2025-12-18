import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateSupportTicketDto {
  @IsString()
  subject: string;

  @IsString()
  message: string;

  @IsEnum(['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'])
  @IsOptional()
  status?: string;

  @IsEnum(['low', 'normal', 'high', 'urgent'])
  @IsOptional()
  priority?: string;

  @IsEnum(['technical', 'billing', 'account', 'feature_request', 'general'])
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  userEmail?: string;

  @IsString()
  @IsOptional()
  userName?: string;
}
