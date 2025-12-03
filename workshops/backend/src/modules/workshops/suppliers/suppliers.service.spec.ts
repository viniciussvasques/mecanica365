import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { PrismaService } from '@database/prisma.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

describe('SuppliersService', () => {
  let service: SuppliersService;

  const mockTenantId = 'tenant-id';
  const mockSupplier = {
    id: 'supplier-id',
    tenantId: mockTenantId,
    name: 'Fornecedor ABC',
    documentType: 'cnpj',
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
      documentType: 'cnpj',
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
  });

  describe('remove', () => {
    it('deve remover fornecedor com sucesso', async () => {
      mockPrismaService.supplier.findFirst.mockResolvedValue(mockSupplier);
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
      mockPrismaService.supplier.findFirst.mockResolvedValue(mockSupplier);
      mockPrismaService.part.count.mockResolvedValue(5);

      await expect(
        service.remove(mockTenantId, 'supplier-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

