import { Module } from '@nestjs/common';
import { PrismaModule } from '@database/prisma.module';
import { DiagnosticService } from './services/diagnostic.service';
import { DiagnosticController } from './controllers/diagnostic.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DiagnosticController],
  providers: [DiagnosticService],
  exports: [DiagnosticService],
})
export class SharedModule {}
