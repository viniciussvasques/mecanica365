import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EmailService } from '../../shared/email/email.service';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';

@Injectable()
export class AdminCommunicationsService {
  private readonly logger = new Logger(AdminCommunicationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async sendBulkEmail(dto: SendBulkEmailDto) {
    this.logger.log('Iniciando envio de e-mail em massa');

    // Buscar tenants baseado nos filtros
    const where: any = {};

    if (dto.filters?.status) {
      where.status = { in: dto.filters.status };
    }

    if (dto.filters?.plan) {
      where.plan = { in: dto.filters.plan };
    }

    if (dto.filters?.tenantIds) {
      where.id = { in: dto.filters.tenantIds };
    }

    const tenants = await this.prisma.tenant.findMany({
      where,
      select: {
        id: true,
        name: true,
        adminEmail: true,
        users: {
          where: { role: 'admin', isActive: true },
          select: { email: true, name: true },
          take: 1,
        },
      },
    });

    this.logger.log(`Encontrados ${tenants.length} tenants para envio`);

    // Coletar e-mails únicos
    const emailSet = new Set<string>();
    
    tenants.forEach(tenant => {
      if (tenant.adminEmail) {
        emailSet.add(tenant.adminEmail);
      }
      if (tenant.users[0]?.email) {
        emailSet.add(tenant.users[0].email);
      }
    });

    const recipients = Array.from(emailSet);
    this.logger.log(`Total de ${recipients.length} destinatários únicos`);

    if (recipients.length === 0) {
      return {
        success: false,
        message: 'Nenhum destinatário encontrado com os filtros aplicados',
        sent: 0,
        failed: 0,
      };
    }

    // Enviar e-mails em massa
    const results = await this.emailService.sendBulkEmail({
      recipients,
      subject: dto.subject,
      html: this.buildEmailHtml(dto),
      text: dto.message,
    });

    // Registrar no audit log
    await this.prisma.auditLog.create({
      data: {
        userId: 'system',
        action: 'bulk_email_sent',
        resourceId: 'communications',
        metadata: {
          subject: dto.subject,
          filters: dto.filters,
          recipients: recipients.length,
          sent: results.sent,
          failed: results.failed,
        },
      },
    });

    this.logger.log(
      `Envio concluído: ${results.sent} enviados, ${results.failed} falharam`,
    );

    return {
      success: true,
      message: `E-mails enviados com sucesso`,
      sent: results.sent,
      failed: results.failed,
      errors: results.errors,
      totalRecipients: recipients.length,
    };
  }

  private buildEmailHtml(dto: SendBulkEmailDto): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">📢 ${dto.subject}</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
            ${dto.message.replace(/\n/g, '<br>')}
          </div>
          
          ${dto.ctaText && dto.ctaUrl ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dto.ctaUrl}" 
                 style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); 
                        color: white; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px;">
                ${dto.ctaText}
              </a>
            </div>
          ` : ''}
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center; margin: 0;">
            Este é um comunicado oficial do Mecânica365
          </p>
        </div>
      </div>
    `;
  }
}
