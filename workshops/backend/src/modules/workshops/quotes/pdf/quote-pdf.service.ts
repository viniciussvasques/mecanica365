import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { QuoteResponseDto } from '../dto';
import { WorkshopSettings } from '@prisma/client';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class QuotePdfService {
  private readonly logger = new Logger(QuotePdfService.name);

  /**
   * Gera PDF do orçamento
   */
  async generatePdf(
    quote: QuoteResponseDto,
    workshopSettings?: WorkshopSettings | null,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        doc.on('data', (chunk: unknown) => {
          const bufferChunk = Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk as ArrayLike<number>);
          chunks.push(bufferChunk);
        });
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (error) =>
          reject(error instanceof Error ? error : new Error(String(error))),
        );

        // Cores personalizadas da oficina ou padrão
        const primaryColor = workshopSettings?.primaryColor || '#00E0B8';

        // Cabeçalho com logo e informações da oficina
        this.addHeader(doc, quote, workshopSettings, primaryColor);

        // Informações do cliente e veículo
        this.addCustomerInfo(doc, quote);

        // Problema relatado pelo cliente
        if (
          quote.reportedProblemDescription ||
          quote.reportedProblemCategory ||
          quote.reportedProblemSymptoms?.length > 0
        ) {
          this.addReportedProblem(doc, quote);
        }

        // Problema identificado pelo mecânico
        if (
          quote.identifiedProblemDescription ||
          quote.identifiedProblemCategory
        ) {
          this.addIdentifiedProblem(doc, quote);
        }

        // Itens do orçamento
        this.addItems(doc, quote);

        // Totais
        this.addTotals(doc, quote, primaryColor);

        // Recomendações
        if (quote.recommendations) {
          this.addRecommendations(doc, quote);
        }

        // Observações e diagnóstico
        if (quote.diagnosticNotes || quote.inspectionNotes) {
          this.addNotes(doc, quote);
        }

        // Mecânico atribuído
        if (quote.assignedMechanic) {
          this.addMechanicInfo(doc, quote);
        }

        // Validade
        if (quote.validUntil) {
          this.addValidity(doc, quote);
        }

        // Assinatura (se houver)
        if (quote.customerSignature) {
          this.addSignature(doc, quote);
        }

        // Rodapé com informações da oficina
        this.addFooter(doc, quote, workshopSettings);

        doc.end();
      } catch (error) {
        this.logger.error(`Erro ao gerar PDF: ${error}`);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  private addHeader(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
    workshopSettings: WorkshopSettings | null | undefined,
    primaryColor: string,
  ): void {
    const headerY = 50;
    let currentY = headerY;

    // Logo da oficina (se configurado)
    if (
      workshopSettings?.logoUrl &&
      workshopSettings?.showLogoOnQuotes !== false
    ) {
      try {
        const logoPath = this.getLogoPath(workshopSettings.logoUrl);
        if (logoPath && fs.existsSync(logoPath)) {
          doc.image(logoPath, 50, currentY, {
            width: 80,
            height: 80,
            fit: [80, 80],
          });
          currentY += 90;
        }
      } catch (error) {
        this.logger.warn(`Erro ao carregar logo: ${error}`);
      }
    }

    // Nome da oficina
    const workshopName = workshopSettings?.displayName || 'Oficina Mecânica';
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text(workshopName, 50, headerY, { align: 'center', width: 500 });

    // Título ORÇAMENTO
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('ORÇAMENTO', 50, headerY + 25, { align: 'center', width: 500 });

    // Número do orçamento com destaque
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text(`Nº ${quote.number}`, 50, headerY + 55, {
        align: 'center',
        width: 500,
      });

    // Data
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        `Data: ${new Date(quote.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}`,
        50,
        headerY + 80,
        { align: 'center', width: 500 },
      );

    // Status do orçamento
    const statusText = this.getStatusText(quote.status);
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor(this.getStatusColor(quote.status))
      .text(`Status: ${statusText}`, 50, headerY + 95, {
        align: 'center',
        width: 500,
      });

    // Linha separadora colorida
    doc
      .moveTo(50, headerY + 115)
      .lineTo(550, headerY + 115)
      .lineWidth(2)
      .strokeColor(primaryColor)
      .stroke();

    doc.y = headerY + 130;
  }

  private addCustomerInfo(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    const sectionY = doc.y;

    // DADOS DO CLIENTE
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text('DADOS DO CLIENTE', 50, sectionY);

    doc.moveDown(0.5);

    if (quote.customer) {
      doc.fontSize(10).font('Helvetica');
      doc.text(`Nome: ${quote.customer.name}`);
      if (quote.customer.phone) {
        doc.text(`Telefone: ${quote.customer.phone}`);
      }
      if (quote.customer.email) {
        doc.text(`Email: ${quote.customer.email}`);
      }
    } else {
      doc.fontSize(10).font('Helvetica').text('Cliente não informado');
    }

    doc.moveDown(1);

    // DADOS DO VEÍCULO
    if (quote.vehicle) {
      doc.fontSize(12).font('Helvetica-Bold').text('DADOS DO VEÍCULO');
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica');
      if (quote.vehicle.placa) {
        doc.text(`Placa: ${quote.vehicle.placa}`);
      }
      if (quote.vehicle.make || quote.vehicle.model) {
        const makeModel = [
          quote.vehicle.make,
          quote.vehicle.model,
          quote.vehicle.year?.toString(),
        ]
          .filter(Boolean)
          .join(' ');
        doc.text(`Veículo: ${makeModel}`);
      }
    }

    // Elevador (se houver)
    if (quote.elevator) {
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      doc.text(`Elevador: ${quote.elevator.name} (${quote.elevator.number})`);
    }

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  private addReportedProblem(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('PROBLEMA RELATADO PELO CLIENTE');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    if (quote.reportedProblemCategory) {
      doc.text(`Categoria: ${quote.reportedProblemCategory}`);
    }

    if (quote.reportedProblemDescription) {
      doc.text('Descrição:', { continued: false });
      doc.text(quote.reportedProblemDescription, { indent: 20 });
      doc.moveDown(0.3);
    }

    if (
      quote.reportedProblemSymptoms &&
      quote.reportedProblemSymptoms.length > 0
    ) {
      doc.text('Sintomas:', { continued: false });
      quote.reportedProblemSymptoms.forEach((symptom) => {
        doc.text(`• ${symptom}`, { indent: 20 });
      });
    }

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  private addIdentifiedProblem(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    doc.fontSize(12).font('Helvetica-Bold').text('PROBLEMA IDENTIFICADO');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    if (quote.identifiedProblemCategory) {
      doc.text(`Categoria: ${quote.identifiedProblemCategory}`);
    }

    if (quote.identifiedProblemDescription) {
      doc.text('Descrição:', { continued: false });
      doc.text(quote.identifiedProblemDescription, { indent: 20 });
    }

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  private addItems(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    doc.fontSize(12).font('Helvetica-Bold').text('ITENS DO ORÇAMENTO');
    doc.moveDown(0.5);

    // Cabeçalho da tabela
    const startY = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Descrição', 50, startY);
    doc.text('Qtd', 350, startY);
    doc.text('Unit.', 400, startY);
    doc.text('Total', 480, startY, { align: 'right' });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    // Itens
    quote.items.forEach((item) => {
      const itemY = doc.y;

      // Verificar se precisa de nova página
      if (doc.y > 700) {
        doc.addPage();
        doc.y = 50;
      }

      doc.fontSize(9).font('Helvetica');
      doc.text(item.name, 50, itemY, { width: 280 });
      if (item.description) {
        doc.fontSize(8).text(item.description, 55, doc.y, { width: 275 });
      }

      doc.fontSize(9).text(item.quantity.toString(), 350, itemY);
      doc.text(`R$ ${item.unitCost.toFixed(2)}`, 400, itemY);
      doc.text(`R$ ${item.totalCost.toFixed(2)}`, 480, itemY, {
        align: 'right',
      });

      if (item.hours) {
        doc.fontSize(8).text(`(${item.hours}h)`, 55, doc.y, { width: 275 });
      }

      doc.moveDown(0.5);
    });

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  private addTotals(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
    primaryColor: string,
  ): void {
    const totalsY = doc.y;
    const rightAlign = 480;

    doc.fontSize(10).font('Helvetica');

    if (quote.laborCost && quote.laborCost > 0) {
      doc.text('Mão de Obra:', 350, totalsY);
      doc.text(`R$ ${quote.laborCost.toFixed(2)}`, rightAlign, totalsY, {
        align: 'right',
      });
      doc.moveDown(0.3);
    }

    if (quote.partsCost && quote.partsCost > 0) {
      doc.text('Peças:', 350, doc.y);
      doc.text(`R$ ${quote.partsCost.toFixed(2)}`, rightAlign, doc.y, {
        align: 'right',
      });
      doc.moveDown(0.3);
    }

    const subtotal =
      quote.items.reduce((sum, item) => sum + item.totalCost, 0) +
      (quote.laborCost || 0) +
      (quote.partsCost || 0);

    doc.text('Subtotal:', 350, doc.y);
    doc.text(`R$ ${subtotal.toFixed(2)}`, rightAlign, doc.y, {
      align: 'right',
    });
    doc.moveDown(0.3);

    if (quote.discount && quote.discount > 0) {
      doc.text('Desconto:', 350, doc.y);
      doc.text(`- R$ ${quote.discount.toFixed(2)}`, rightAlign, doc.y, {
        align: 'right',
      });
      doc.moveDown(0.3);
    }

    if (quote.taxAmount && quote.taxAmount > 0) {
      doc.text('Impostos:', 350, doc.y);
      doc.text(`R$ ${quote.taxAmount.toFixed(2)}`, rightAlign, doc.y, {
        align: 'right',
      });
      doc.moveDown(0.3);
    }

    doc.moveDown(0.3);
    doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    // TOTAL em destaque
    doc.fontSize(16).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('TOTAL:', 350, doc.y);
    doc.text(`R$ ${quote.totalCost.toFixed(2)}`, rightAlign, doc.y, {
      align: 'right',
    });
    doc.fillColor('#000000'); // Resetar cor

    doc.moveDown(1);
  }

  private addRecommendations(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    doc.fontSize(12).font('Helvetica-Bold').text('RECOMENDAÇÕES');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');
    if (quote.recommendations) {
      doc.text(quote.recommendations, { indent: 20 });
    }

    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  private addNotes(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    doc.fontSize(12).font('Helvetica-Bold').text('OBSERVAÇÕES E DIAGNÓSTICO');
    doc.moveDown(0.5);

    doc.fontSize(10).font('Helvetica');

    if (quote.diagnosticNotes) {
      doc.text('Diagnóstico:', { continued: false });
      doc.text(quote.diagnosticNotes, { indent: 20 });
      doc.moveDown(0.5);
    }

    if (quote.inspectionNotes) {
      doc.text('Inspeção:', { continued: false });
      doc.text(quote.inspectionNotes, { indent: 20 });
      doc.moveDown(0.5);
    }

    doc.moveDown(1);
  }

  private addMechanicInfo(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    if (!quote.assignedMechanic) return;

    doc.fontSize(10).font('Helvetica');
    doc.text(`Mecânico Responsável: ${quote.assignedMechanic.name}`, {
      align: 'right',
    });

    if (quote.assignedAt) {
      doc.text(
        `Atribuído em: ${new Date(quote.assignedAt).toLocaleDateString('pt-BR')}`,
        { align: 'right' },
      );
    }

    doc.moveDown(1);
  }

  private addValidity(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    if (!quote.validUntil) return;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(
      `Validade: ${new Date(quote.validUntil).toLocaleDateString('pt-BR')}`,
      { align: 'center', width: 500 },
    );
    doc.moveDown(1);
  }

  private addSignature(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    if (!quote.customerSignature) return;

    doc.moveDown(2);

    // Linha para assinatura
    doc.moveTo(50, doc.y).lineTo(300, doc.y).stroke();
    doc.moveDown(0.3);

    doc.fontSize(9).font('Helvetica').text('Assinatura do Cliente', 50, doc.y);

    // Se houver imagem de assinatura, adicionar aqui
    // Por enquanto, apenas a linha

    doc.moveDown(1);
  }

  private addFooter(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
    workshopSettings: WorkshopSettings | null | undefined,
  ): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;

    this.drawFooterSeparator(doc, footerY);

    if (workshopSettings?.showContactOnQuotes !== false) {
      this.addContactInfo(doc, footerY, workshopSettings);
      this.addAddressInfo(doc, footerY, workshopSettings);
    }

    this.addCustomFooterText(doc, footerY, workshopSettings);
    this.addGenerationInfo(doc, footerY, quote);
  }

  private drawFooterSeparator(
    doc: InstanceType<typeof PDFDocument>,
    footerY: number,
  ): void {
    doc.moveTo(50, footerY - 20).lineTo(550, footerY - 20).stroke();
  }

  private addContactInfo(
    doc: InstanceType<typeof PDFDocument>,
    footerY: number,
    workshopSettings: WorkshopSettings | null | undefined,
  ): void {
    const footerText = this.buildContactText(workshopSettings);
    if (footerText) {
      doc.fontSize(8).font('Helvetica');
      doc.text(footerText, 50, footerY - 10, { align: 'center' });
    }
  }

  private buildContactText(
    workshopSettings: WorkshopSettings | null | undefined,
  ): string {
    const parts: string[] = [];

    if (workshopSettings?.phone) {
      parts.push(`Tel: ${workshopSettings.phone}`);
    }
    if (workshopSettings?.email) {
      parts.push(`Email: ${workshopSettings.email}`);
    }
    if (workshopSettings?.whatsapp) {
      parts.push(`WhatsApp: ${workshopSettings.whatsapp}`);
    }

    return parts.join(' | ');
  }

  private addAddressInfo(
    doc: InstanceType<typeof PDFDocument>,
    footerY: number,
    workshopSettings: WorkshopSettings | null | undefined,
  ): void {
    if (
      workshopSettings?.showAddressOnQuotes === false ||
      !workshopSettings?.address
    ) {
      return;
    }

    const addressParts = [
      workshopSettings.address,
      workshopSettings.city,
      workshopSettings.state,
      workshopSettings.zipCode,
    ]
      .filter(Boolean)
      .join(' - ');

    doc.text(addressParts, 50, footerY, { align: 'center' });
  }

  private addCustomFooterText(
    doc: InstanceType<typeof PDFDocument>,
    footerY: number,
    workshopSettings: WorkshopSettings | null | undefined,
  ): void {
    if (workshopSettings?.quoteFooterText) {
      doc.text(workshopSettings.quoteFooterText, 50, footerY + 10, {
        align: 'center',
      });
    }
  }

  private addGenerationInfo(
    doc: InstanceType<typeof PDFDocument>,
    footerY: number,
    quote: QuoteResponseDto,
  ): void {
    doc.fontSize(7).font('Helvetica').fillColor('#999999');
    doc.text(
      `Orçamento ${quote.number} - Gerado em ${new Date().toLocaleString('pt-BR')}`,
      50,
      footerY + 20,
      { align: 'center' },
    );
  }

  private getLogoPath(logoUrl: string): string | null {
    if (!logoUrl) return null;

    // Se for URL relativa (uploads)
    if (logoUrl.startsWith('/uploads/')) {
      const logoPath = path.join(process.cwd(), logoUrl);
      return logoPath;
    }

    // Se for URL absoluta externa, não podemos carregar diretamente
    // Retornar null para não quebrar o PDF
    return null;
  }

  private getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      draft: 'Rascunho',
      awaiting_diagnosis: 'Aguardando Diagnóstico',
      diagnosed: 'Diagnosticado',
      sent: 'Enviado',
      viewed: 'Visualizado',
      accepted: 'Aprovado',
      rejected: 'Rejeitado',
      expired: 'Expirado',
      converted: 'Convertido',
    };
    return statusMap[status] || status;
  }

  private getStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
      draft: '#999999',
      awaiting_diagnosis: '#FFA500',
      diagnosed: '#3ABFF8',
      sent: '#3ABFF8',
      viewed: '#3ABFF8',
      accepted: '#00E0B8',
      rejected: '#FF4E3D',
      expired: '#999999',
      converted: '#00E0B8',
    };
    return colorMap[status] || '#000000';
  }
}
