import { PartialType } from '@nestjs/mapped-types';
import { CreateAdminPlanDto } from './create-admin-plan.dto';

export class UpdateAdminPlanDto extends PartialType(CreateAdminPlanDto) {}
