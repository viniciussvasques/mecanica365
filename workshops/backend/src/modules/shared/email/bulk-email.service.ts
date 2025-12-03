import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from './email.service';
import { getErrorMessage } from '../../../common/utils/error.utils';
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

    const totalRecipients = String(result.total);
    this.logger.log(
      `Iniciando disparo em massa para ${totalRecipients} destinatários`,
    );

    // Processar em lotes de 10 para não sobrecarregar o SMTP
    const batchSize = 10;
    const batches = this.chunkArray(data.recipients, batchSize);

    const batchesLength: number = batches.length;
    for (let i = 0; i < batchesLength; i++) {
      const batch = batches[i];
      const batchIndex = i + 1;
      const batchLength = batch.length;
      this.logger.log(
        `Processando lote ${String(batchIndex)}/${String(batchesLength)} (${String(batchLength)} emails)`,
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
            for (const key of Object.keys(customData)) {
              const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
              const rawValue = customData[key];
              let value = '';
              if (rawValue != null) {
                if (
                  typeof rawValue === 'string' ||
                  typeof rawValue === 'number' ||
                  typeof rawValue === 'boolean'
                ) {
                  value = String(rawValue);
                } else {
                  value = JSON.stringify(rawValue);
                }
              }
              htmlContent = htmlContent.replaceAll(regex, value);
              textContent = textContent.replaceAll(regex, value);
            }
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
        } catch (error: unknown) {
          result.failed++;
          const errorMessage = getErrorMessage(error);
          result.errors.push({
            email: recipient.email,
            error: errorMessage,
          });
          this.logger.error(
            `Falha ao enviar email para ${recipient.email}: ${errorMessage}`,
          );
        }
      });

      await Promise.all(promises);

      // Aguardar um pouco entre lotes para não sobrecarregar o SMTP
      const lastBatchIndex: number = batchesLength > 0 ? batchesLength - 1 : 0;
      const isLastBatch: boolean = i >= lastBatchIndex;
      if (!isLastBatch) {
        await this.delay(1000); // 1 segundo entre lotes
      }
    }

    this.logger.log(
      `Disparo em massa concluído: ${String(result.sent)} enviados, ${String(result.failed)} falhas de ${String(result.total)} total`,
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
      customData?: Record<string, unknown>;
    },
  ): string {
    let result = template;

    // Variáveis padrão
    result = result.replaceAll('{{email}}', recipient.email);
    result = result.replaceAll('{{name}}', recipient.name || 'Cliente');

    // Variáveis customizadas
    if (recipient.customData && typeof recipient.customData === 'object') {
      const customData = recipient.customData;
      for (const key of Object.keys(customData)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        const rawValue = customData[key];
        let value = '';
        if (rawValue != null) {
          if (
            typeof rawValue === 'string' ||
            typeof rawValue === 'number' ||
            typeof rawValue === 'boolean'
          ) {
            value = String(rawValue);
          } else {
            value = JSON.stringify(rawValue);
          }
        }
        result = result.replaceAll(regex, value);
      }
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
