import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { QuotesPublicController } from './quotes-public.controller';
import { PrismaModule } from '@database/prisma.module';
import { ElevatorsModule } from '../elevators/elevators.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { ChecklistsModule } from '../checklists/checklists.module';
import { QuotePdfService } from './pdf/quote-pdf.service';
import { NotificationsModule } from '@core/notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    ElevatorsModule,
    ServiceOrdersModule,
    AppointmentsModule,
    AttachmentsModule,
    ChecklistsModule,
    NotificationsModule,
  ],
  controllers: [QuotesController, QuotesPublicController],
  providers: [QuotesService, QuotePdfService],
  exports: [QuotesService],
})
export class QuotesModule {}
