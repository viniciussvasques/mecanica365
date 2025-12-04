import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PartsService } from './parts.service';
import { PrismaService } from '@database/prisma.service';
import { CreatePartDto, UpdatePartDto } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('PartsService', () => {
  let service: PartsService;

  const mockTenantId = 'tenant-id';
  const mockPartId = 'part-id';
  const mockSupplierId = 'supplier-id';

  const mockPart = {
    id: mockPartId,
    tenantId: mockTenantId,
    partNumber: 'PEC-001',
    name: 'Pastilha de Freio Dianteira',
    description: 'Pastilha de freio para eixo dianteiro',
    category: 'Freios',
    brand: 'Bosch',
    supplierId: mockSupplierId,
    quantity: 10,
    minQuantity: 5,
    costPrice: new Decimal(50.0),
    sellPrice: new Decimal(80.0),
    location: 'Estoque A - Prateleira 3',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    supplier: {
      id: mockSupplierId,
      name: 'Fornecedor ABC',
    },
  };

  const mockPrismaService = {
    part: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    serviceOrderPart: {
      findFirst: jest.fn(),
    },
    quoteItem: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PartsService>(PartsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createPartDto: CreatePartDto = {
      partNumber: 'PEC-001',
      name: 'Pastilha de Freio Dianteira',
      description: 'Pastilha de freio para eixo dianteiro',
      category: 'Freios',
      brand: 'Bosch',
      supplierId: mockSupplierId,
      quantity: 10,
      minQuantity: 5,
      costPrice: 50.0,
      sellPrice: 80.0,
      location: 'Estoque A - Prateleira 3',
      isActive: true,
    };

    it('deve criar uma peça com sucesso', async () => {
      // Mock: partNumber não existe
      mockPrismaService.part.findFirst.mockReset();
      mockPrismaService.part.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.part.create.mockResolvedValue(mockPart);

      const result = await service.create(mockTenantId, createPartDto);

      expect(result).toHaveProperty('id', mockPartId);
      expect(result).toHaveProperty('name', 'Pastilha de Freio Dianteira');
      expect(result).toHaveProperty('partNumber', 'PEC-001');
      expect(mockPrismaService.part.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          partNumber: createPartDto.partNumber,
        },
      });
      expect(mockPrismaService.part.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          partNumber: createPartDto.partNumber?.trim(),
          name: createPartDto.name.trim(),
          description: createPartDto.description?.trim(),
          category: createPartDto.category?.trim(),
          brand: createPartDto.brand?.trim(),
          supplierId: createPartDto.supplierId,
          quantity: createPartDto.quantity,
          minQuantity: createPartDto.minQuantity,
          costPrice: new Decimal(createPartDto.costPrice),
          sellPrice: new Decimal(createPartDto.sellPrice),
          location: createPartDto.location?.trim(),
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
    });

    it('deve criar uma peça sem partNumber', async () => {
      const dtoWithoutPartNumber = { ...createPartDto };
      delete dtoWithoutPartNumber.partNumber;

      mockPrismaService.part.create.mockResolvedValue({
        ...mockPart,
        partNumber: null,
      });

      const result = await service.create(mockTenantId, dtoWithoutPartNumber);

      expect(result).toHaveProperty('id', mockPartId);
      expect(mockPrismaService.part.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.part.create).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se partNumber já existe', async () => {
      mockPrismaService.part.findFirst.mockResolvedValueOnce(mockPart);

      await expect(service.create(mockTenantId, createPartDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.part.create).not.toHaveBeenCalled();
    });

    it('deve criar peça com valores padrão quando não fornecidos', async () => {
      const minimalDto: CreatePartDto = {
        name: 'Peça Teste',
        quantity: 0,
        minQuantity: 0,
        costPrice: 0,
        sellPrice: 0,
      };

      mockPrismaService.part.create.mockResolvedValue({
        ...mockPart,
        partNumber: null,
        description: null,
        category: null,
        brand: null,
        supplierId: null,
        location: null,
        quantity: 0,
        minQuantity: 0,
        isActive: true,
      });

      const result = await service.create(mockTenantId, minimalDto);

      expect(result).toHaveProperty('id');
      expect(mockPrismaService.part.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 0,
            minQuantity: 0,
            isActive: true,
          }),
        }),
      );
    });

    it('deve lidar com erros genéricos ao criar peça', async () => {
      mockPrismaService.part.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.part.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.create(mockTenantId, createPartDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('deve listar todas as peças com paginação', async () => {
      const filters = { page: 1, limit: 10 };
      const mockParts = [mockPart];
      const mockTotal = 1;

      mockPrismaService.part.findMany.mockResolvedValue(mockParts);
      mockPrismaService.part.count.mockResolvedValue(mockTotal);

      const result = await service.findAll(mockTenantId, filters);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', mockTotal);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(result).toHaveProperty('totalPages', 1);
      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.part.findMany).toHaveBeenCalled();
      expect(mockPrismaService.part.count).toHaveBeenCalled();
    });

    it('deve filtrar por busca (search)', async () => {
      const filters = { search: 'Pastilha' };
      const mockParts = [mockPart];

      mockPrismaService.part.findMany.mockResolvedValue(mockParts);
      mockPrismaService.part.count.mockResolvedValue(1);

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.part.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'Pastilha', mode: 'insensitive' } },
              {
                partNumber: {
                  contains: 'Pastilha',
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: 'Pastilha',
                  mode: 'insensitive',
                },
              },
            ]),
          }),
        }),
      );
    });

    it('deve filtrar por categoria', async () => {
      const filters = { category: 'Freios' };
      const mockParts = [mockPart];

      mockPrismaService.part.findMany.mockResolvedValue(mockParts);
      mockPrismaService.part.count.mockResolvedValue(1);

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.part.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: {
              contains: 'Freios',
              mode: 'insensitive',
            },
          }),
        }),
      );
    });

    it('deve filtrar por estoque baixo (lowStock)', async () => {
      const filters = { lowStock: true };
      const mockParts = [
        { ...mockPart, quantity: 3, minQuantity: 5 }, // Estoque baixo
        { ...mockPart, id: 'part-2', quantity: 10, minQuantity: 5 }, // Estoque normal
      ];

      mockPrismaService.part.findMany.mockResolvedValue(mockParts);
      mockPrismaService.part.count.mockResolvedValue(2);

      const result = await service.findAll(mockTenantId, filters);

      // Deve filtrar apenas peças com estoque baixo
      expect(result.data).toHaveLength(1);
      expect(result.data[0].quantity).toBeLessThanOrEqual(
        result.data[0].minQuantity,
      );
    });

    it('deve filtrar por isActive', async () => {
      const filters = { isActive: false };
      const mockParts = [{ ...mockPart, isActive: false }];

      mockPrismaService.part.findMany.mockResolvedValue(mockParts);
      mockPrismaService.part.count.mockResolvedValue(1);

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.part.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: false,
          }),
        }),
      );
    });

    it('deve filtrar por brand', async () => {
      const filters = { brand: 'Bosch' };
      const mockParts = [mockPart];

      mockPrismaService.part.findMany.mockResolvedValue(mockParts);
      mockPrismaService.part.count.mockResolvedValue(1);

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.part.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            brand: {
              contains: 'Bosch',
              mode: 'insensitive',
            },
          }),
        }),
      );
    });

    it('deve filtrar por supplierId', async () => {
      const filters = { supplierId: mockSupplierId };
      const mockParts = [mockPart];

      mockPrismaService.part.findMany.mockResolvedValue(mockParts);
      mockPrismaService.part.count.mockResolvedValue(1);

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.part.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            supplierId: mockSupplierId,
          }),
        }),
      );
    });

    it('deve lidar com erros ao listar peças', async () => {
      const filters = { page: 1, limit: 10 };
      mockPrismaService.part.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll(mockTenantId, filters)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar uma peça por ID', async () => {
      mockPrismaService.part.findFirst.mockResolvedValue(mockPart);

      const result = await service.findOne(mockTenantId, mockPartId);

      expect(result).toHaveProperty('id', mockPartId);
      expect(result).toHaveProperty('name', 'Pastilha de Freio Dianteira');
      expect(mockPrismaService.part.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockPartId,
          tenantId: mockTenantId,
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
    });

    it('deve lançar NotFoundException se peça não existe', async () => {
      mockPrismaService.part.findFirst.mockResolvedValue(null);

      await expect(service.findOne(mockTenantId, mockPartId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar NotFoundException se peça pertence a outro tenant', async () => {
      mockPrismaService.part.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('other-tenant-id', mockPartId),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lidar com erros genéricos ao buscar peça', async () => {
      mockPrismaService.part.findFirst.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findOne(mockTenantId, mockPartId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    const updatePartDto: UpdatePartDto = {
      name: 'Pastilha de Freio Atualizada',
      quantity: 15,
    };

    it('deve atualizar uma peça com sucesso', async () => {
      const updatedPart = {
        ...mockPart,
        name: 'Pastilha de Freio Atualizada',
        quantity: 15,
      };

      mockPrismaService.part.findFirst
        .mockResolvedValueOnce(mockPart) // Verificar se existe
        .mockResolvedValueOnce(null); // Verificar se partNumber duplicado (não há)
      mockPrismaService.part.update.mockResolvedValue(updatedPart);

      const result = await service.update(
        mockTenantId,
        mockPartId,
        updatePartDto,
      );

      expect(result).toHaveProperty('name', 'Pastilha de Freio Atualizada');
      expect(result).toHaveProperty('quantity', 15);
      expect(mockPrismaService.part.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se peça não existe', async () => {
      mockPrismaService.part.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, mockPartId, updatePartDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.part.update).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se partNumber duplicado', async () => {
      const updateWithPartNumber: UpdatePartDto = {
        partNumber: 'PEC-002',
      };

      mockPrismaService.part.findFirst
        .mockResolvedValueOnce(mockPart) // Verificar se existe
        .mockResolvedValueOnce({ ...mockPart, id: 'other-id' }); // PartNumber já existe

      await expect(
        service.update(mockTenantId, mockPartId, updateWithPartNumber),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.part.update).not.toHaveBeenCalled();
    });

    it('deve atualizar supplier conectando', async () => {
      const updateWithSupplier: UpdatePartDto = {
        supplierId: 'new-supplier-id',
      };

      mockPrismaService.part.findFirst.mockResolvedValueOnce(mockPart);
      mockPrismaService.part.update.mockResolvedValue({
        ...mockPart,
        supplierId: 'new-supplier-id',
      });

      await service.update(mockTenantId, mockPartId, updateWithSupplier);

      expect(mockPrismaService.part.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            supplier: { connect: { id: 'new-supplier-id' } },
          }),
        }),
      );
    });

    it('deve manter supplier quando supplierId não é fornecido', async () => {
      const updateWithoutSupplier: UpdatePartDto = {
        name: 'Nome Atualizado',
        // supplierId não é fornecido
      };

      mockPrismaService.part.findFirst.mockResolvedValueOnce(mockPart);
      mockPrismaService.part.update.mockResolvedValue({
        ...mockPart,
        name: 'Nome Atualizado',
      });

      await service.update(mockTenantId, mockPartId, updateWithoutSupplier);

      // Verificar que supplier não foi alterado (não deve ter disconnect ou connect)
      const updateCall = mockPrismaService.part.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('supplier');
    });

    it('deve desconectar supplier quando supplierId é string vazia', async () => {
      // Quando supplierId é string vazia, deve desconectar
      const updateWithEmptySupplier: UpdatePartDto = {
        supplierId: '',
      };

      mockPrismaService.part.findFirst.mockResolvedValueOnce(mockPart);
      mockPrismaService.part.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.part.update.mockResolvedValue({
        ...mockPart,
        supplierId: null,
        supplier: null,
      });

      await service.update(mockTenantId, mockPartId, updateWithEmptySupplier);

      expect(mockPrismaService.part.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            supplier: { disconnect: true },
          }),
        }),
      );
    });

    it('deve lidar com erros genéricos ao atualizar', async () => {
      // Resetar mock para garantir estado limpo
      mockPrismaService.part.findFirst.mockReset();
      // Primeiro findFirst retorna a peça (findPartByIdAndTenant)
      // Segundo findFirst retorna null (validatePartNumberUniqueness - não há duplicado)
      mockPrismaService.part.findFirst
        .mockResolvedValueOnce(mockPart) // findPartByIdAndTenant
        .mockResolvedValueOnce(null); // validatePartNumberUniqueness
      mockPrismaService.part.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.update(mockTenantId, mockPartId, updatePartDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deve deletar peça se não estiver sendo usada', async () => {
      // Resetar mock para garantir estado limpo
      mockPrismaService.part.findFirst.mockReset();
      mockPrismaService.part.findFirst.mockResolvedValue(mockPart);
      mockPrismaService.serviceOrderPart.findFirst.mockResolvedValue(null);
      mockPrismaService.quoteItem.findFirst.mockResolvedValue(null);
      mockPrismaService.part.delete.mockResolvedValue(mockPart);

      await service.remove(mockTenantId, mockPartId);

      expect(mockPrismaService.part.delete).toHaveBeenCalledWith({
        where: { id: mockPartId },
      });
      expect(mockPrismaService.part.update).not.toHaveBeenCalled();
    });

    it('deve marcar como inativa se estiver sendo usada em ServiceOrder', async () => {
      // Resetar mock para garantir estado limpo
      mockPrismaService.part.findFirst.mockReset();
      mockPrismaService.part.findFirst.mockResolvedValue(mockPart);
      mockPrismaService.serviceOrderPart.findFirst.mockResolvedValue({
        id: 'service-order-part-id',
      });
      mockPrismaService.quoteItem.findFirst.mockResolvedValue(null);
      mockPrismaService.part.update.mockResolvedValue({
        ...mockPart,
        isActive: false,
      });

      await service.remove(mockTenantId, mockPartId);

      expect(mockPrismaService.part.update).toHaveBeenCalledWith({
        where: { id: mockPartId },
        data: { isActive: false },
      });
      expect(mockPrismaService.part.delete).not.toHaveBeenCalled();
    });

    it('deve marcar como inativa se estiver sendo usada em Quote', async () => {
      mockPrismaService.part.findFirst.mockResolvedValue(mockPart);
      mockPrismaService.serviceOrderPart.findFirst.mockResolvedValue(null);
      mockPrismaService.quoteItem.findFirst.mockResolvedValue({
        id: 'quote-item-id',
      });
      mockPrismaService.part.update.mockResolvedValue({
        ...mockPart,
        isActive: false,
      });

      await service.remove(mockTenantId, mockPartId);

      expect(mockPrismaService.part.update).toHaveBeenCalledWith({
        where: { id: mockPartId },
        data: { isActive: false },
      });
      expect(mockPrismaService.part.delete).not.toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se peça não existe', async () => {
      mockPrismaService.part.findFirst.mockResolvedValue(null);

      await expect(service.remove(mockTenantId, mockPartId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lidar com erros genéricos ao remover peça', async () => {
      mockPrismaService.part.findFirst.mockResolvedValue(mockPart);
      mockPrismaService.serviceOrderPart.findFirst.mockResolvedValue(null);
      mockPrismaService.quoteItem.findFirst.mockResolvedValue(null);
      mockPrismaService.part.delete.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.remove(mockTenantId, mockPartId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('toResponseDto', () => {
    it('deve converter Part do Prisma para PartResponseDto corretamente', async () => {
      mockPrismaService.part.findFirst.mockResolvedValue(mockPart);

      const result = await service.findOne(mockTenantId, mockPartId);

      expect(result).toHaveProperty('id', mockPartId);
      expect(result).toHaveProperty('name', mockPart.name);
      expect(result).toHaveProperty('partNumber', mockPart.partNumber);
      expect(result).toHaveProperty('costPrice', 50.0);
      expect(result).toHaveProperty('sellPrice', 80.0);
      expect(result).toHaveProperty('supplier');
      expect(result.supplier).toHaveProperty('id', mockSupplierId);
      expect(result.supplier).toHaveProperty('name', 'Fornecedor ABC');
    });

    it('deve converter Decimal para number corretamente', async () => {
      const partWithDecimal = {
        ...mockPart,
        costPrice: new Decimal(123.45),
        sellPrice: new Decimal(234.56),
      };

      mockPrismaService.part.findFirst.mockResolvedValue(partWithDecimal);

      const result = await service.findOne(mockTenantId, mockPartId);

      expect(typeof result.costPrice).toBe('number');
      expect(typeof result.sellPrice).toBe('number');
      expect(result.costPrice).toBe(123.45);
      expect(result.sellPrice).toBe(234.56);
    });

    it('deve retornar undefined para campos opcionais null', async () => {
      const partWithNulls = {
        ...mockPart,
        partNumber: null,
        description: null,
        category: null,
        brand: null,
        supplierId: null,
        location: null,
        supplier: null,
      };

      mockPrismaService.part.findFirst.mockResolvedValue(partWithNulls);

      const result = await service.findOne(mockTenantId, mockPartId);

      expect(result.partNumber).toBeUndefined();
      expect(result.description).toBeUndefined();
      expect(result.category).toBeUndefined();
      expect(result.brand).toBeUndefined();
      expect(result.supplierId).toBeUndefined();
      expect(result.location).toBeUndefined();
      expect(result.supplier).toBeUndefined();
    });
  });
});
