import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaymentGatewayType } from './payment-gateway-types.enum';

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

interface JsonObject {
  [key: string]: JsonValue;
}

export class CreatePaymentGatewayDto {
  @ApiProperty({ description: 'Nome amigável do gateway' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Tipo do gateway', enum: PaymentGatewayType })
  @IsEnum(PaymentGatewayType)
  type: PaymentGatewayType;

  @ApiProperty({ description: 'Gateway está ativo?', default: true })
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Gateway deve ser padrão?' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({
    description: 'Credenciais do gateway (serão criptografadas)',
    type: Object,
  })
  @IsObject()
  credentials: JsonObject;

  @ApiPropertyOptional({
    description: 'Configurações adicionais',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  settings?: JsonObject;
}
