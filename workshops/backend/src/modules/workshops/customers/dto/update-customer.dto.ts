import { PartialType } from '@nestjs/swagger';
import { CreateCustomerDto, DocumentType } from './create-customer.dto';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {
  documentType?: DocumentType;
  cpf?: string;
  cnpj?: string;
}
