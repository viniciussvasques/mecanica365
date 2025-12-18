import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const [
      totalTenants,
      activeTenants,
      suspendedTenants,
      canceledTenants,
      newTenantsLast30Days,
      totalUsers,
      activeUsers,
      totalRevenue,
      revenueLast30Days,
      serviceOrdersLast30Days,
      activeSubscriptions,
      subscriptionsByPlan,
      supportTickets,
      openTickets,
      totalJobs,
      failedJobs,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'active' } }),
      this.prisma.tenant.count({ where: { status: 'suspended' } }),
      this.prisma.tenant.count({ where: { status: 'canceled' } }),
      this.prisma.tenant.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: 'paid' },
      }),
      this.prisma.invoice.aggregate({
        _sum: { total: true },
        where: { status: 'paid', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.serviceOrder.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.subscription.count({ where: { status: 'active' } }),
      this.prisma.subscription.groupBy({
        by: ['planId'],
        _count: { planId: true },
        where: { planId: { not: null } },
        orderBy: { _count: { planId: 'desc' } },
      }),
      this.prisma.supportTicket.count(),
      this.prisma.supportTicket.count({ where: { status: 'open' } }),
      this.prisma.job.count(),
      this.prisma.job.count({ where: { status: 'failed' } }),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          tenant: { select: { name: true, subdomain: true } },
        },
      }),
    ]);

    const planIds = subscriptionsByPlan
      .map((item) => item.planId)
      .filter((id): id is string => Boolean(id));

    const planMap = planIds.length
      ? await this.getPlanNames(planIds)
      : new Map<string, string>();

    return {
      tenants: {
        total: totalTenants,
        active: activeTenants,
        suspended: suspendedTenants,
        canceled: canceledTenants,
        newLast30Days: newTenantsLast30Days,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      subscriptions: {
        active: activeSubscriptions,
        byPlan: subscriptionsByPlan
          .filter((item) => item.planId)
          .map((item) => ({
            planId: item.planId as string,
            planName: planMap.get(item.planId as string) ?? 'Plano desconhecido',
            count: item._count.planId,
          })),
      },
      revenue: {
        total: this.decimalToNumber(totalRevenue._sum?.total),
        last30Days: this.decimalToNumber(revenueLast30Days._sum?.total),
      },
      operations: {
        serviceOrdersLast30Days,
      },
      support: {
        total: supportTickets,
        open: openTickets,
      },
      jobs: {
        total: totalJobs,
        failed: failedJobs,
      },
      recentActivity: recentAuditLogs,
    };
  }

  private decimalToNumber(value: Prisma.Decimal | null | undefined): number {
    if (!value) {
      return 0;
    }
    return new Prisma.Decimal(value).toNumber();
  }

  private async getPlanNames(ids: string[]) {
    const plans = await this.prisma.plan.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true },
    });

    return plans.reduce((map, plan) => {
      map.set(plan.id, plan.name);
      return map;
    }, new Map<string, string>());
  }
}
