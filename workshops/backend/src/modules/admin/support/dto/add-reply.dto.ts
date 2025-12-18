import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class AddReplyDto {
  @IsString()
  message: string;

  @IsBoolean()
  @IsOptional()
  isInternal?: boolean;

  @IsBoolean()
  @IsOptional()
  closeTicket?: boolean;
}
