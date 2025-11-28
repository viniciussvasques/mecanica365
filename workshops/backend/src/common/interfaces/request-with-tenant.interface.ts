import { Request } from 'express';
import { Prisma } from '@prisma/client';

type TenantWithSubscription = Prisma.TenantGetPayload<{
  include: { subscription: true };
}>;

export interface RequestWithTenant extends Request {
  tenant?: TenantWithSubscription;
  tenantId?: string;
}
