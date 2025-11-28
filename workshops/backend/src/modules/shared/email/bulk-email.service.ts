import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { BulkEmailData } from './interfaces/email-data.interfaces';

interface BulkEmailResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

@Injectable()
export class BulkEmailService {
  private readonly logger = new Logger(BulkEmailService.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Envia emails em massa para múltiplos destinatários
   * Processa em lotes para evitar sobrecarga do servidor SMTP
   */
  async sendBulkEmail(data: BulkEmailData): Promise<BulkEmailResult> {
    const result: BulkEmailResult = {
      total: data.recipients.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    this.logger.log(
      `Iniciando disparo em massa para ${result.total} destinatários`,
    );

    // Processar em lotes de 10 para não sobrecarregar o SMTP
    const batchSize = 10;
    const batches = this.chunkArray(data.recipients, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      this.logger.log(
        `Processando lote ${i + 1}/${batches.length} (${batch.length} emails)`,
      );

      // Processar emails do lote em paralelo
      const promises = batch.map(async (recipient) => {
        try {
          // Substituir variáveis personalizadas no conteúdo
          let htmlContent = data.htmlContent;
          let textContent = data.textContent || '';
          const subject = this.replaceVariables(data.subject, recipient);

          // Substituir variáveis no HTML
          if (
            recipient.customData &&
            typeof recipient.customData === 'object'
          ) {
            const customData = recipient.customData;
            Object.keys(customData).forEach((key) => {
              const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
              const value = String(customData[key] || '');
              htmlContent = htmlContent.replace(regex, value);
              textContent = textContent.replace(regex, value);
            });
          }

          // Substituir variáveis padrão
          htmlContent = this.replaceVariables(htmlContent, recipient);
          textContent = this.replaceVariables(textContent, recipient);

          // Usar método público do EmailService
          await this.emailService.sendEmail(
            recipient.email,
            subject,
            htmlContent,
            textContent,
          );

          result.sent++;
          this.logger.debug(`Email enviado para: ${recipient.email}`);
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            email: recipient.email,
            error: error.message || 'Erro desconhecido',
          });
          this.logger.error(
            `Falha ao enviar email para ${recipient.email}: ${error.message}`,
          );
        }
      });

      await Promise.all(promises);

      // Aguardar um pouco entre lotes para não sobrecarregar o SMTP
      if (i < batches.length - 1) {
        await this.delay(1000); // 1 segundo entre lotes
      }
    }

    this.logger.log(
      `Disparo em massa concluído: ${result.sent} enviados, ${result.failed} falhas de ${result.total} total`,
    );

    return result;
  }

  /**
   * Substitui variáveis no template
   */
  private replaceVariables(
    template: string,
    recipient: {
      email: string;
      name?: string;
      customData?: Record<string, any>;
    },
  ): string {
    let result = template;

    // Variáveis padrão
    result = result.replace(/\{\{email\}\}/g, recipient.email);
    result = result.replace(/\{\{name\}\}/g, recipient.name || 'Cliente');

    // Variáveis customizadas
    if (recipient.customData && typeof recipient.customData === 'object') {
      const customData = recipient.customData;
      Object.keys(customData).forEach((key) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        const value = String(customData[key] || '');
        result = result.replace(regex, value);
      });
    }

    return result;
  }

  /**
   * Divide array em chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
