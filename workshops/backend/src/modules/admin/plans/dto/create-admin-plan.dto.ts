import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAdminPlanDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  monthlyPrice: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  annualPrice: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  serviceOrdersLimit?: number | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  partsLimit?: number | null;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  usersLimit?: number | null;

  @IsArray()
  @IsString({ each: true })
  features: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @Type(() => Number)
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  sortOrder?: number;

  @IsString()
  @IsOptional()
  highlightText?: string | null;

  @IsString()
  @IsOptional()
  stripePriceIdMonthly?: string | null;

  @IsString()
  @IsOptional()
  stripePriceIdAnnual?: string | null;

  @IsString()
  @IsOptional()
  stripeProductId?: string | null;
}
