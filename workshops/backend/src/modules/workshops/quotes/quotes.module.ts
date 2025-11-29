import { Module } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { PrismaModule } from '@database/prisma.module';
import { ElevatorsModule } from '../elevators/elevators.module';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';
import { QuotePdfService } from './pdf/quote-pdf.service';

@Module({
  imports: [PrismaModule, ElevatorsModule, ServiceOrdersModule],
  controllers: [QuotesController],
  providers: [QuotesService, QuotePdfService],
  exports: [QuotesService],
})
export class QuotesModule {}

