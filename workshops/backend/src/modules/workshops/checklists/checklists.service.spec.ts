import { Test, TestingModule } from '@nestjs/testing';
import { ChecklistsService } from './checklists.service';
import { PrismaService } from '@database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import {
  CreateChecklistDto,
  ChecklistType,
  ChecklistEntityType,
  ChecklistStatus,
} from './dto';

describe('ChecklistsService', () => {
  let service: ChecklistsService;

  const mockTenantId = 'tenant-123';
  const mockChecklistId = 'checklist-123';
  const mockQuoteId = 'quote-123';

  const mockChecklist = {
    id: mockChecklistId,
    tenantId: mockTenantId,
    entityType: ChecklistEntityType.QUOTE,
    entityId: mockQuoteId,
    checklistType: ChecklistType.PRE_DIAGNOSIS,
    name: 'Checklist Pré-Diagnóstico',
    description: 'Checklist para verificação inicial',
    status: ChecklistStatus.PENDING,
    completedAt: null,
    completedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'item-1',
        checklistId: mockChecklistId,
        title: 'Verificar nível de óleo',
        description: 'Verificar se o nível está entre mínimo e máximo',
        isRequired: true,
        isCompleted: false,
        completedAt: null,
        notes: null,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'item-2',
        checklistId: mockChecklistId,
        title: 'Verificar pneus',
        description: 'Verificar pressão e estado dos pneus',
        isRequired: false,
        isCompleted: false,
        completedAt: null,
        notes: null,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  };

  const mockPrismaService = {
    checklist: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    checklistItem: {
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    quote: {
      findFirst: jest.fn(),
    },
    serviceOrder: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChecklistsService>(ChecklistsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateChecklistDto = {
      entityType: ChecklistEntityType.QUOTE,
      entityId: mockQuoteId,
      checklistType: ChecklistType.PRE_DIAGNOSIS,
      name: 'Checklist Pré-Diagnóstico',
      description: 'Checklist para verificação inicial',
      items: [
        {
          title: 'Verificar nível de óleo',
          description: 'Verificar se o nível está entre mínimo e máximo',
          isRequired: true,
          order: 0,
        },
      ],
    };

    it('deve criar um checklist com sucesso', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue({ id: mockQuoteId });
      mockPrismaService.checklist.create.mockResolvedValue(mockChecklist);

      const result = await service.create(mockTenantId, createDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockChecklistId);
      expect(result.name).toBe('Checklist Pré-Diagnóstico');
      expect(mockPrismaService.checklist.create).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se Quote não existir', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

      await expect(service.create(mockTenantId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar BadRequestException se tipo de checklist for incompatível com entidade', async () => {
      const invalidDto: CreateChecklistDto = {
        ...createDto,
        entityType: ChecklistEntityType.SERVICE_ORDER,
        checklistType: ChecklistType.PRE_DIAGNOSIS,
      };

      await expect(service.create(mockTenantId, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('deve listar checklists com paginação', async () => {
      const mockChecklists = [mockChecklist];
      mockPrismaService.$transaction.mockResolvedValue([mockChecklists, 1]);

      const filters = {
        page: 1,
        limit: 20,
      };

      const result = await service.findAll(mockTenantId, filters);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('deve filtrar checklists por tipo', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      const filters = {
        checklistType: ChecklistType.PRE_DIAGNOSIS,
        page: 1,
        limit: 20,
      };

      const result = await service.findAll(mockTenantId, filters);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(0);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve buscar um checklist por ID', async () => {
      mockPrismaService.checklist.findFirst.mockResolvedValue(mockChecklist);

      const result = await service.findOne(mockTenantId, mockChecklistId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockChecklistId);
      expect(mockPrismaService.checklist.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: mockChecklistId,
            tenantId: mockTenantId,
          },
        }),
      );
    });

    it('deve lançar NotFoundException se checklist não for encontrado', async () => {
      mockPrismaService.checklist.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, mockChecklistId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Checklist Atualizado',
    };

    it('deve atualizar um checklist com sucesso', async () => {
      const updatedChecklist = {
        ...mockChecklist,
        name: 'Checklist Atualizado',
      };
      mockPrismaService.checklist.findFirst.mockResolvedValue(mockChecklist);
      mockPrismaService.checklist.update.mockResolvedValue(updatedChecklist);

      const result = await service.update(
        mockTenantId,
        mockChecklistId,
        updateDto,
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('Checklist Atualizado');
      expect(mockPrismaService.checklist.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se checklist não for encontrado', async () => {
      mockPrismaService.checklist.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, mockChecklistId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se checklist já estiver completo', async () => {
      const completedChecklist = {
        ...mockChecklist,
        status: ChecklistStatus.COMPLETED,
      };
      mockPrismaService.checklist.findFirst.mockResolvedValue(
        completedChecklist,
      );

      await expect(
        service.update(mockTenantId, mockChecklistId, updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete', () => {
    const completeDto = {
      items: [
        {
          itemId: 'item-1',
          isCompleted: true,
          notes: 'Óleo verificado',
        },
      ],
    };

    it('deve completar um checklist com sucesso', async () => {
      const completedChecklist = {
        ...mockChecklist,
        status: ChecklistStatus.COMPLETED,
        items: [
          {
            ...mockChecklist.items[0],
            isCompleted: true,
            notes: 'Óleo verificado',
          },
        ],
      };
      mockPrismaService.checklist.findFirst
        .mockResolvedValueOnce(mockChecklist)
        .mockResolvedValueOnce({
          ...mockChecklist,
          items: [
            {
              ...mockChecklist.items[0],
              isCompleted: true,
            },
            mockChecklist.items[1],
          ],
        });
      mockPrismaService.checklistItem.update.mockResolvedValue({});
      mockPrismaService.checklist.update.mockResolvedValue(completedChecklist);

      const result = await service.complete(
        mockTenantId,
        mockChecklistId,
        completeDto,
        'user-123',
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.checklistItem.update).toHaveBeenCalled();
      expect(mockPrismaService.checklist.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se checklist não for encontrado', async () => {
      mockPrismaService.checklist.findFirst.mockResolvedValue(null);

      await expect(
        service.complete(
          mockTenantId,
          mockChecklistId,
          completeDto,
          'user-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se checklist já estiver completo', async () => {
      const completedChecklist = {
        ...mockChecklist,
        status: ChecklistStatus.COMPLETED,
      };
      mockPrismaService.checklist.findFirst.mockResolvedValue(
        completedChecklist,
      );

      await expect(
        service.complete(
          mockTenantId,
          mockChecklistId,
          completeDto,
          'user-123',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validate', () => {
    it('deve retornar true se todos os itens obrigatórios estiverem completos', async () => {
      const checklistWithCompletedItems = {
        ...mockChecklist,
        items: [
          {
            ...mockChecklist.items[0],
            isRequired: true,
            isCompleted: true,
          },
        ],
      };
      mockPrismaService.checklist.findFirst.mockResolvedValue(
        checklistWithCompletedItems,
      );

      const result = await service.validate(mockTenantId, mockChecklistId);

      expect(result).toBe(true);
    });

    it('deve retornar false se algum item obrigatório não estiver completo', async () => {
      mockPrismaService.checklist.findFirst.mockResolvedValue(mockChecklist);

      const result = await service.validate(mockTenantId, mockChecklistId);

      expect(result).toBe(false);
    });

    it('deve lançar NotFoundException se checklist não for encontrado', async () => {
      mockPrismaService.checklist.findFirst.mockResolvedValue(null);

      await expect(
        service.validate(mockTenantId, mockChecklistId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve remover um checklist com sucesso', async () => {
      mockPrismaService.checklist.findFirst.mockResolvedValue(mockChecklist);
      mockPrismaService.checklist.delete.mockResolvedValue(mockChecklist);

      await service.remove(mockTenantId, mockChecklistId);

      expect(mockPrismaService.checklist.delete).toHaveBeenCalledWith({
        where: { id: mockChecklistId },
      });
    });

    it('deve lançar NotFoundException se checklist não for encontrado', async () => {
      mockPrismaService.checklist.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(mockTenantId, mockChecklistId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
