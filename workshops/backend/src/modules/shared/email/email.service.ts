import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@database/prisma.service';
import { EmailTemplatesService } from './email-templates.service';
import * as crypto from 'crypto';
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
  requireTLS?: boolean;
  auth?: {
    user?: string;
    pass?: string;
  };
  tls?: {
    rejectUnauthorized: boolean;
    minVersion?: string;
  };
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: Transporter;
  private readonly templatesService: EmailTemplatesService;
  private readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  private readonly ALGORITHM = 'aes-256-cbc';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.templatesService = new EmailTemplatesService();
    this.transporter = this.createTransporter();
    this.initializeConnection();
  }

  private decrypt(text: string): string {
    try {
      const parts = text.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Failed to decrypt password', error);
      throw error;
    }
  }

  private async getSystemEmailConfig() {
    try {
      const systemEmailSettings = await this.prisma.systemEmailSettings.findFirst({
        where: {
          isActive: true,
          isDefault: true,
        },
      });

      if (!systemEmailSettings) {
        return null;
      }

      const decryptedPassword = this.decrypt(systemEmailSettings.password);

      return {
        host: systemEmailSettings.host,
        port: systemEmailSettings.port,
        secure: systemEmailSettings.secure,
        user: systemEmailSettings.user,
        pass: decryptedPassword,
        fromEmail: systemEmailSettings.fromEmail,
        fromName: systemEmailSettings.fromName,
      };
    } catch (error) {
      this.logger.error('Failed to get system email settings', error);
      return null;
    }
  }

  private async getEmailConfigFromDatabase(tenantId: string) {
    try {
      // Primeiro tenta buscar configuração global do sistema
      const systemConfig = await this.getSystemEmailConfig();
      if (systemConfig) {
        this.logger.log('Using system email configuration (global)');
        return systemConfig;
      }

      // Fallback para configuração do tenant (legacy)
      const emailSettings = await this.prisma.emailSettings.findFirst({
        where: {
          tenantId,
          isActive: true,
          isDefault: true,
        },
      });

      if (!emailSettings) {
        return null;
      }

      const decryptedPassword = this.decrypt(emailSettings.password);

      return {
        host: emailSettings.host,
        port: emailSettings.port,
        secure: emailSettings.secure,
        user: emailSettings.user,
        pass: decryptedPassword,
        fromEmail: emailSettings.fromEmail,
        fromName: emailSettings.fromName,
      };
    } catch (error) {
      this.logger.error('Failed to get email settings from database', error);
      return null;
    }
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

    // Se não estiver usando porta SSL direta (465), forçar STARTTLS
    if (smtpConfig.secure === false && smtpConfig.port !== 465) {
      smtpConfig.requireTLS = true;
    }

    // Configurações TLS mais permissivas
    smtpConfig.tls = {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2',
    };

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
    tenantId?: string,
  ): Promise<void> {
    try {
      let transporterToUse = this.transporter;
      let fromEmail = process.env.SMTP_USER || 'noreply@mecanica365.com';
      let fromName = 'Mecânica365';

      // Tentar buscar configuração do banco se tenantId fornecido
      if (tenantId) {
        const emailConfig = await this.getEmailConfigFromDatabase(tenantId);
        if (emailConfig) {
          const smtpConfig: SmtpConfig = {
            host: emailConfig.host,
            port: emailConfig.port,
            secure: emailConfig.secure,
            auth: {
              user: emailConfig.user,
              pass: emailConfig.pass,
            },
          };

          // Se não estiver usando porta SSL direta (465), forçar STARTTLS
          if (!emailConfig.secure && emailConfig.port !== 465) {
            smtpConfig.requireTLS = true;
          }

          // Configurações TLS mais permissivas para servidores self-hosted
          smtpConfig.tls = {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2',
          };

          transporterToUse = nodemailer.createTransport(smtpConfig as nodemailer.TransportOptions);
          fromEmail = emailConfig.fromEmail;
          fromName = emailConfig.fromName;
          
          this.logger.log(`Using database email config for tenant ${tenantId}`);
        }
      }

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        html,
        text,
        replyTo: process.env.SMTP_REPLY_TO || fromEmail,
      };

      // Em desenvolvimento, apenas logar (se SMTP não configurado)
      if (!process.env.SMTP_USER && !tenantId) {
        this.logger.log(`=== EMAIL (SMTP não configurado) ===`);
        this.logger.log(`Para: ${to}`);
        this.logger.log(`Assunto: ${subject}`);
        this.logger.log('==================================================');
        return;
      }

      const info: unknown = await transporterToUse.sendMail(mailOptions);
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

  async sendWelcomeEmail(data: WelcomeEmailData, tenantId?: string): Promise<void> {
    try {
      const html = this.templatesService.getWelcomeEmailTemplate(data);
      const text = this.templatesService.getWelcomeEmailTextVersion(data);
      await this.sendEmail(
        data.to,
        'Bem-vindo ao Mecânica365! Suas credenciais de acesso',
        html,
        text,
        tenantId,
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

  async sendAdminPasswordResetEmail(data: {
    to: string;
    name: string;
    tempPassword: string;
    loginUrl: string;
  }): Promise<void> {
    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔑 Senha Resetada</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Olá <strong>${data.name}</strong>,
            </p>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              Sua senha foi resetada pelo administrador do sistema. Use a senha temporária abaixo para fazer login:
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #FF6B6B;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
                Senha Temporária
              </p>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #FF6B6B; font-family: 'Courier New', monospace;">
                ${data.tempPassword}
              </p>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⚠️ <strong>Importante:</strong> Altere esta senha após o primeiro login por motivos de segurança.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" 
                 style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); 
                        color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                Acessar o Sistema
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
              Se você não solicitou esta alteração, entre em contato com o suporte imediatamente.
            </p>
          </div>
        </div>
      `;

      const text = `
        Senha Resetada - Mecânica365
        
        Olá ${data.name},
        
        Sua senha foi resetada pelo administrador do sistema.
        
        Senha Temporária: ${data.tempPassword}
        
        ⚠️ IMPORTANTE: Altere esta senha após o primeiro login por motivos de segurança.
        
        Acesse: ${data.loginUrl}
        
        Se você não solicitou esta alteração, entre em contato com o suporte imediatamente.
      `;

      await this.sendEmail(
        data.to,
        'Senha Resetada - Mecânica365',
        html,
        text,
      );
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send password reset email: ${err.message || String(error)}`,
        err.stack,
      );
    }
  }

  async sendBulkEmail(data: {
    recipients: string[];
    subject: string;
    html: string;
    text?: string;
  }): Promise<{ sent: number; failed: number; errors: string[] }> {
    const results = { sent: 0, failed: 0, errors: [] as string[] };

    for (const recipient of data.recipients) {
      try {
        await this.sendEmail(recipient, data.subject, data.html, data.text);
        results.sent++;
        this.logger.log(`Bulk email sent to ${recipient}`);
      } catch (error: unknown) {
        results.failed++;
        const err = error as { message?: string };
        const errorMsg = `${recipient}: ${err.message || String(error)}`;
        results.errors.push(errorMsg);
        this.logger.error(`Failed to send bulk email to ${recipient}`);
      }
    }

    return results;
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

  /**
   * Envia email de recuperação de senha
   */
  async sendPasswordResetEmail(data: {
    name: string;
    email: string;
    resetUrl: string;
    expiresInMinutes: number;
    workshopName?: string;
  }): Promise<void> {
    try {
      const html = this.templatesService.getPasswordResetEmailTemplate({
        name: data.name,
        resetUrl: data.resetUrl,
        expiresInMinutes: data.expiresInMinutes,
        workshopName: data.workshopName,
      });
      await this.sendEmail(
        data.email,
        '🔐 Recuperação de Senha - Mecânica365',
        html,
      );
      this.logger.log(
        `Email de recuperação de senha enviado para ${data.email}`,
      );
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send password reset email: ${err.message || String(error)}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Envia email de confirmação de senha alterada
   */
  async sendPasswordChangedEmail(data: {
    name: string;
    email: string;
    changedAt: Date;
    workshopName?: string;
  }): Promise<void> {
    try {
      const html = this.templatesService.getPasswordChangedEmailTemplate({
        name: data.name,
        changedAt: data.changedAt,
        workshopName: data.workshopName,
      });
      await this.sendEmail(data.email, '🔐 Senha Alterada - Mecânica365', html);
      this.logger.log(
        `Email de confirmação de alteração de senha enviado para ${data.email}`,
      );
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      this.logger.error(
        `Failed to send password changed email: ${err.message || String(error)}`,
        err.stack,
      );
    }
  }
}
