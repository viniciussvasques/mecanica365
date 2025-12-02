import { PartialType } from '@nestjs/swagger';
import { CreateWorkshopSettingsDto } from './create-workshop-settings.dto';

export class UpdateWorkshopSettingsDto extends PartialType(
  CreateWorkshopSettingsDto,
) {}
