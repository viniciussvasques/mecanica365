import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailTemplatesService } from './email-templates.service';
import { BulkEmailService } from './bulk-email.service';
import { EmailController } from './email.controller';
import { AdminEmailController } from './admin-email.controller';

@Module({
  controllers: [EmailController, AdminEmailController],
  providers: [EmailService, EmailTemplatesService, BulkEmailService],
  exports: [EmailService, EmailTemplatesService, BulkEmailService],
})
export class EmailModule {}
