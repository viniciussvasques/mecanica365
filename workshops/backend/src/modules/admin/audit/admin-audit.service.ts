import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

interface AuditFilters {
  page: number;
  limit: number;
  action?: string;
  resourceType?: string;
  tenantId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AdminAuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: AuditFilters) {
    const { page, limit, action, resourceType, tenantId, userId, startDate, endDate } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          tenant: {
            select: {
              id: true,
              name: true,
              subdomain: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, today, last7days, last30days, byAction, byResource, byTenant] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.count({
        where: { createdAt: { gte: last24h } },
      }),
      this.prisma.auditLog.count({
        where: { createdAt: { gte: last7d } },
      }),
      this.prisma.auditLog.count({
        where: { createdAt: { gte: last30d } },
      }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        _count: true,
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['resourceType'],
        _count: true,
        orderBy: { _count: { resourceType: 'desc' } },
        take: 10,
      }),
      this.prisma.auditLog.groupBy({
        by: ['tenantId'],
        _count: true,
        orderBy: { _count: { tenantId: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      today,
      last7days,
      last30days,
      byAction: byAction.map((item) => ({
        action: item.action,
        count: item._count,
      })),
      byResource: byResource.map((item) => ({
        resourceType: item.resourceType,
        count: item._count,
      })),
      byTenant: byTenant.map((item) => ({
        tenantId: item.tenantId,
        count: item._count,
      })),
    };
  }
}
