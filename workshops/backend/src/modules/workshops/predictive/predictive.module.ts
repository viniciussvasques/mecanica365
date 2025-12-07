import { Module } from '@nestjs/common';
import { PredictiveController } from './predictive.controller';
import { PredictiveService } from './predictive.service';
import { PrismaModule } from '@database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PredictiveController],
  providers: [PredictiveService],
  exports: [PredictiveService],
})
export class PredictiveModule {}
