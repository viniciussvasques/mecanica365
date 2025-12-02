import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  GenerateReportDto,
  ReportResponseDto,
  ReportType,
  ReportFormat,
} from './dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera um relatório
   */
  async generate(
    tenantId: string,
    generateReportDto: GenerateReportDto,
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
      let reportData: Record<string, unknown>;
      let summary: Record<string, unknown> = {};

      switch (type) {
        case ReportType.SALES:
          reportData = await this.generateSalesReport(
            tenantId,
            startDate,
            endDate,
            filters,
          );
          break;
        case ReportType.SERVICES:
          reportData = await this.generateServicesReport(
            tenantId,
            startDate,
            endDate,
            filters,
          );
          break;
        case ReportType.FINANCIAL:
          reportData = await this.generateFinancialReport(
            tenantId,
            startDate,
            endDate,
            filters,
          );
          break;
        case ReportType.INVENTORY:
          reportData = await this.generateInventoryReport(tenantId, filters);
          break;
        case ReportType.CUSTOMERS:
          reportData = await this.generateCustomersReport(
            tenantId,
            startDate,
            endDate,
            filters,
          );
          break;
        case ReportType.MECHANICS:
          reportData = await this.generateMechanicsReport(
            tenantId,
            startDate,
            endDate,
            filters,
          );
          break;
        case ReportType.QUOTES:
          reportData = await this.generateQuotesReport(
            tenantId,
            startDate,
            endDate,
            filters,
          );
          break;
        case ReportType.INVOICES:
          reportData = await this.generateInvoicesReport(
            tenantId,
            startDate,
            endDate,
            filters,
          );
          break;
        case ReportType.PAYMENTS:
          reportData = await this.generatePaymentsReport(
            tenantId,
            startDate,
            endDate,
            filters,
          );
          break;
        default:
          throw new BadRequestException(`Tipo de relatório inválido: ${type}`);
      }

      // Gerar arquivo baseado no formato
      const reportId = `report-${Date.now()}`;
      const filename = this.generateFilename(type, format);
      const downloadUrl = `/api/reports/${reportId}/download`;

      // Calcular resumo
      summary = this.calculateSummary(reportData, type);

      this.logger.log(
        `Relatório gerado: ${type} (tenant: ${tenantId}, formato: ${format})`,
      );

      return {
        id: reportId,
        type,
        format,
        downloadUrl,
        filename,
        generatedAt: new Date(),
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
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: unknown = {
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

    const [serviceOrders, invoices] = await Promise.all([
      this.prisma.serviceOrder.findMany({
        where: {
          ...where,
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
          ...where,
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
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: unknown = {
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
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: unknown = {
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

    const [invoices, payments] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
      }),
      this.prisma.payment.findMany({
        where: {
          ...where,
          status: 'completed',
        },
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
    filters?: Record<string, unknown>,
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
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: unknown = {
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
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: unknown = {
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

    const serviceOrdersWhere: unknown = {
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
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: unknown = {
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
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: unknown = {
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
    filters?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const where: unknown = {
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
    const extension = format === ReportFormat.EXCEL ? 'xlsx' : format;
    return `relatorio-${type}-${date}.${extension}`;
  }
}
