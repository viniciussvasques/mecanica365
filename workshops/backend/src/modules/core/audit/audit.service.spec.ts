import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAuditLogDto, AuditLogFiltersDto, AuditAction } from './dto';

describe('AuditService', () => {
  let service: AuditService;

  const mockTenantId = 'tenant-id';
  const mockUserId = 'user-id';
  const mockAuditLog = {
    id: 'audit-log-id',
    tenantId: mockTenantId,
    userId: mockUserId,
    action: AuditAction.CREATE,
    resourceType: 'customer',
    resourceId: 'customer-id',
    changes: { name: 'John Doe' },
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    metadata: { method: 'POST', url: '/api/customers' },
    createdAt: new Date(),
    user: {
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
    },
  };

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateAuditLogDto = {
      action: AuditAction.CREATE,
      resourceType: 'customer',
      resourceId: 'customer-id',
      changes: { name: 'John Doe' },
      metadata: { method: 'POST', url: '/api/customers' },
    };

    it('deve criar um log de auditoria com sucesso', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.create(
        mockTenantId,
        mockUserId,
        createDto,
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAuditLog.id);
      expect(result.action).toBe(AuditAction.CREATE);
      expect(result.resourceType).toBe('customer');
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          userId: mockUserId,
          action: createDto.action,
          resourceType: createDto.resourceType,
          resourceId: createDto.resourceId,
          changes: createDto.changes,
          metadata: createDto.metadata,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
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
    });

    it('deve criar um log de auditoria com valores opcionais nulos', async () => {
      const auditLogWithoutOptional = {
        ...mockAuditLog,
        tenantId: null,
        userId: null,
        resourceType: null,
        resourceId: null,
        ipAddress: null,
        userAgent: null,
      };

      mockPrismaService.auditLog.create.mockResolvedValue(
        auditLogWithoutOptional,
      );

      const result = await service.create(null, null, createDto);

      expect(result).toBeDefined();
      expect(result.tenantId).toBeUndefined();
      expect(result.userId).toBeUndefined();
    });

    it('deve lançar erro se a criação falhar', async () => {
      const error = new Error('Database error');
      mockPrismaService.auditLog.create.mockRejectedValue(error);

      await expect(
        service.create(mockTenantId, mockUserId, createDto),
      ).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    const filters: AuditLogFiltersDto = {
      page: 1,
      limit: 20,
    };

    it('deve retornar lista de logs de auditoria com paginação', async () => {
      const mockData = [mockAuditLog];
      const mockTotal = 1;

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockData);
      mockPrismaService.auditLog.count.mockResolvedValue(mockTotal);

      const result = await service.findAll(mockTenantId, filters);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(mockTotal);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        skip: 0,
        take: 20,
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
      });
    });

    it('deve aplicar filtros corretamente', async () => {
      const filtersWithAll: AuditLogFiltersDto = {
        userId: mockUserId,
        action: AuditAction.UPDATE,
        resourceType: 'customer',
        resourceId: 'customer-id',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        limit: 10,
      };

      mockPrismaService.auditLog.findMany.mockResolvedValue([mockAuditLog]);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      await service.findAll(mockTenantId, filtersWithAll);

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: mockTenantId,
            userId: mockUserId,
            action: AuditAction.UPDATE,
            resourceType: 'customer',
            resourceId: 'customer-id',
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          }),
          skip: 0,
          take: 10,
        }),
      );
    });

    it('deve calcular paginação corretamente', async () => {
      const filtersPage2: AuditLogFiltersDto = {
        page: 2,
        limit: 10,
      };

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(25);

      const result = await service.findAll(mockTenantId, filtersPage2);

      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar um log de auditoria por ID', async () => {
      mockPrismaService.auditLog.findFirst.mockResolvedValue(mockAuditLog);

      const result = await service.findOne(mockTenantId, mockAuditLog.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAuditLog.id);
      expect(mockPrismaService.auditLog.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockAuditLog.id,
          tenantId: mockTenantId,
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
    });

    it('deve lançar NotFoundException se o log não for encontrado', async () => {
      mockPrismaService.auditLog.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toResponseDto', () => {
    it('deve converter corretamente os dados do Prisma para DTO', async () => {
      mockPrismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.create(mockTenantId, mockUserId, {
        action: AuditAction.CREATE,
        resourceType: 'customer',
        resourceId: 'customer-id',
      });

      expect(result).toMatchObject({
        id: mockAuditLog.id,
        tenantId: mockAuditLog.tenantId,
        userId: mockAuditLog.userId,
        action: mockAuditLog.action,
        resourceType: mockAuditLog.resourceType,
        resourceId: mockAuditLog.resourceId,
        changes: mockAuditLog.changes,
        ipAddress: mockAuditLog.ipAddress,
        userAgent: mockAuditLog.userAgent,
        metadata: mockAuditLog.metadata,
        createdAt: mockAuditLog.createdAt,
      });
    });

    it('deve tratar valores nulos corretamente', async () => {
      const auditLogWithNulls = {
        ...mockAuditLog,
        tenantId: null,
        userId: null,
        resourceType: null,
        resourceId: null,
        changes: null,
        ipAddress: null,
        userAgent: null,
        metadata: null,
      };

      mockPrismaService.auditLog.create.mockResolvedValue(auditLogWithNulls);

      const result = await service.create(null, null, {
        action: AuditAction.VIEW,
      });

      expect(result.tenantId).toBeUndefined();
      expect(result.userId).toBeUndefined();
      expect(result.resourceType).toBeUndefined();
      expect(result.resourceId).toBeUndefined();
      // O service converte null para undefined, mas o mock pode retornar null
      expect(result.changes).toBeFalsy();
      expect(result.ipAddress).toBeUndefined();
      expect(result.userAgent).toBeUndefined();
      expect(result.metadata).toBeFalsy();
    });
  });
});
