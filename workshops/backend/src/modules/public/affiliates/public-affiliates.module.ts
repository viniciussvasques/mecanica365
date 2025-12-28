import { Module } from '@nestjs/common';
import { PublicAffiliatesService } from './public-affiliates.service';
import { PublicAffiliatesController } from './public-affiliates.controller';
import { PrismaModule } from '../../../database/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PublicAffiliatesController],
    providers: [PublicAffiliatesService],
})
export class PublicAffiliatesModule { }
