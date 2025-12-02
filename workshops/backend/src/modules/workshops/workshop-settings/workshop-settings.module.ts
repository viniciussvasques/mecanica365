import { Module } from '@nestjs/common';
import { WorkshopSettingsController } from './workshop-settings.controller';
import { WorkshopSettingsService } from './workshop-settings.service';
import { PrismaModule } from '@database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WorkshopSettingsController],
  providers: [WorkshopSettingsService],
  exports: [WorkshopSettingsService],
})
export class WorkshopSettingsModule {}
