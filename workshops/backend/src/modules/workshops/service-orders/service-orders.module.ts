import { Module } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { ServiceOrdersController } from './service-orders.controller';
import { PrismaModule } from '@database/prisma.module';
import { ElevatorsModule } from '../elevators/elevators.module';
import { ChecklistsModule } from '../checklists/checklists.module';
import { AttachmentsModule } from '../attachments/attachments.module';
import { NotificationsModule } from '@core/notifications/notifications.module';
import { InvoicingModule } from '../invoicing/invoicing.module';
import { PaymentGatewaysModule } from '../payment-gateways/payment-gateways.module';

@Module({
  imports: [
    PrismaModule,
    ElevatorsModule,
    ChecklistsModule,
    AttachmentsModule,
    NotificationsModule,
    InvoicingModule,
    PaymentGatewaysModule,
  ],
  controllers: [ServiceOrdersController],
  providers: [ServiceOrdersService],
  exports: [ServiceOrdersService],
})
export class ServiceOrdersModule {}
