import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '@database/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';
import { DocumentType } from './dto/create-supplier.dto';

describe('SuppliersService', () => {
  let service: SuppliersService;

  const mockTenantId = 'tenant-id';
  const mockSupplier = {
    id: 'supplier-id',
    tenantId: mockTenantId,
    name: 'Fornecedor ABC',
    documentType: DocumentType.CNPJ,
    document: '12345678000190',
    phone: '(11) 98765-4321',
    email: 'contato@fornecedor.com',
    address: 'Rua das Empresas, 456',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    contactName: 'João Silva',
    notes: 'Fornecedor preferencial',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    supplier: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    part: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createSupplierDto: CreateSupplierDto = {
      name: 'Fornecedor ABC',
      documentType: DocumentType.CNPJ,
      document: '12345678000190',
      phone: '(11) 98765-4321',
      email: 'contato@fornecedor.com',
      address: 'Rua das Empresas, 456',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      contactName: 'João Silva',
      notes: 'Fornecedor preferencial',
      isActive: true,
    };

    it('deve criar um fornecedor com sucesso', async () => {
      mockPrismaService.supplier.findFirst.mockResolvedValue(null);
      mockPrismaService.supplier.create.mockResolvedValue(mockSupplier);

      const result = await service.create(mockTenantId, createSupplierDto);

      expect(result).toHaveProperty('id', 'supplier-id');
      expect(result).toHaveProperty('name', 'Fornecedor ABC');
      expect(mockPrismaService.supplier.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          name: createSupplierDto.name,
          documentType: 'cnpj',
          document: createSupplierDto.document,
          phone: createSupplierDto.phone,
          email: createSupplierDto.email,
          address: createSupplierDto.address,
          city: createSupplierDto.city,
          state: createSupplierDto.state,
          zipCode: createSupplierDto.zipCode,
          contactName: createSupplierDto.contactName,
          notes: createSupplierDto.notes,
          isActive: true,
        },
      });
    });

    it('deve lançar erro se documento já existe', async () => {
      mockPrismaService.supplier.findFirst.mockResolvedValue(mockSupplier);

      await expect(
        service.create(mockTenantId, createSupplierDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve criar fornecedor sem documento', async () => {
      const dtoWithoutDocument = { ...createSupplierDto };
      delete dtoWithoutDocument.document;

      mockPrismaService.supplier.create.mockResolvedValue({
        ...mockSupplier,
        document: null,
      });

      const result = await service.create(mockTenantId, dtoWithoutDocument);

      expect(result).toHaveProperty('id');
      expect(mockPrismaService.supplier.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.supplier.create).toHaveBeenCalled();
    });

    it('deve criar fornecedor com documentType padrão (cnpj)', async () => {
      const dtoWithoutDocumentType = { ...createSupplierDto };
      delete dtoWithoutDocumentType.documentType;

      mockPrismaService.supplier.findFirst.mockResolvedValue(null);
      mockPrismaService.supplier.create.mockResolvedValue(mockSupplier);

      await service.create(mockTenantId, dtoWithoutDocumentType);

      expect(mockPrismaService.supplier.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          documentType: 'cnpj',
        }),
      });
    });

    it('deve criar fornecedor com isActive padrão (true)', async () => {
      const dtoWithoutActive = { ...createSupplierDto };
      delete dtoWithoutActive.isActive;

      mockPrismaService.supplier.findFirst.mockResolvedValue(null);
      mockPrismaService.supplier.create.mockResolvedValue(mockSupplier);

      await service.create(mockTenantId, dtoWithoutActive);

      expect(mockPrismaService.supplier.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isActive: true,
        }),
      });
    });

    it('deve lidar com erros genéricos ao criar fornecedor', async () => {
      mockPrismaService.supplier.findFirst.mockResolvedValue(null);
      mockPrismaService.supplier.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.create(mockTenantId, createSupplierDto),
      ).rejects.toThrow(Error);
    });
  });

  describe('findAll', () => {
    it('deve listar fornecedores com sucesso', async () => {
      mockPrismaService.supplier.findMany.mockResolvedValue([mockSupplier]);
      mockPrismaService.supplier.count.mockResolvedValue(1);

      const result = await service.findAll(mockTenantId, {});

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('deve aplicar filtros corretamente', async () => {
      mockPrismaService.supplier.findMany.mockResolvedValue([mockSupplier]);
      mockPrismaService.supplier.count.mockResolvedValue(1);

      const filters = {
        search: 'ABC',
        isActive: true,
        city: 'São Paulo',
        page: 1,
        limit: 10,
      };

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tenantId: mockTenantId,
          OR: expect.any(Array),
          isActive: true,
          city: expect.objectContaining({ contains: 'São Paulo' }),
        }),
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('deve filtrar por state', async () => {
      mockPrismaService.supplier.findMany.mockResolvedValue([mockSupplier]);
      mockPrismaService.supplier.count.mockResolvedValue(1);

      const filters = { state: 'SP' };

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          state: 'SP',
        }),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('deve filtrar por período (startDate e endDate)', async () => {
      mockPrismaService.supplier.findMany.mockResolvedValue([mockSupplier]);
      mockPrismaService.supplier.count.mockResolvedValue(1);

      const startDate = '2024-01-01';
      const endDate = '2024-12-31';
      const filters = { startDate, endDate };

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('deve limitar máximo de 100 itens por página', async () => {
      mockPrismaService.supplier.findMany.mockResolvedValue([mockSupplier]);
      mockPrismaService.supplier.count.mockResolvedValue(1);

      const filters = { limit: 200 }; // Tentar passar 200

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        skip: 0,
        take: 100, // Deve limitar a 100
        orderBy: { createdAt: 'desc' },
      });
    });

    it('deve calcular paginação corretamente', async () => {
      mockPrismaService.supplier.findMany.mockResolvedValue([mockSupplier]);
      mockPrismaService.supplier.count.mockResolvedValue(25);

      const filters = { page: 2, limit: 10 };

      const result = await service.findAll(mockTenantId, filters);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3); // 25 / 10 = 2.5, arredondado para 3
      expect(mockPrismaService.supplier.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        skip: 10, // (2 - 1) * 10
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('deve lidar com erros ao listar fornecedores', async () => {
      mockPrismaService.supplier.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll(mockTenantId, {})).rejects.toThrow(Error);
    });
  });

  describe('findOne', () => {
    it('deve buscar fornecedor por ID com sucesso', async () => {
      mockPrismaService.supplier.findFirst.mockResolvedValue(mockSupplier);

      const result = await service.findOne(mockTenantId, 'supplier-id');

      expect(result).toHaveProperty('id', 'supplier-id');
      expect(result).toHaveProperty('name', 'Fornecedor ABC');
    });

    it('deve lançar erro se fornecedor não encontrado', async () => {
      mockPrismaService.supplier.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lidar com erros genéricos ao buscar fornecedor', async () => {
      mockPrismaService.supplier.findFirst.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.findOne(mockTenantId, 'supplier-id'),
      ).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    const updateSupplierDto: UpdateSupplierDto = {
      name: 'Fornecedor XYZ',
      phone: '(11) 99999-9999',
    };

    it('deve atualizar fornecedor com sucesso', async () => {
      mockPrismaService.supplier.findFirst
        .mockResolvedValueOnce(mockSupplier)
        .mockResolvedValueOnce(null);
      mockPrismaService.supplier.update.mockResolvedValue({
        ...mockSupplier,
        ...updateSupplierDto,
      });

      const result = await service.update(
        mockTenantId,
        'supplier-id',
        updateSupplierDto,
      );

      expect(result).toHaveProperty('name', 'Fornecedor XYZ');
      expect(mockPrismaService.supplier.update).toHaveBeenCalled();
    });

    it('deve lançar erro se fornecedor não encontrado', async () => {
      mockPrismaService.supplier.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'non-existent', updateSupplierDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se documento duplicado no update', async () => {
      const updateWithDocument: UpdateSupplierDto = {
        document: '99999999000199',
      };

      mockPrismaService.supplier.findFirst
        .mockResolvedValueOnce(mockSupplier) // findSupplierByIdAndTenant
        .mockResolvedValueOnce({ ...mockSupplier, id: 'other-id' }); // validateDocumentUniqueness

      await expect(
        service.update(mockTenantId, 'supplier-id', updateWithDocument),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve atualizar sem validar documento se não foi alterado', async () => {
      const updateWithoutDocumentChange: UpdateSupplierDto = {
        name: 'Nome Atualizado',
        document: mockSupplier.document, // Mesmo documento
      };

      mockPrismaService.supplier.findFirst.mockResolvedValueOnce(mockSupplier);
      mockPrismaService.supplier.update.mockResolvedValue({
        ...mockSupplier,
        name: 'Nome Atualizado',
      });

      await service.update(
        mockTenantId,
        'supplier-id',
        updateWithoutDocumentChange,
      );

      // Deve chamar findFirst apenas uma vez (findSupplierByIdAndTenant)
      expect(mockPrismaService.supplier.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.supplier.update).toHaveBeenCalled();
    });

    it('deve lidar com erros genéricos ao atualizar fornecedor', async () => {
      mockPrismaService.supplier.findFirst.mockResolvedValueOnce(mockSupplier);
      mockPrismaService.supplier.findFirst.mockResolvedValueOnce(null);
      mockPrismaService.supplier.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.update(mockTenantId, 'supplier-id', updateSupplierDto),
      ).rejects.toThrow(Error);
    });
  });

  describe('remove', () => {
    it('deve remover fornecedor com sucesso', async () => {
      // Resetar mock antes de configurar
      mockPrismaService.supplier.findFirst.mockReset();
      // findSupplierByIdAndTenant chama findFirst com select { id, document }
      mockPrismaService.supplier.findFirst.mockResolvedValue({
        id: 'supplier-id',
        document: '12345678000190',
      });
      mockPrismaService.part.count.mockResolvedValue(0);
      mockPrismaService.supplier.delete.mockResolvedValue(mockSupplier);

      await service.remove(mockTenantId, 'supplier-id');

      expect(mockPrismaService.supplier.delete).toHaveBeenCalledWith({
        where: { id: 'supplier-id' },
      });
    });

    it('deve lançar erro se fornecedor não encontrado', async () => {
      mockPrismaService.supplier.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se fornecedor tem peças vinculadas', async () => {
      mockPrismaService.supplier.findFirst.mockReset();
      mockPrismaService.supplier.findFirst.mockResolvedValue({
        id: 'supplier-id',
        document: '12345678000190',
      });
      mockPrismaService.part.count.mockResolvedValue(5);

      await expect(service.remove(mockTenantId, 'supplier-id')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lidar com erros genéricos ao remover fornecedor', async () => {
      mockPrismaService.supplier.findFirst.mockReset();
      mockPrismaService.supplier.findFirst.mockResolvedValue({
        id: 'supplier-id',
        document: '12345678000190',
      });
      mockPrismaService.part.count.mockResolvedValue(0);
      mockPrismaService.supplier.delete.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.remove(mockTenantId, 'supplier-id')).rejects.toThrow(
        Error,
      );
    });
  });

  describe('toResponseDto', () => {
    it('deve converter fornecedor completo para DTO', async () => {
      mockPrismaService.supplier.findFirst.mockResolvedValue(mockSupplier);

      const result = await service.findOne(mockTenantId, 'supplier-id');

      expect(result).toHaveProperty('id', 'supplier-id');
      expect(result).toHaveProperty('name', 'Fornecedor ABC');
      expect(result).toHaveProperty('documentType', DocumentType.CNPJ);
      expect(result).toHaveProperty('document', '12345678000190');
      expect(result).toHaveProperty('phone', '(11) 98765-4321');
      expect(result).toHaveProperty('email', 'contato@fornecedor.com');
    });

    it('deve converter campos null para undefined', async () => {
      const supplierWithNulls = {
        ...mockSupplier,
        document: null,
        phone: null,
        email: null,
        address: null,
        city: null,
        state: null,
        zipCode: null,
        contactName: null,
        notes: null,
        documentType: null,
      };

      mockPrismaService.supplier.findFirst.mockResolvedValue(supplierWithNulls);

      const result = await service.findOne(mockTenantId, 'supplier-id');

      expect(result.document).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.address).toBeUndefined();
      expect(result.city).toBeUndefined();
      expect(result.state).toBeUndefined();
      expect(result.zipCode).toBeUndefined();
      expect(result.contactName).toBeUndefined();
      expect(result.notes).toBeUndefined();
      expect(result.documentType).toBeUndefined();
    });
  });
});
