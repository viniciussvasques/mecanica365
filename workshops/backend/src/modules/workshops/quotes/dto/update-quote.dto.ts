import { PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateQuoteDto } from './create-quote.dto';
import { QuoteStatus } from './quote-status.enum';

export class UpdateQuoteDto extends PartialType(
  OmitType(CreateQuoteDto, ['status'] as const),
) {
  @IsEnum(QuoteStatus, { message: 'Status inválido' })
  @IsOptional()
  status?: QuoteStatus;
}
