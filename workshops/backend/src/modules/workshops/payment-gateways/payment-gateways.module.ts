import { Module } from '@nestjs/common';
import { PrismaModule } from '@database/prisma.module';
import { PaymentGatewaysService } from './payment-gateways.service';
import { PaymentGatewaysController } from './payment-gateways.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentGatewaysController],
  providers: [PaymentGatewaysService],
  exports: [PaymentGatewaysService],
})
export class PaymentGatewaysModule {}
