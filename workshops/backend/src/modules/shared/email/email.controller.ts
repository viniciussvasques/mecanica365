import { Controller, Post, Body, Get } from '@nestjs/common';
import { EmailService } from './email.service';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Public()
  @Post('test')
  async sendTestEmail(@Body() body: { to: string }) {
    try {
      await this.emailService.sendWelcomeEmail({
        to: body.to,
        name: 'Teste de Email',
        subdomain: 'teste',
        email: 'teste@mecanica365.com',
        password: 'TestPassword123',
        loginUrl: 'http://localhost:3000/login?subdomain=teste',
      });

      return {
        success: true,
        message: `Email de teste enviado para ${body.to}`,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Erro ao enviar email: ${error.message}`,
      };
    }
  }

  @Public()
  @Get('status')
  async getStatus() {
    return {
      smtpConfigured: !!process.env.SMTP_USER,
      smtpHost: process.env.SMTP_HOST,
      smtpPort: process.env.SMTP_PORT,
      smtpUser: process.env.SMTP_USER,
    };
  }
}

