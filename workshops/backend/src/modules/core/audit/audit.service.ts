import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateAuditLogDto,
  AuditLogResponseDto,
  AuditLogFiltersDto,
  AuditAction,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um log de auditoria
   */
  async create(
    tenantId: string | null,
    userId: string | null,
    dto: CreateAuditLogDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLogResponseDto> {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          tenantId: tenantId || undefined,
          userId: userId || undefined,
          action: dto.action,
          resourceType: dto.resourceType || undefined,
          resourceId: dto.resourceId || undefined,
          changes: dto.changes as Prisma.InputJsonValue,
          metadata: dto.metadata as Prisma.InputJsonValue,
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return this.toResponseDto(auditLog);
    } catch (error) {
      this.logger.error(`Erro ao criar log de auditoria: ${error}`);
      throw error;
    }
  }

  /**
   * Lista logs de auditoria com filtros
   */
  async findAll(
    tenantId: string,
    filters: AuditLogFiltersDto,
  ): Promise<{
    data: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      userId,
      action,
      resourceType,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      ...(userId && { userId }),
      ...(action && { action }),
      ...(resourceType && { resourceType }),
      ...(resourceId && { resourceId }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

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
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: data.map((log) => this.toResponseDto(log)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Busca um log específico
   */
  async findOne(tenantId: string, id: string): Promise<AuditLogResponseDto> {
    const auditLog = await this.prisma.auditLog.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!auditLog) {
      throw new NotFoundException('Log de auditoria não encontrado');
    }

    return this.toResponseDto(auditLog);
  }

  /**
   * Converte Prisma AuditLog para DTO
   */
  private toResponseDto(
    auditLog: Prisma.AuditLogGetPayload<{
      include: { user: { select: { id: true; name: true; email: true } } };
    }>,
  ): AuditLogResponseDto {
    return {
      id: auditLog.id,
      tenantId: auditLog.tenantId || undefined,
      userId: auditLog.userId || undefined,
      action: auditLog.action as AuditAction,
      user: auditLog.user
        ? {
            id: auditLog.user.id,
            name: auditLog.user.name,
            email: auditLog.user.email,
          }
        : undefined,
      resourceType: auditLog.resourceType || undefined,
      resourceId: auditLog.resourceId || undefined,
      changes: auditLog.changes as Record<string, unknown> | undefined,
      ipAddress: auditLog.ipAddress || undefined,
      userAgent: auditLog.userAgent || undefined,
      metadata: auditLog.metadata as Record<string, unknown> | undefined,
      createdAt: auditLog.createdAt,
    };
  }
}
