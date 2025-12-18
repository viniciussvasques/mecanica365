import { PartialType } from '@nestjs/mapped-types';
import { CreateSystemPaymentDto } from './create-system-payment.dto';

export class UpdateSystemPaymentDto extends PartialType(CreateSystemPaymentDto) {}
