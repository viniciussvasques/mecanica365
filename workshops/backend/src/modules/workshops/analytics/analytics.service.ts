import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  DashboardAnalyticsDto,
  OverviewMetricsDto,
  StatusDistributionDto,
  RevenueChartDto,
  CommonProblemDto,
  TopPartDto,
  MechanicPerformanceDto,
  AlertDto,
} from './dto/analytics-response.dto';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca dados completos do dashboard
   */
  async getDashboardAnalytics(
    tenantId: string,
  ): Promise<DashboardAnalyticsDto> {
    try {
      const [
        overview,
        statusDistribution,
        revenueChart,
        commonProblems,
        topParts,
        mechanicPerformance,
        alerts,
      ] = await Promise.all([
        this.getOverviewMetrics(tenantId),
        this.getStatusDistribution(tenantId),
        this.getRevenueChart(tenantId),
        this.getCommonProblems(tenantId),
        this.getTopParts(tenantId),
        this.getMechanicPerformance(tenantId),
        this.getAlerts(tenantId),
      ]);

      return {
        overview,
        statusDistribution,
        revenueChart,
        commonProblems,
        topParts,
        mechanicPerformance,
        alerts,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao gerar analytics do dashboard: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Métricas de overview
   */
  private async getOverviewMetrics(
    tenantId: string,
  ): Promise<OverviewMetricsDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // OS de hoje
    const todayServiceOrders = await this.prisma.serviceOrder.count({
      where: {
        tenantId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Receita de hoje
    const todayRevenueResult = await this.prisma.serviceOrder.aggregate({
      where: {
        tenantId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
        status: 'completed',
      },
      _sum: {
        totalCost: true,
      },
    });
    const todayRevenue = Number(todayRevenueResult._sum.totalCost || 0);

    // Veículos atendidos hoje
    const todayVehicles = await this.prisma.serviceOrder.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        vehicleVin: true,
        vehiclePlaca: true,
      },
    });

    // Contar veículos únicos baseado na placa ou VIN
    const uniqueVehicles = new Set<string>();
    for (const order of todayVehicles) {
      const identifier = order.vehiclePlaca || order.vehicleVin;
      if (identifier) {
        uniqueVehicles.add(identifier);
      }
    }

    // Tempo médio por OS (concluídas)
    const avgTimeResult = await this.prisma.serviceOrder.aggregate({
      where: {
        tenantId,
        status: 'completed',
        startedAt: { not: null },
        completedAt: { not: null },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 dias
        },
      },
      _avg: {
        actualHours: true,
      },
    });
    const avgTimePerService = Number(avgTimeResult._avg.actualHours || 0);

    // Taxa de conclusão (últimos 30 dias)
    const totalOrders = await this.prisma.serviceOrder.count({
      where: {
        tenantId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    const completedOrders = await this.prisma.serviceOrder.count({
      where: {
        tenantId,
        status: 'completed',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    const completionRate =
      totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    // Receita do mês atual
    const currentMonthStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      1,
    );
    const currentMonthRevenueResult = await this.prisma.serviceOrder.aggregate({
      where: {
        tenantId,
        status: 'completed',
        completedAt: {
          gte: currentMonthStart,
        },
      },
      _sum: {
        totalCost: true,
      },
    });
    const currentMonthRevenue = Number(
      currentMonthRevenueResult._sum.totalCost || 0,
    );

    // Receita do mês anterior
    const lastMonthStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1,
    );
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonthRevenueResult = await this.prisma.serviceOrder.aggregate({
      where: {
        tenantId,
        status: 'completed',
        completedAt: {
          gte: lastMonthStart,
          lt: lastMonthEnd,
        },
      },
      _sum: {
        totalCost: true,
      },
    });
    const lastMonthRevenue = Number(lastMonthRevenueResult._sum.totalCost || 0);

    let revenueGrowth = 0;
    if (lastMonthRevenue > 0) {
      revenueGrowth =
        ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    } else if (currentMonthRevenue > 0) {
      revenueGrowth = 100;
    }

    return {
      todayServiceOrders,
      todayRevenue,
      todayVehicles: uniqueVehicles.size,
      avgTimePerService,
      completionRate,
      currentMonthRevenue,
      revenueGrowth,
    };
  }

  /**
   * Distribuição de status das OS
   */
  private async getStatusDistribution(
    tenantId: string,
  ): Promise<StatusDistributionDto[]> {
    const statusCounts = await this.prisma.serviceOrder.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: {
        status: true,
      },
    });

    const total = statusCounts.reduce(
      (sum, item) => sum + item._count.status,
      0,
    );

    return statusCounts.map((item) => ({
      status: item.status,
      count: item._count.status,
      percentage: total > 0 ? (item._count.status / total) * 100 : 0,
    }));
  }

  /**
   * Dados de receita mensal (últimos 6 meses)
   */
  private async getRevenueChart(tenantId: string): Promise<RevenueChartDto[]> {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyData = await this.prisma.$queryRaw<
      Array<{ month: string; revenue: number; serviceOrders: number }>
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "completedAt"), 'YYYY-MM') as month,
        COALESCE(SUM("totalCost"), 0)::float as revenue,
        COUNT(*) as service_orders
      FROM "service_orders"
      WHERE "tenantId" = ${tenantId}
        AND "status" = 'completed'
        AND "completedAt" >= ${sixMonthsAgo}
      GROUP BY DATE_TRUNC('month', "completedAt")
      ORDER BY month
    `;

    // Garantir que todos os meses estejam presentes
    const result: RevenueChartDto[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toISOString().substring(0, 7);

      const existingData = monthlyData.find((d) => d.month === monthKey);
      result.push({
        month: monthKey,
        revenue: existingData ? Number(existingData.revenue) : 0,
        serviceOrders: existingData ? Number(existingData.serviceOrders) : 0,
      });
    }

    return result;
  }

  /**
   * Problemas mais comuns (últimos 30 dias)
   */
  private async getCommonProblems(
    tenantId: string,
  ): Promise<CommonProblemDto[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const problems = await this.prisma.serviceOrder.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
        identifiedProblemId: { not: null },
      },
      include: {
        identifiedProblem: true,
      },
    });

    const problemCounts = new Map<
      string,
      { count: number; totalCost: number }
    >();

    for (const order of problems) {
      if (order.identifiedProblem) {
        const problemName = order.identifiedProblem.name;
        const existing = problemCounts.get(problemName) || {
          count: 0,
          totalCost: 0,
        };
        problemCounts.set(problemName, {
          count: existing.count + 1,
          totalCost: existing.totalCost + Number(order.totalCost || 0),
        });
      }
    }

    const totalProblems = problems.length;
    const result: CommonProblemDto[] = Array.from(problemCounts.entries())
      .map(([problem, data]) => ({
        problem,
        count: data.count,
        percentage: totalProblems > 0 ? (data.count / totalProblems) * 100 : 0,
        avgCost: data.count > 0 ? data.totalCost / data.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return result;
  }

  /**
   * Peças mais utilizadas (últimos 30 dias)
   */
  private async getTopParts(tenantId: string): Promise<TopPartDto[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const partsData = await this.prisma.serviceOrderPart.findMany({
      where: {
        serviceOrder: {
          tenantId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
          status: 'completed',
        },
      },
      select: {
        partName: true,
        quantity: true,
        totalCost: true,
      },
    });

    const partStats = new Map<
      string,
      { quantity: number; totalValue: number }
    >();

    for (const part of partsData) {
      const existing = partStats.get(part.partName) || {
        quantity: 0,
        totalValue: 0,
      };
      partStats.set(part.partName, {
        quantity: existing.quantity + part.quantity,
        totalValue: existing.totalValue + Number(part.totalCost),
      });
    }

    return Array.from(partStats.entries())
      .map(([partName, stats]) => ({
        partName,
        quantity: stats.quantity,
        totalValue: stats.totalValue,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }

  /**
   * Performance dos mecânicos (últimos 30 dias)
   */
  private async getMechanicPerformance(
    tenantId: string,
  ): Promise<MechanicPerformanceDto[]> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const mechanicData = await this.prisma.serviceOrder.findMany({
      where: {
        tenantId,
        status: 'completed',
        completedAt: {
          gte: thirtyDaysAgo,
        },
        technicianId: { not: null },
      },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const mechanicStats = new Map<
      string,
      {
        name: string;
        completedOrders: number;
        totalTime: number;
        totalRevenue: number;
        ratings: number[];
      }
    >();

    for (const order of mechanicData) {
      if (order.technician) {
        const mechanicId = order.technician.id;
        const existing = mechanicStats.get(mechanicId) || {
          name: order.technician.name,
          completedOrders: 0,
          totalTime: 0,
          totalRevenue: 0,
          ratings: [],
        };

        mechanicStats.set(mechanicId, {
          ...existing,
          completedOrders: existing.completedOrders + 1,
          totalTime: existing.totalTime + Number(order.actualHours || 0),
          totalRevenue: existing.totalRevenue + Number(order.totalCost || 0),
        });
      }
    }

    return Array.from(mechanicStats.entries())
      .map(([, stats]) => ({
        mechanicName: stats.name,
        completedOrders: stats.completedOrders,
        avgTimePerOrder:
          stats.completedOrders > 0
            ? stats.totalTime / stats.completedOrders
            : 0,
        revenue: stats.totalRevenue,
        rating: 0, // TODO: Implementar sistema de avaliação
      }))
      .sort((a, b) => b.completedOrders - a.completedOrders)
      .slice(0, 5);
  }

  /**
   * Alertas ativos
   */
  private async getAlerts(tenantId: string): Promise<AlertDto[]> {
    const alerts: AlertDto[] = [];

    // OS atrasadas (mais de 7 dias em andamento)
    const overdueServiceOrders = await this.prisma.serviceOrder.findMany({
      where: {
        tenantId,
        status: 'in_progress',
        startedAt: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
    });

    for (const order of overdueServiceOrders) {
      alerts.push({
        type: 'overdue_service_order',
        severity: 'high',
        title: `OS #${order.number} atrasada`,
        description: `Cliente: ${order.customer?.name || 'N/A'} - Iniciada há ${Math.floor((Date.now() - order.startedAt!.getTime()) / (24 * 60 * 60 * 1000))} dias`,
        data: { serviceOrderId: order.id },
      });
    }

    // Peças com estoque baixo
    const lowStockParts = await this.prisma.part.findMany({
      where: {
        tenantId,
        isActive: true,
        quantity: {
          lte: this.prisma.part.fields.minQuantity,
        },
      },
      take: 5,
    });

    for (const part of lowStockParts) {
      alerts.push({
        type: 'low_stock',
        severity: part.quantity === 0 ? 'urgent' : 'medium',
        title: part.quantity === 0 ? 'Peça sem estoque' : 'Estoque baixo',
        description: `${part.name} - Quantidade: ${part.quantity}`,
        data: { partId: part.id },
      });
    }

    // Manutenções vencidas
    const overdueMaintenances =
      await this.prisma.vehicleMaintenanceSchedule.findMany({
        where: {
          tenantId,
          status: 'overdue',
        },
        include: {
          vehicle: {
            select: {
              placa: true,
              make: true,
              model: true,
            },
          },
        },
        take: 5,
      });

    for (const schedule of overdueMaintenances) {
      alerts.push({
        type: 'due_maintenance',
        severity: 'high',
        title: 'Manutenção vencida',
        description: `${schedule.vehicle.placa || 'Veículo'} - ${schedule.name}`,
        data: { scheduleId: schedule.id, vehicleId: schedule.vehicleId },
      });
    }

    // Orçamentos aguardando aprovação (mais de 3 dias)
    const pendingQuotes = await this.prisma.quote.findMany({
      where: {
        tenantId,
        status: 'sent',
        updatedAt: {
          lt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
      take: 5,
    });

    for (const quote of pendingQuotes) {
      alerts.push({
        type: 'pending_quote',
        severity: 'medium',
        title: 'Orçamento aguardando',
        description: `Cliente: ${quote.customer?.name || 'N/A'} - ${quote.number}`,
        data: { quoteId: quote.id },
      });
    }

    return alerts;
  }
}
