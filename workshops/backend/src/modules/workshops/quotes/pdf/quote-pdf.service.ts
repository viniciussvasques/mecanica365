import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { QuoteResponseDto } from '../dto';

@Injectable()
export class QuotePdfService {
  private readonly logger = new Logger(QuotePdfService.name);

  /**
   * Gera PDF do orçamento
   */
  async generatePdf(quote: QuoteResponseDto): Promise<Buffer> {
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

        // Cabeçalho
        this.addHeader(doc, quote);

        // Informações do cliente e veículo
        this.addCustomerInfo(doc, quote);

        // Itens do orçamento
        this.addItems(doc, quote);

        // Totais
        this.addTotals(doc, quote);

        // Observações
        this.addNotes(doc, quote);

        // Assinatura (se houver)
        if (quote.customerSignature) {
          this.addSignature(doc, quote);
        }

        // Rodapé
        this.addFooter(doc, quote);

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
  ): void {
    // Logo e título (você pode adicionar logo depois)
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('ORÇAMENTO', { align: 'center' })
      .moveDown(0.5);

    doc
      .fontSize(14)
      .font('Helvetica')
      .text(`Número: ${quote.number}`, { align: 'center' })
      .moveDown(0.3);

    doc
      .fontSize(10)
      .text(`Data: ${new Date(quote.createdAt).toLocaleDateString('pt-BR')}`, {
        align: 'center',
      })
      .moveDown(1);

    // Linha separadora
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
  }

  private addCustomerInfo(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    doc.fontSize(12).font('Helvetica-Bold').text('DADOS DO CLIENTE', {
      underline: true,
    });
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

    // Informações do veículo
    if (quote.vehicle) {
      doc.fontSize(12).font('Helvetica-Bold').text('DADOS DO VEÍCULO', {
        underline: true,
      });
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

  private addItems(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    doc.fontSize(12).font('Helvetica-Bold').text('ITENS DO ORÇAMENTO', {
      underline: true,
    });
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

    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('TOTAL:', 350, doc.y);
    doc.text(`R$ ${quote.totalCost.toFixed(2)}`, rightAlign, doc.y, {
      align: 'right',
    });

    doc.moveDown(1);
  }

  private addNotes(
    doc: InstanceType<typeof PDFDocument>,
    quote: QuoteResponseDto,
  ): void {
    if (quote.diagnosticNotes || quote.inspectionNotes) {
      doc.fontSize(12).font('Helvetica-Bold').text('OBSERVAÇÕES', {
        underline: true,
      });
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

    // Validade
    if (quote.validUntil) {
      doc.fontSize(9).font('Helvetica');
      doc.text(
        `Validade: ${new Date(quote.validUntil).toLocaleDateString('pt-BR')}`,
        { align: 'center' },
      );
      doc.moveDown(1);
    }
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
  ): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;

    doc
      .fontSize(8)
      .font('Helvetica')
      .text(
        `Orçamento ${quote.number} - Gerado em ${new Date().toLocaleString('pt-BR')}`,
        50,
        footerY,
        { align: 'center' },
      );
  }
}
