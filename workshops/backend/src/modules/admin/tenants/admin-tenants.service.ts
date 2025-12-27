import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { EmailService } from '../../shared/email/email.service';
import { TenantsService } from '../../core/tenants/tenants.service';
import { CreateTenantDto } from '../../core/tenants/dto';

@Injectable()
export class AdminTenantsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private tenantsService: TenantsService,
  ) { }

  async create(createDto: CreateTenantDto) {
    return this.tenantsService.create(createDto);
  }

  async findAll(filters?: {
    status?: string;
    planId?: string;
    search?: string;
  }) {
    const where: Prisma.TenantWhereInput = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.planId) {
      where.subscription = {
        is: {
          planId: filters.planId,
        },
      };
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { subdomain: { contains: filters.search, mode: 'insensitive' } },
        { document: { contains: filters.search } },
      ];
    }

    const tenants = await this.prisma.tenant.findMany({
      where,
      include: {
        subscription: {
          include: {
            planRef: true,
          },
        },
        _count: {
          select: {
            users: true,
            customers: true,
            serviceOrders: true,
            quotes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants;
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            planRef: true,
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            customers: true,
            serviceOrders: true,
            quotes: true,
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    return tenant;
  }

  async getStats() {
    const [
      total,
      active,
      suspended,
      canceled,
      totalRevenue,
      activeSubscriptions,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { status: 'active' } }),
      this.prisma.tenant.count({ where: { status: 'suspended' } }),
      this.prisma.tenant.count({ where: { status: 'canceled' } }),
      this.prisma.invoice.aggregate({
        where: { status: 'paid' },
        _sum: { total: true },
      }),
      this.prisma.subscription.count({
        where: { status: 'active' },
      }),
    ]);

    return {
      total,
      active,
      suspended,
      canceled,
      totalRevenue: this.decimalToNumber(totalRevenue._sum?.total),
      activeSubscriptions,
    };
  }

  async activate(id: string) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'active' },
      include: {
        subscription: {
          include: { planRef: true },
        },
      },
    });

    return tenant;
  }

  async suspend(id: string) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'suspended' },
      include: {
        subscription: {
          include: { planRef: true },
        },
      },
    });

    return tenant;
  }

  async cancel(id: string) {
    const tenant = await this.prisma.tenant.update({
      where: { id },
      data: { status: 'canceled' },
      include: {
        subscription: {
          include: { planRef: true },
        },
      },
    });

    return tenant;
  }

  async updatePlan(id: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      throw new NotFoundException('Plano não encontrado');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { subscription: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.tenant.update({
        where: { id },
        data: { plan: plan.code },
      });

      if (tenant.subscription) {
        await tx.subscription.update({
          where: { id: tenant.subscription.id },
          data: {
            planId: plan.id,
            plan: plan.code,
          },
        });
      }
    });

    return this.prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: {
          include: { planRef: true },
        },
      },
    });
  }

  async getTenantUsers(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  async resetUserPassword(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { tenant: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado para este tenant');
    }

    const bcrypt = await import('bcrypt');
    const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Enviar e-mail com a nova senha
    const frontendUrl = process.env.FRONTEND_URL || 'https://app.mecanica365.com';
    const loginUrl = `${frontendUrl}/login?subdomain=${user.tenant.subdomain}`;

    await this.emailService.sendAdminPasswordResetEmail({
      to: user.email,
      name: user.name,
      tempPassword,
      loginUrl,
    });

    return {
      message: 'Senha resetada com sucesso. E-mail enviado ao usuário.',
      tempPassword,
    };
  }

  private decimalToNumber(value: Prisma.Decimal | null | undefined) {
    if (!value) {
      return 0;
    }

    return new Prisma.Decimal(value).toNumber();
  }
}
