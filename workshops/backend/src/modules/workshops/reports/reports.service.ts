import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';
import {
  GenerateReportDto,
  ReportResponseDto,
  ReportType,
  ReportFormat,
} from './dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { join } from 'node:path';
import { existsSync, promises as fs } from 'node:fs';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly reportsDir: string;

  constructor(private readonly prisma: PrismaService) {
    // Diretório para salvar relatórios: uploads/reports/{tenantId}
    this.reportsDir = join(process.cwd(), 'uploads', 'reports');
  }

  /**
   * Gera dados do relatório baseado no tipo
   */
  private async generateReportDataByType(
    type: ReportType,
    tenantId: string,
    startDate?: string,
    endDate?: string,
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    switch (type) {
      case ReportType.SALES:
        return this.generateSalesReport(tenantId, startDate, endDate, filters);
      case ReportType.SERVICES:
        return this.generateServicesReport(
          tenantId,
          startDate,
          endDate,
          filters,
        );
      case ReportType.FINANCIAL:
        return this.generateFinancialReport(
          tenantId,
          startDate,
          endDate,
          filters,
        );
      case ReportType.INVENTORY:
        return this.generateInventoryReport(tenantId, filters);
      case ReportType.CUSTOMERS:
        return this.generateCustomersReport(
          tenantId,
          startDate,
          endDate,
          filters,
        );
      case ReportType.MECHANICS:
        return this.generateMechanicsReport(
          tenantId,
          startDate,
          endDate,
          filters,
        );
      case ReportType.QUOTES:
        return this.generateQuotesReport(tenantId, startDate, endDate, filters);
      case ReportType.INVOICES:
        return this.generateInvoicesReport(
          tenantId,
          startDate,
          endDate,
          filters,
        );
      case ReportType.PAYMENTS:
        return this.generatePaymentsReport(
          tenantId,
          startDate,
          endDate,
          filters,
        );
      default:
        throw new BadRequestException(
          `Tipo de relatório inválido: ${String(type)}`,
        );
    }
  }

  /**
   * Gera um relatório
   */
  async generate(
    tenantId: string,
    generateReportDto: GenerateReportDto,
    userId?: string,
  ): Promise<ReportResponseDto> {
    try {
      const {
        type,
        format = ReportFormat.PDF,
        startDate,
        endDate,
        filters,
      } = generateReportDto;

      // Validar datas
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        throw new BadRequestException(
          'Data inicial não pode ser maior que data final',
        );
      }

      // Gerar relatório baseado no tipo
      const reportData = await this.generateReportDataByType(
        type,
        tenantId,
        startDate,
        endDate,
        filters,
      );
      // Calcular resumo
      const summary = this.calculateSummary(reportData, type);

      // Buscar informações da oficina para o PDF
      const workshopSettings = await this.prisma.workshopSettings.findUnique({
        where: { tenantId },
      });

      // Gerar arquivo baseado no formato
      const filename = this.generateFilename(type, format);
      let filePath: string | null = null;
      let fileSize: number | null = null;
      let fileBuffer: Buffer | null = null;

      // Criar diretório do tenant se não existir
      const tenantDir = join(this.reportsDir, tenantId);
      if (!existsSync(tenantDir)) {
        await fs.mkdir(tenantDir, { recursive: true });
      }

      // Gerar arquivo
      if (format === ReportFormat.PDF) {
        fileBuffer = await this.generatePdfFile(
          reportData,
          type,
          summary,
          startDate,
          endDate,
          workshopSettings,
        );
      } else if (format === ReportFormat.EXCEL || format === ReportFormat.CSV) {
        fileBuffer = await this.generateExcelFile(
          reportData,
          type,
          summary,
          format === ReportFormat.CSV,
        );
      } else {
        // JSON - salvar como arquivo também
        fileBuffer = Buffer.from(JSON.stringify(reportData, null, 2), 'utf-8');
      }

      // Salvar arquivo
      if (fileBuffer) {
        filePath = join(tenantDir, filename);
        await fs.writeFile(filePath, fileBuffer);
        fileSize = fileBuffer.length;
      }

      // Salvar no banco de dados

      const report = await (
        this.prisma as unknown as {
          report: {
            create: (args: {
              data: {
                tenantId: string;
                type: string;
                format: string;
                filename: string;
                filePath: string | null;
                fileSize: number | null;
                startDate: Date | null;
                endDate: Date | null;
                filters?: Prisma.InputJsonValue;
                summary?: Prisma.InputJsonValue;
                generatedBy: string | null;
                status: string;
                expiresAt: Date;
              };
            }) => Promise<{ id: string; createdAt: Date }>;
          };
        }
      ).report.create({
        data: {
          tenantId,
          type,
          format,
          filename,
          filePath: filePath ? filePath.replace(process.cwd(), '') : null,
          fileSize,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          filters: filters ? (filters as Prisma.InputJsonValue) : undefined,
          summary: summary ? (summary as Prisma.InputJsonValue) : undefined,
          generatedBy: userId || null,
          status: 'completed',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        },
      });

      const downloadUrl = `/api/reports/${report.id}/download`;

      this.logger.log(
        `Relatório gerado: ${report.id} (${type}, formato: ${format}, tamanho: ${fileSize} bytes)`,
      );

      return {
        id: report.id,
        type,
        format,
        downloadUrl,
        filename,
        fileSize: fileSize || undefined,
        generatedAt: report.createdAt,
        summary,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao gerar relatório: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erro ao gerar relatório');
    }
  }

  /**
   * Gera relatório de vendas
   */
  private async generateSalesReport(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const serviceOrderWhere: Prisma.ServiceOrderWhereInput = {
      tenantId,
    };

    const invoiceWhere: Prisma.InvoiceWhereInput = {
      tenantId,
    };

    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      serviceOrderWhere.createdAt = dateFilter;
      invoiceWhere.createdAt = dateFilter;
    }

    const [serviceOrders, invoices] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where: {
          ...serviceOrderWhere,
          status: 'completed',
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      this.prisma.invoice.findMany({
        where: {
          ...invoiceWhere,
          status: 'issued',
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    const totalServiceOrders = serviceOrders.length;
    const totalInvoices = invoices.length;
    const totalRevenue =
      serviceOrders.reduce((sum, so) => sum + Number(so.totalCost || 0), 0) +
      invoices.reduce((sum, inv) => sum + Number(inv.total), 0);

    return {
      totalServiceOrders,
      totalInvoices,
      totalRevenue,
      serviceOrders,
      invoices,
    };
  }

  /**
   * Gera relatório de serviços
   */
  private async generateServicesReport(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: Prisma.ServiceOrderWhereInput = {
      tenantId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const byStatus = serviceOrders.reduce(
      (acc, so) => {
        acc[so.status] = (acc[so.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total: serviceOrders.length,
      byStatus,
      serviceOrders,
    };
  }

  /**
   * Gera relatório financeiro
   */
  private async generateFinancialReport(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const invoiceWhere: Prisma.InvoiceWhereInput = {
      tenantId,
    };

    const paymentWhere: Prisma.PaymentWhereInput = {
      tenantId,
      status: 'completed',
    };

    if (startDate || endDate) {
      const dateFilter: Prisma.DateTimeFilter = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }
      invoiceWhere.createdAt = dateFilter;
      paymentWhere.createdAt = dateFilter;
    }

    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where: invoiceWhere,
      }),
      this.prisma.payment.findMany({
        where: paymentWhere,
      }),
    ]);

    const totalInvoiced = invoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0,
    );
    const totalPaid = payments.reduce(
      (sum, pay) => sum + Number(pay.amount),
      0,
    );
    const totalPending = totalInvoiced - totalPaid;

    return {
      totalInvoiced,
      totalPaid,
      totalPending,
      invoices: invoices.length,
      payments: payments.length,
    };
  }

  /**
   * Gera relatório de estoque
   */
  private async generateInventoryReport(
    tenantId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const parts = await this.prisma.part.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const lowStock = parts.filter((part) => part.quantity <= part.minQuantity);
    const totalValue = parts.reduce(
      (sum, part) => sum + Number(part.quantity) * Number(part.costPrice),
      0,
    );

    return {
      totalParts: parts.length,
      lowStock: lowStock.length,
      totalValue,
      parts,
    };
  }

  /**
   * Gera relatório de clientes
   */
  private async generateCustomersReport(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: Prisma.CustomerWhereInput = {
      tenantId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            serviceOrders: true,
            quotes: true,
          },
        },
      },
    });

    return {
      total: customers.length,
      customers,
    };
  }

  /**
   * Gera relatório de mecânicos
   */
  private async generateMechanicsReport(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: Prisma.UserWhereInput = {
      tenantId,
      role: 'mechanic',
      isActive: true,
    };

    const mechanics = await this.prisma.user.findMany({
      where,
      include: {
        _count: {
          select: {
            serviceOrders: true,
          },
        },
      },
    });

    const serviceOrdersWhere: Prisma.ServiceOrderWhereInput = {
      tenantId,
      technicianId: { in: mechanics.map((m) => m.id) },
    };

    if (startDate || endDate) {
      serviceOrdersWhere.createdAt = {};
      if (startDate) {
        serviceOrdersWhere.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        serviceOrdersWhere.createdAt.lte = new Date(endDate);
      }
    }

    const serviceOrders = await this.prisma.serviceOrder.findMany({
      where: serviceOrdersWhere,
      include: {
        technician: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const byMechanic = mechanics.map((mechanic) => {
      const orders = serviceOrders.filter(
        (so) => so.technicianId === mechanic.id,
      );
      return {
        mechanic: {
          id: mechanic.id,
          name: mechanic.name,
        },
        totalOrders: orders.length,
        completedOrders: orders.filter((o) => o.status === 'completed').length,
      };
    });

    return {
      totalMechanics: mechanics.length,
      byMechanic,
    };
  }

  /**
   * Gera relatório de orçamentos
   */
  private async generateQuotesReport(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: Prisma.QuoteWhereInput = {
      tenantId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const quotes = await this.prisma.quote.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const byStatus = quotes.reduce(
      (acc, quote) => {
        acc[quote.status] = (acc[quote.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalValue = quotes.reduce(
      (sum, quote) => sum + Number(quote.totalCost),
      0,
    );

    return {
      total: quotes.length,
      byStatus,
      totalValue,
      quotes,
    };
  }

  /**
   * Gera relatório de faturas
   */
  private async generateInvoicesReport(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: Prisma.InvoiceWhereInput = {
      tenantId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const byStatus = invoices.reduce(
      (acc, inv) => {
        acc[inv.status] = (acc[inv.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalValue = invoices.reduce(
      (sum, inv) => sum + Number(inv.total),
      0,
    );

    return {
      total: invoices.length,
      byStatus,
      totalValue,
      invoices,
    };
  }

  /**
   * Gera relatório de pagamentos
   */
  private async generatePaymentsReport(
    tenantId: string,
    startDate?: string,
    endDate?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: Prisma.PaymentWhereInput = {
      tenantId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const payments = await this.prisma.payment.findMany({
      where,
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
      },
    });

    const byMethod = payments.reduce(
      (acc, pay) => {
        acc[pay.method] = (acc[pay.method] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byStatus = payments.reduce(
      (acc, pay) => {
        acc[pay.status] = (acc[pay.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalAmount = payments.reduce(
      (sum, pay) => sum + Number(pay.amount),
      0,
    );

    return {
      total: payments.length,
      byMethod,
      byStatus,
      totalAmount,
      payments,
    };
  }

  /**
   * Calcula resumo do relatório
   */
  private calculateSummary(
    reportData: Record<string, unknown>,
    type: ReportType,
  ): Record<string, unknown> {
    switch (type) {
      case ReportType.SALES:
        return {
          totalServiceOrders: reportData.totalServiceOrders,
          totalInvoices: reportData.totalInvoices,
          totalRevenue: reportData.totalRevenue,
        };
      case ReportType.SERVICES:
        return {
          total: reportData.total,
          byStatus: reportData.byStatus,
        };
      case ReportType.FINANCIAL:
        return {
          totalInvoiced: reportData.totalInvoiced,
          totalPaid: reportData.totalPaid,
          totalPending: reportData.totalPending,
        };
      case ReportType.INVENTORY:
        return {
          totalParts: reportData.totalParts,
          lowStock: reportData.lowStock,
          totalValue: reportData.totalValue,
        };
      default:
        return {};
    }
  }

  /**
   * Gera nome do arquivo
   */
  private generateFilename(type: ReportType, format: ReportFormat): string {
    const date = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    let extension: string = format;
    if (format === ReportFormat.EXCEL) {
      extension = 'xlsx';
    } else if (format === ReportFormat.CSV) {
      extension = 'csv';
    }
    return `relatorio-${type}-${date}-${timestamp}.${extension}`;
  }

  /**
   * Gera arquivo PDF
   */
  private async generatePdfFile(
    reportData: Record<string, unknown>,
    type: ReportType,
    summary: Record<string, unknown>,
    startDate?: string,
    endDate?: string,
    workshopSettings?: {
      displayName?: string | null;
      logoUrl?: string | null;
      primaryColor?: string | null;
      address?: string | null;
      phone?: string | null;
      email?: string | null;
    } | null,
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

        // Cabeçalho profissional
        const primaryColor = workshopSettings?.primaryColor || '#00E0B8';
        this.renderPdfHeader(doc, type, workshopSettings, primaryColor);
        this.renderPdfPeriod(doc, startDate, endDate);
        this.renderPdfSummary(doc, summary);

        // Dados principais formatados
        this.renderPdfData(doc, reportData, type, primaryColor);

        // Rodapé
        this.renderPdfFooter(doc, workshopSettings);

        doc.end();
      } catch (error) {
        this.logger.error(`Erro ao gerar PDF: ${getErrorMessage(error)}`);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * Gera arquivo Excel/CSV
   */
  private async generateExcelFile(
    reportData: Record<string, unknown>,
    type: ReportType,
    summary: Record<string, unknown>,
    isCsv: boolean,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatório');

    // Cabeçalho
    worksheet.mergeCells('A1:B1');
    worksheet.getCell('A1').value =
      `Relatório de ${this.getReportTypeName(type)}`;
    worksheet.getCell('A1').font = {
      size: 16,
      bold: true,
      color: { argb: 'FF00E0B8' },
    };
    worksheet.getCell('A1').alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };

    worksheet.getCell('A2').value = 'Gerado em:';
    worksheet.getCell('B2').value = new Date().toLocaleString('pt-BR');

    // Resumo
    if (Object.keys(summary).length > 0) {
      let row = 4;
      worksheet.getCell(`A${row}`).value = 'Resumo';
      worksheet.getCell(`A${row}`).font = { size: 12, bold: true };
      row++;

      for (const [key, value] of Object.entries(summary)) {
        worksheet.getCell(`A${row}`).value = this.formatKey(key);
        worksheet.getCell(`B${row}`).value = this.formatValue(value);
        row++;
      }
      row++;
    }

    // Dados principais
    const dataRow = Object.keys(summary).length > 0 ? 7 : 4;
    worksheet.getCell(`A${dataRow}`).value = 'Dados';
    worksheet.getCell(`A${dataRow}`).font = { size: 12, bold: true };

    // Converter dados para planilha
    this.flattenDataToSheet(worksheet, reportData, dataRow + 2);

    // Ajustar largura das colunas
    for (const column of worksheet.columns) {
      column.width = 20;
    }

    // Gerar buffer
    if (isCsv) {
      // Para CSV, converter para formato CSV
      const csv = this.workbookToCsv(workbook);
      return Buffer.from(csv, 'utf-8');
    } else {
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    }
  }

  /**
   * Converte workbook para CSV
   */
  private workbookToCsv(workbook: ExcelJS.Workbook): string {
    const lines: string[] = [];
    const worksheetOrUndefined = workbook.getWorksheet(1);

    if (!worksheetOrUndefined) {
      throw new Error('Worksheet não encontrada no workbook');
    }

    // Após a verificação, TypeScript sabe que worksheet não é undefined
    const worksheet: ExcelJS.Worksheet = worksheetOrUndefined;
    worksheet.eachRow((row) => {
      const values: string[] = [];
      row.eachCell((cell) => {
        let cellValue: string;
        const rawValue = cell.value;
        if (rawValue instanceof Date) {
          cellValue = rawValue.toLocaleString('pt-BR');
        } else if (rawValue !== null && rawValue !== undefined) {
          if (typeof rawValue === 'object') {
            cellValue = JSON.stringify(rawValue);
          } else {
            cellValue = String(rawValue);
          }
        } else {
          cellValue = '';
        }
        // Escapar vírgulas e aspas
        if (
          cellValue.includes(',') ||
          cellValue.includes('"') ||
          cellValue.includes('\n')
        ) {
          cellValue = `"${cellValue.replaceAll('"', '""')}"`;
        }
        values.push(cellValue);
      });
      lines.push(values.join(','));
    });

    return lines.join('\n');
  }

  /**
   * Achatamento de dados para planilha
   */
  private flattenDataToSheet(
    worksheet: ExcelJS.Worksheet,
    data: Record<string, unknown>,
    startRow: number,
  ): void {
    let currentRow = startRow;

    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        // Se for array, criar tabela
        if (value.length > 0 && typeof value[0] === 'object') {
          // Array de objetos - criar cabeçalho
          const headers = Object.keys(value[0] as Record<string, unknown>);
          for (let colIndex = 0; colIndex < headers.length; colIndex++) {
            const header = headers[colIndex];
            worksheet.getCell(currentRow, colIndex + 1).value =
              this.formatKey(header);
            worksheet.getCell(currentRow, colIndex + 1).font = { bold: true };
          }
          currentRow++;

          // Dados
          for (const item of value) {
            const itemObj = item as Record<string, unknown>;
            for (let colIndex = 0; colIndex < headers.length; colIndex++) {
              const header = headers[colIndex];
              worksheet.getCell(currentRow, colIndex + 1).value =
                this.formatValue(itemObj[header]);
            }
            currentRow++;
          }
        } else {
          // Array simples
          worksheet.getCell(currentRow, 1).value = this.formatKey(key);
          worksheet.getCell(currentRow, 2).value = (value as unknown[]).join(
            ', ',
          );
          currentRow++;
        }
      } else if (value !== null && typeof value === 'object') {
        // Objeto aninhado - recursão
        worksheet.getCell(currentRow, 1).value = this.formatKey(key);
        worksheet.getCell(currentRow, 1).font = { bold: true };
        currentRow++;
        this.flattenDataToSheet(
          worksheet,
          value as Record<string, unknown>,
          currentRow,
        );
        currentRow += 10; // Espaço aproximado
      } else {
        // Valor simples
        worksheet.getCell(currentRow, 1).value = this.formatKey(key);
        worksheet.getCell(currentRow, 2).value = this.formatValue(value);
        currentRow++;
      }
    }
  }

  /**
   * Formata chave para exibição
   */
  private formatKey(key: string): string {
    const withSpaces = key.replaceAll(/([A-Z])/g, ' $1');
    const capitalized =
      withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
    return capitalized.trim();
  }

  /**
   * Formata valor para exibição
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'number') {
      return value.toLocaleString('pt-BR');
    }
    if (value instanceof Date) {
      return value.toLocaleString('pt-BR');
    }
    if (typeof value === 'boolean') {
      return value ? 'Sim' : 'Não';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (typeof value === 'string') {
      return value;
    }
    // Se chegou aqui, value é um tipo primitivo (symbol, bigint)
    // que pode ser convertido com segurança para string
    if (typeof value === 'symbol') {
      return value.toString();
    }
    if (typeof value === 'bigint') {
      return value.toString();
    }
    // NOSONAR - value já foi verificado e não é objeto, null, undefined, number, Date, boolean, string, symbol ou bigint
    // O TypeScript garante que só restam tipos primitivos que podem ser convertidos com segurança
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(value);
  }

  /**
   * Obtém nome legível do tipo de relatório
   */
  private getReportTypeName(type: ReportType): string {
    const names: Record<ReportType, string> = {
      [ReportType.SALES]: 'Vendas',
      [ReportType.SERVICES]: 'Serviços',
      [ReportType.FINANCIAL]: 'Financeiro',
      [ReportType.INVENTORY]: 'Estoque',
      [ReportType.CUSTOMERS]: 'Clientes',
      [ReportType.MECHANICS]: 'Mecânicos',
      [ReportType.QUOTES]: 'Orçamentos',
      [ReportType.INVOICES]: 'Faturas',
      [ReportType.PAYMENTS]: 'Pagamentos',
    };
    return names[type] || type;
  }

  /**
   * Busca relatório por ID
   */
  async findOne(tenantId: string, id: string) {
    const report = await (
      this.prisma as unknown as {
        report: {
          findFirst: (args: unknown) => Promise<{
            id: string;
            type: string;
            format: string;
            filename: string;
            filePath: string | null;
            fileSize: number | null;
            startDate: Date | null;
            endDate: Date | null;
            filters: unknown;
            summary: unknown;
            status: string;
            createdAt: Date;
            generatedBy: string | null;
          } | null>;
        };
      }
    ).report.findFirst({
      where: {
        id,
        tenantId,
      },
      select: {
        id: true,
        type: true,
        format: true,
        filename: true,
        filePath: true,
        fileSize: true,
        startDate: true,
        endDate: true,
        filters: true,
        summary: true,
        status: true,
        createdAt: true,
        generatedBy: true,
      },
    } as never);

    if (!report) {
      throw new NotFoundException('Relatório não encontrado');
    }

    return report;
  }

  /**
   * Busca arquivo do relatório
   */
  async getReportFile(tenantId: string, id: string): Promise<Buffer> {
    const report = await this.findOne(tenantId, id);

    if (!report.filePath) {
      throw new NotFoundException('Arquivo do relatório não encontrado');
    }

    const fullPath = join(process.cwd(), report.filePath);

    if (!existsSync(fullPath)) {
      throw new NotFoundException(
        'Arquivo do relatório não existe no sistema de arquivos',
      );
    }

    return fs.readFile(fullPath);
  }

  /**
   * Lista relatórios do tenant
   */
  async findAll(tenantId: string, limit = 50, offset = 0) {
    const [reports, total] = await Promise.all([
      (
        this.prisma as unknown as {
          report: { findMany: (args: unknown) => Promise<unknown> };
        }
      ).report.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          format: true,
          filename: true,
          fileSize: true,
          createdAt: true,
          summary: true,
        },
      }),

      (
        this.prisma as unknown as {
          report: {
            count: (args: { where: { tenantId: string } }) => Promise<number>;
          };
        }
      ).report.count({
        where: { tenantId },
      }),
    ]);

    return {
      reports,
      total,
      limit,
      offset,
    };
  }

  /**
   * Renderiza dados no PDF de forma formatada
   */
  /**
   * Renderiza cabeçalho do PDF
   */
  private renderPdfHeader(
    doc: PDFKit.PDFDocument,
    type: ReportType,
    workshopSettings:
      | {
          logoUrl?: string | null;
          displayName?: string | null;
          primaryColor?: string | null;
        }
      | null
      | undefined,
    primaryColor: string,
  ): void {
    const headerY = 50;
    let currentY = headerY;

    // Logo da oficina (se configurado)
    if (workshopSettings?.logoUrl) {
      try {
        const logoPath = this.getLogoPath(workshopSettings.logoUrl);
        if (logoPath && existsSync(logoPath)) {
          doc.image(logoPath, 50, currentY, {
            width: 60,
            height: 60,
            fit: [60, 60],
          });
          currentY += 70;
        }
      } catch (error) {
        this.logger.warn(`Erro ao carregar logo: ${getErrorMessage(error)}`);
      }
    }

    // Nome da oficina
    const workshopName = workshopSettings?.displayName || 'Oficina Mecânica';
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor(primaryColor)
      .text(workshopName, 50, currentY, { align: 'center', width: 500 });
    currentY += 25;

    // Título do relatório
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor('#000000')
      .text(
        `RELATÓRIO DE ${this.getReportTypeName(type).toUpperCase()}`,
        50,
        currentY,
        {
          align: 'center',
          width: 500,
        },
      );
    doc.y = currentY + 30;
  }

  /**
   * Renderiza período e data de geração do PDF
   */
  private renderPdfPeriod(
    doc: PDFKit.PDFDocument,
    startDate?: string,
    endDate?: string,
  ): void {
    // Período (se houver)
    if (startDate || endDate) {
      let periodText: string;
      if (startDate && endDate) {
        periodText = `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}`;
      } else if (startDate) {
        periodText = `A partir de: ${new Date(startDate).toLocaleDateString('pt-BR')}`;
      } else {
        periodText = `Até: ${new Date(endDate as string).toLocaleDateString('pt-BR')}`;
      }
      if (periodText) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .fillColor('#666666')
          .text(periodText, 50, doc.y, { align: 'center', width: 500 });
        doc.y += 20;
      }
    }

    // Data de geração
    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#666666')
      .text(
        `Gerado em: ${new Date().toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        50,
        doc.y,
        { align: 'center', width: 500 },
      );
    doc.y += 25;

    // Linha separadora colorida
    const primaryColor = '#00E0B8';
    doc
      .moveTo(50, doc.y)
      .lineTo(550, doc.y)
      .lineWidth(2)
      .strokeColor(primaryColor)
      .stroke();

    doc.y += 20;
  }

  /**
   * Renderiza resumo do PDF
   */
  private renderPdfSummary(
    doc: PDFKit.PDFDocument,
    summary: Record<string, unknown>,
  ): void {
    if (Object.keys(summary).length > 0) {
      doc.fontSize(14).fillColor('#00E0B8').text('Resumo', { underline: true });
      doc.moveDown();
      doc.fontSize(10).fillColor('#000000');
      for (const [key, value] of Object.entries(summary)) {
        doc.text(`${this.formatKey(key)}: ${this.formatValue(value)}`);
      }
      doc.moveDown(2);
    }
  }

  /**
   * Renderiza rodapé do PDF
   */
  private renderPdfFooter(
    doc: PDFKit.PDFDocument,
    workshopSettings:
      | {
          displayName?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
        }
      | null
      | undefined,
  ): void {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 50;

    // Linha separadora
    doc
      .moveTo(50, footerY - 20)
      .lineTo(550, footerY - 20)
      .lineWidth(1)
      .strokeColor('#CCCCCC')
      .stroke();

    // Informações da oficina no rodapé
    const footerInfo: string[] = [];
    if (workshopSettings?.displayName) {
      footerInfo.push(workshopSettings.displayName);
    }
    if (workshopSettings?.address) {
      footerInfo.push(workshopSettings.address);
    }
    if (workshopSettings?.phone) {
      footerInfo.push(`Tel: ${workshopSettings.phone}`);
    }
    if (workshopSettings?.email) {
      footerInfo.push(`Email: ${workshopSettings.email}`);
    }

    if (footerInfo.length > 0) {
      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#666666')
        .text(footerInfo.join(' | '), 50, footerY - 15, {
          align: 'center',
          width: 500,
        });
    }

    // Rodapé com informação do sistema
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#999999')
      .text('Relatório gerado pelo sistema Mecânica365', 50, footerY - 5, {
        align: 'center',
        width: 500,
      });
  }

  private renderPdfData(
    doc: InstanceType<typeof PDFDocument>,
    reportData: Record<string, unknown>,
    type: ReportType,
    primaryColor: string,
  ): void {
    // Título da seção de detalhes
    doc
      .fontSize(14)
      .fillColor(primaryColor)
      .text('Detalhes', { underline: true });
    doc.moveDown();

    // Formatar dados baseado no tipo de relatório
    switch (type) {
      case ReportType.FINANCIAL:
        this.renderFinancialDetails(doc, reportData, primaryColor);
        break;
      case ReportType.SALES:
        this.renderSalesDetails(doc, reportData, primaryColor);
        break;
      case ReportType.SERVICES:
        this.renderServicesDetails(doc, reportData, primaryColor);
        break;
      case ReportType.INVENTORY:
        this.renderInventoryDetails(doc, reportData, primaryColor);
        break;
      case ReportType.CUSTOMERS:
        this.renderCustomersDetails(doc, reportData, primaryColor);
        break;
      case ReportType.MECHANICS:
        this.renderMechanicsDetails(doc, reportData, primaryColor);
        break;
      case ReportType.QUOTES:
        this.renderQuotesDetails(doc, reportData, primaryColor);
        break;
      case ReportType.INVOICES:
        this.renderInvoicesDetails(doc, reportData, primaryColor);
        break;
      case ReportType.PAYMENTS:
        this.renderPaymentsDetails(doc, reportData, primaryColor);
        break;
      default:
        // Fallback para dados genéricos
        this.renderGenericDetails(doc, reportData);
    }
  }

  /**
   * Renderiza detalhes financeiros
   */
  private renderFinancialDetails(
    doc: InstanceType<typeof PDFDocument>,
    data: Record<string, unknown>,
    primaryColor: string,
  ): void {
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 300;

    // Cabeçalho da tabela
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Indicador', col1, tableTop);
    doc.text('Valor', col2, tableTop);

    // Linha separadora
    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Dados
    doc.font('Helvetica').fillColor('#000000');
    let y = tableTop + 25;

    const rows = [
      {
        label: 'Total Faturado',
        value: this.formatCurrency(data.totalInvoiced as number),
      },
      {
        label: 'Total Recebido',
        value: this.formatCurrency(data.totalPaid as number),
      },
      {
        label: 'Total Pendente',
        value: this.formatCurrency(data.totalPending as number),
      },
      {
        label: 'Quantidade de Faturas',
        value: String(Number(data.invoices) || 0),
      },
      {
        label: 'Quantidade de Pagamentos',
        value: String(Number(data.payments) || 0),
      },
    ];

    for (const row of rows) {
      doc.text(row.label, col1, y);
      doc.text(row.value, col2, y);
      y += 20;
    }

    doc.y = y + 10;
  }

  /**
   * Renderiza detalhes de vendas
   */
  private renderSalesDetails(
    doc: InstanceType<typeof PDFDocument>,
    data: Record<string, unknown>,
    primaryColor: string,
  ): void {
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 300;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Indicador', col1, tableTop);
    doc.text('Valor', col2, tableTop);
    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font('Helvetica').fillColor('#000000');
    let y = tableTop + 25;

    const rows = [
      {
        label: 'Receita Total',
        value: this.formatCurrency(data.totalRevenue as number),
      },
      {
        label: 'Total de Serviços',
        value: String(Number(data.totalServices) || 0),
      },
      {
        label: 'OS Concluídas',
        value: String(Number(data.completedOrders) || 0),
      },
      {
        label: 'Ticket Médio',
        value: this.formatCurrency(data.averageTicket as number),
      },
    ];

    for (const row of rows) {
      doc.text(row.label, col1, y);
      doc.text(row.value, col2, y);
      y += 20;
    }

    // Se houver dados por mecânico
    if (data.byMechanic && typeof data.byMechanic === 'object') {
      y += 20;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text('Por Mecânico:', col1, y);
      y += 20;

      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      const byMechanic = data.byMechanic as Record<string, number>;
      for (const [mechanic, value] of Object.entries(byMechanic)) {
        doc.text(mechanic || 'Não atribuído', col1, y);
        doc.text(this.formatCurrency(value), col2, y);
        y += 18;
      }
    }

    doc.y = y + 10;
  }

  /**
   * Renderiza detalhes de serviços
   */
  private renderServicesDetails(
    doc: InstanceType<typeof PDFDocument>,
    data: Record<string, unknown>,
    primaryColor: string,
  ): void {
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 300;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Indicador', col1, tableTop);
    doc.text('Valor', col2, tableTop);
    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font('Helvetica').fillColor('#000000');
    let y = tableTop + 25;

    doc.text('Total de Ordens de Serviço', col1, y);
    doc.text(String(Number(data.total) || 0), col2, y);
    y += 25;

    // Status das OS
    if (data.byStatus && typeof data.byStatus === 'object') {
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text('Por Status:', col1, y);
      y += 20;

      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      const statusLabels: Record<string, string> = {
        pending: 'Pendente',
        in_progress: 'Em Andamento',
        waiting_parts: 'Aguardando Peças',
        waiting_approval: 'Aguardando Aprovação',
        completed: 'Concluído',
        cancelled: 'Cancelado',
      };

      const byStatus = data.byStatus as Record<string, number>;
      for (const [status, count] of Object.entries(byStatus)) {
        doc.text(statusLabels[status] || status, col1, y);
        doc.text(String(count), col2, y);
        y += 18;
      }
    }

    doc.y = y + 10;
  }

  /**
   * Renderiza detalhes de estoque
   */
  private renderInventoryDetails(
    doc: InstanceType<typeof PDFDocument>,
    data: Record<string, unknown>,
    primaryColor: string,
  ): void {
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 300;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Indicador', col1, tableTop);
    doc.text('Valor', col2, tableTop);
    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font('Helvetica').fillColor('#000000');
    let y = tableTop + 25;

    const rows = [
      { label: 'Total de Itens', value: String(Number(data.totalItems) || 0) },
      {
        label: 'Valor Total em Estoque',
        value: this.formatCurrency(data.totalValue as number),
      },
      {
        label: 'Itens com Estoque Baixo',
        value: String(Number(data.lowStockItems) || 0),
      },
      {
        label: 'Itens Sem Estoque',
        value: String(Number(data.outOfStockItems) || 0),
      },
    ];

    for (const row of rows) {
      doc.text(row.label, col1, y);
      doc.text(row.value, col2, y);
      y += 20;
    }

    doc.y = y + 10;
  }

  /**
   * Renderiza detalhes de clientes
   */
  private renderCustomersDetails(
    doc: InstanceType<typeof PDFDocument>,
    data: Record<string, unknown>,
    primaryColor: string,
  ): void {
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 300;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Indicador', col1, tableTop);
    doc.text('Valor', col2, tableTop);
    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font('Helvetica').fillColor('#000000');
    let y = tableTop + 25;

    const rows = [
      {
        label: 'Total de Clientes',
        value: String(Number(data.totalCustomers) || 0),
      },
      {
        label: 'Novos Clientes (período)',
        value: String(Number(data.newCustomers) || 0),
      },
      {
        label: 'Clientes com Veículos',
        value: String(Number(data.customersWithVehicles) || 0),
      },
      {
        label: 'Total de Veículos',
        value: String(Number(data.totalVehicles) || 0),
      },
    ];

    for (const row of rows) {
      doc.text(row.label, col1, y);
      doc.text(row.value, col2, y);
      y += 20;
    }

    doc.y = y + 10;
  }

  /**
   * Renderiza detalhes de mecânicos
   */
  private renderMechanicsDetails(
    doc: InstanceType<typeof PDFDocument>,
    data: Record<string, unknown>,
    primaryColor: string,
  ): void {
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 300;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Indicador', col1, tableTop);
    doc.text('Valor', col2, tableTop);
    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font('Helvetica').fillColor('#000000');
    let y = tableTop + 25;

    doc.text('Total de Mecânicos', col1, y);
    doc.text(String(Number(data.totalMechanics) || 0), col2, y);
    y += 25;

    // Produtividade por mecânico
    if (data.mechanics && Array.isArray(data.mechanics)) {
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text('Produtividade por Mecânico:', col1, y);
      y += 20;

      // Cabeçalho da tabela
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#666666');
      doc.text('Mecânico', 50, y);
      doc.text('OS Atribuídas', 200, y);
      doc.text('OS Concluídas', 300, y);
      doc.text('Receita', 420, y);
      y += 15;
      doc.moveTo(50, y).lineTo(550, y).lineWidth(0.5).stroke();
      y += 5;

      doc.font('Helvetica').fillColor('#000000');
      const mechanics = data.mechanics as Array<{
        name?: string;
        totalOrders?: number;
        completedOrders?: number;
        revenue?: number;
      }>;

      for (const mech of mechanics.slice(0, 10)) {
        // Limitar a 10 mecânicos
        doc.text(mech.name || 'N/A', 50, y, { width: 140 });
        doc.text(String(mech.totalOrders ?? 0), 200, y);
        doc.text(String(mech.completedOrders ?? 0), 300, y);
        doc.text(this.formatCurrency(mech.revenue ?? 0), 420, y);
        y += 18;
      }
    }

    doc.y = y + 10;
  }

  /**
   * Renderiza detalhes de orçamentos
   */
  private renderQuotesDetails(
    doc: InstanceType<typeof PDFDocument>,
    data: Record<string, unknown>,
    primaryColor: string,
  ): void {
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 300;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Indicador', col1, tableTop);
    doc.text('Valor', col2, tableTop);
    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font('Helvetica').fillColor('#000000');
    let y = tableTop + 25;

    const rows = [
      {
        label: 'Total de Orçamentos',
        value: String(Number(data.totalQuotes) || 0),
      },
      {
        label: 'Valor Total',
        value: this.formatCurrency(data.totalValue as number),
      },
      {
        label: 'Orçamentos Aprovados',
        value: String(Number(data.approvedQuotes) || 0),
      },
      {
        label: 'Orçamentos Rejeitados',
        value: String(Number(data.rejectedQuotes) || 0),
      },
      {
        label: 'Taxa de Conversão',
        value: `${Number(data.conversionRate) || 0}%`,
      },
    ];

    for (const row of rows) {
      doc.text(row.label, col1, y);
      doc.text(row.value, col2, y);
      y += 20;
    }

    doc.y = y + 10;
  }

  /**
   * Renderiza detalhes de faturas
   */
  private renderInvoicesDetails(
    doc: InstanceType<typeof PDFDocument>,
    data: Record<string, unknown>,
    primaryColor: string,
  ): void {
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 300;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Indicador', col1, tableTop);
    doc.text('Valor', col2, tableTop);
    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font('Helvetica').fillColor('#000000');
    let y = tableTop + 25;

    const rows = [
      {
        label: 'Total de Faturas',
        value: String(Number(data.totalInvoices) || 0),
      },
      {
        label: 'Valor Total',
        value: this.formatCurrency(data.totalAmount as number),
      },
      { label: 'Faturas Pagas', value: String(Number(data.paidInvoices) || 0) },
      {
        label: 'Faturas Pendentes',
        value: String(Number(data.pendingInvoices) || 0),
      },
      {
        label: 'Faturas Vencidas',
        value: String(Number(data.overdueInvoices) || 0),
      },
    ];

    for (const row of rows) {
      doc.text(row.label, col1, y);
      doc.text(row.value, col2, y);
      y += 20;
    }

    doc.y = y + 10;
  }

  /**
   * Renderiza detalhes de pagamentos
   */
  private renderPaymentsDetails(
    doc: InstanceType<typeof PDFDocument>,
    data: Record<string, unknown>,
    primaryColor: string,
  ): void {
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 300;

    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor);
    doc.text('Indicador', col1, tableTop);
    doc.text('Valor', col2, tableTop);
    doc
      .moveTo(col1, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    doc.font('Helvetica').fillColor('#000000');
    let y = tableTop + 25;

    const rows = [
      {
        label: 'Total de Pagamentos',
        value: String(Number(data.totalPayments) || 0),
      },
      {
        label: 'Valor Total Recebido',
        value: this.formatCurrency(data.totalReceived as number),
      },
    ];

    for (const row of rows) {
      doc.text(row.label, col1, y);
      doc.text(row.value, col2, y);
      y += 20;
    }

    // Por método de pagamento
    if (data.byMethod && typeof data.byMethod === 'object') {
      y += 15;
      doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor);
      doc.text('Por Método de Pagamento:', col1, y);
      y += 20;

      const methodLabels: Record<string, string> = {
        cash: 'Dinheiro',
        credit_card: 'Cartão de Crédito',
        debit_card: 'Cartão de Débito',
        pix: 'PIX',
        bank_transfer: 'Transferência',
        check: 'Cheque',
        other: 'Outro',
      };

      doc.fontSize(10).font('Helvetica').fillColor('#000000');
      const byMethod = data.byMethod as Record<string, number>;
      for (const [method, amount] of Object.entries(byMethod)) {
        doc.text(methodLabels[method] || method, col1, y);
        doc.text(this.formatCurrency(amount), col2, y);
        y += 18;
      }
    }

    doc.y = y + 10;
  }

  /**
   * Renderiza dados genéricos (fallback)
   */
  private renderGenericDetails(
    doc: InstanceType<typeof PDFDocument>,
    data: Record<string, unknown>,
  ): void {
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    let y = doc.y;

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        continue; // Pular objetos complexos
      }
      doc.text(`${this.formatKey(key)}: ${this.formatValue(value)}`, 50, y);
      y += 18;
    }

    doc.y = y + 10;
  }

  /**
   * Formata valor como moeda
   */
  private formatCurrency(value: number | undefined | null): string {
    if (value === undefined || value === null || Number.isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Obtém caminho do logo
   */
  private getLogoPath(logoUrl: string): string | null {
    try {
      // Se for URL completa, retornar null (não suportado para PDF)
      if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
        return null;
      }

      // Se for caminho relativo, construir caminho absoluto
      if (logoUrl.startsWith('/uploads/')) {
        return join(process.cwd(), logoUrl);
      }

      // Se já for caminho absoluto
      const absolutePathRegex = /^[A-Z]:/;

      if (logoUrl.startsWith('/') || absolutePathRegex.test(logoUrl)) {
        return logoUrl;
      }

      // Caminho relativo a partir de uploads
      return join(process.cwd(), 'uploads', logoUrl);
    } catch {
      return null;
    }
  }
}
