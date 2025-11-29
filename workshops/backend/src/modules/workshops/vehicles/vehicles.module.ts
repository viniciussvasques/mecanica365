import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { VehicleQueryService } from './vehicle-query.service';
import { PrismaModule } from '@database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehicleQueryService],
  exports: [VehiclesService, VehicleQueryService],
})
export class VehiclesModule {}
