import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EmailTemplatesService } from './email-templates.service';
import {
  WelcomeEmailData,
  PaymentFailedEmailData,
  SubscriptionCancelledEmailData,
  SubscriptionUpdatedEmailData,
  InvoicePaymentSucceededEmailData,
  InvoiceUpcomingEmailData,
  TrialEndingEmailData,
  AccountSuspendedEmailData,
} from './interfaces/email-data.interfaces';

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: {
    user?: string;
    pass?: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
  };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly templatesService: EmailTemplatesService;

  constructor(private readonly configService: ConfigService) {
    this.templatesService = new EmailTemplatesService();
    this.transporter = this.createTransporter();
    this.initializeConnection();
  }

  private createTransporter(): Transporter {
    const smtpConfig: SmtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number.parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    };

    if (process.env.SMTP_HOST?.includes('mail.')) {
      smtpConfig.tls = {
        rejectUnauthorized: false,
      };
    }

    return nodemailer.createTransport(
      smtpConfig as nodemailer.TransportOptions,
    );
  }

  private initializeConnection(): void {
    if (process.env.NODE_ENV === 'development') {
      // Verificar conexão de forma assíncrona sem bloquear o construtor
      setImmediate(() => {
        void this.verifyConnection();
      });
    }
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('✅ SMTP connection verified successfully');
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      this.logger.warn('❌ SMTP connection failed. Emails will not be sent.');
      this.logger.warn(`Error: ${err.message || String(error)}`);
      if (err.code) {
        this.logger.warn(`Error code: ${err.code}`);
      }
      this.logger.warn(
        `Host: ${process.env.SMTP_HOST}, Port: ${process.env.SMTP_PORT}`,
      );
      this.logger.warn(
        'Configure SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env',
      );
    }
  }

  /**
   * Método genérico para enviar emails
   * Público para permitir uso pelo BulkEmailService
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    try {
      const mailOptions = {
        from: `"Mecânica365" <${process.env.SMTP_USER || 'noreply@mecanica365.com'}>`,
        to,
        subject,
        html,
        text,
        replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_USER,
      };

      // Em desenvolvimento, apenas logar (se SMTP não configurado)
      if (!process.env.SMTP_USER) {
        this.logger.log(`=== EMAIL (SMTP não configurado) ===`);
        this.logger.log(`Para: ${to}`);
        this.logger.log(`Assunto: ${subject}`);
        this.logger.log('==================================================');
        return;
      }

      const info: unknown = await this.transporter.sendMail(mailOptions);
      // Verificação segura do messageId
      let messageId = 'unknown';
      if (info && typeof info === 'object') {
        const infoObj = info as Record<string, unknown>;
        if ('messageId' in infoObj && typeof infoObj.messageId === 'string') {
          messageId = infoObj.messageId;
        }
      }
      this.logger.log(`Email sent to ${to}: ${messageId}`);
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send email to ${to}: ${err.message || String(error)}`,
        err.stack,
      );
      throw error;
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    try {
      const html = this.templatesService.getWelcomeEmailTemplate(data);
      const text = this.templatesService.getWelcomeEmailTextVersion(data);
      await this.sendEmail(
        data.to,
        'Bem-vindo ao Mecânica365! Suas credenciais de acesso',
        html,
        text,
      );
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send welcome email: ${err.message || String(error)}`,
        err.stack,
      );
      // Não lançar erro para não quebrar o fluxo de onboarding
    }
  }

  async sendPaymentFailedEmail(data: PaymentFailedEmailData): Promise<void> {
    try {
      const html = this.templatesService.getPaymentFailedEmailTemplate(data);
      const text = this.templatesService.getPaymentFailedEmailTextVersion(data);
      await this.sendEmail(
        data.to,
        'Pagamento Não Processado - Ação Necessária',
        html,
        text,
      );
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send payment failed email: ${err.message || String(error)}`,
        err.stack,
      );
    }
  }

  async sendSubscriptionCancelledEmail(
    data: SubscriptionCancelledEmailData,
  ): Promise<void> {
    try {
      const html =
        this.templatesService.getSubscriptionCancelledEmailTemplate(data);
      await this.sendEmail(data.to, 'Assinatura Cancelada', html);
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send subscription cancelled email: ${err.message || String(error)}`,
        err.stack,
      );
    }
  }

  async sendSubscriptionUpdatedEmail(
    data: SubscriptionUpdatedEmailData,
  ): Promise<void> {
    try {
      const html =
        this.templatesService.getSubscriptionUpdatedEmailTemplate(data);
      await this.sendEmail(data.to, 'Assinatura Atualizada', html);
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send subscription updated email: ${err.message || String(error)}`,
        err.stack,
      );
    }
  }

  async sendInvoicePaymentSucceededEmail(
    data: InvoicePaymentSucceededEmailData,
  ): Promise<void> {
    try {
      const html =
        this.templatesService.getInvoicePaymentSucceededEmailTemplate(data);
      await this.sendEmail(data.to, 'Pagamento Confirmado', html);
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send invoice payment succeeded email: ${err.message || String(error)}`,
        err.stack,
      );
    }
  }

  async sendInvoiceUpcomingEmail(
    data: InvoiceUpcomingEmailData,
  ): Promise<void> {
    try {
      const html = this.templatesService.getInvoiceUpcomingEmailTemplate(data);
      await this.sendEmail(data.to, 'Próxima Cobrança Programada', html);
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send invoice upcoming email: ${err.message || String(error)}`,
        err.stack,
      );
    }
  }

  async sendTrialEndingEmail(data: TrialEndingEmailData): Promise<void> {
    try {
      const html = this.templatesService.getTrialEndingEmailTemplate(data);
      await this.sendEmail(
        data.to,
        'Seu Período de Teste Está Terminando',
        html,
      );
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send trial ending email: ${err.message || String(error)}`,
        err.stack,
      );
    }
  }

  async sendAccountSuspendedEmail(
    data: AccountSuspendedEmailData,
  ): Promise<void> {
    try {
      const html = this.templatesService.getAccountSuspendedEmailTemplate(data);
      await this.sendEmail(data.to, 'Conta Suspensa - Ação Necessária', html);
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send account suspended email: ${err.message || String(error)}`,
        err.stack,
      );
    }
  }
}
