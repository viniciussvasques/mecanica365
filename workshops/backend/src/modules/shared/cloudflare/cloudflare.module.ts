import { Module } from '@nestjs/common';
import { CloudflareService } from './cloudflare.service';
import { CloudflareController } from './cloudflare.controller';

@Module({
  providers: [CloudflareService],
  controllers: [CloudflareController],
  exports: [CloudflareService],
})
export class CloudflareModule {}
