import { ApiProperty } from '@nestjs/swagger';

export class PlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  monthlyPrice: number;

  @ApiProperty()
  annualPrice: number;

  @ApiProperty({ required: false })
  serviceOrdersLimit?: number | null;

  @ApiProperty({ required: false })
  partsLimit?: number | null;

  @ApiProperty({ required: false })
  usersLimit?: number | null;

  @ApiProperty()
  features: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ required: false })
  highlightText?: string | null;

  @ApiProperty({ required: false })
  stripePriceIdMonthly?: string | null;

  @ApiProperty({ required: false })
  stripePriceIdAnnual?: string | null;

  @ApiProperty({ required: false })
  stripeProductId?: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Computed fields for frontend compatibility
  @ApiProperty({ description: 'Preços formatados para frontend' })
  price: {
    monthly: number;
    annual: number;
  };

  @ApiProperty({ description: 'Limites formatados para frontend' })
  limits: {
    serviceOrdersLimit: number | null;
    partsLimit: number | null;
    usersLimit: number | null;
    features: string[];
  };
}
