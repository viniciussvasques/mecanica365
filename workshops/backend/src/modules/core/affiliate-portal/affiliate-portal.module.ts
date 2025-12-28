import { Module } from '@nestjs/common';
import { AffiliatePortalService } from './affiliate-portal.service';
import { AffiliatePortalController } from './affiliate-portal.controller';
import { PrismaModule } from '../../../database/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AffiliatePortalController],
    providers: [AffiliatePortalService],
    exports: [AffiliatePortalService],
})
export class AffiliatePortalModule { }
