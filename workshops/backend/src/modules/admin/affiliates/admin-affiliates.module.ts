import { Module } from '@nestjs/common';
import { AdminAffiliatesService } from './admin-affiliates.service';
import { AdminAffiliatesController } from './admin-affiliates.controller';
import { PrismaModule } from '../../../database/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminAffiliatesController],
    providers: [AdminAffiliatesService],
    exports: [AdminAffiliatesService],
})
export class AdminAffiliatesModule { }
