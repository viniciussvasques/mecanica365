import { Module } from '@nestjs/common';
import { ElevatorsController } from './elevators.controller';
import { ElevatorsService } from './elevators.service';
import { PrismaModule } from '@database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ElevatorsController],
  providers: [ElevatorsService],
  exports: [ElevatorsService],
})
export class ElevatorsModule {}
