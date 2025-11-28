import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../../../database/prisma.service';
import { CreateTenantDto, TenantPlan, TenantStatus, DocumentType } from './dto';

describe('TenantsService', () => {
  let service: TenantsService;
  let prismaService: PrismaService;

  const mockTenant = {
    id: 'tenant-id',
    name: 'Oficina Teste',
    documentType: 'cnpj',
    document: '11222333000181', // CNPJ válido para testes
    subdomain: 'oficina-teste',
    plan: TenantPlan.WORKSHOPS_STARTER,
    status: TenantStatus.ACTIVE,
    subscription: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTenantDto: CreateTenantDto = {
      name: 'Oficina Teste',
      documentType: DocumentType.CNPJ,
      document: '11222333000181', // CNPJ válido para testes
      subdomain: 'oficina-teste',
      plan: TenantPlan.WORKSHOPS_STARTER,
      status: TenantStatus.PENDING,
    };

    it('deve criar um tenant com sucesso', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue(mockTenant);

      const result = await service.create(createTenantDto);

      expect(result).toHaveProperty('id', 'tenant-id');
      expect(result).toHaveProperty('name', 'Oficina Teste');
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.tenant.create).toHaveBeenCalled();
    });

    it('deve lançar ConflictException se CNPJ já existe', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      await expect(service.create(createTenantDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve lançar ConflictException se subdomain já existe', async () => {
      mockPrismaService.tenant.findUnique
        .mockResolvedValueOnce(null) // Primeira chamada (CNPJ) - não existe
        .mockResolvedValueOnce(mockTenant); // Segunda chamada (subdomain) - existe

      await expect(service.create(createTenantDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('deve normalizar subdomain para lowercase', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);
      mockPrismaService.tenant.create.mockResolvedValue(mockTenant);

      const dtoWithUppercase = {
        ...createTenantDto,
        subdomain: 'OFICINA-TESTE',
      };
      await service.create(dtoWithUppercase);

      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { subdomain: 'oficina-teste' },
      });
    });

    it('deve lançar BadRequestException se documento inválido', async () => {
      const dtoWithInvalidDocument = { ...createTenantDto, document: '123' };
      await expect(service.create(dtoWithInvalidDocument)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de tenants', async () => {
      mockPrismaService.tenant.findMany.mockResolvedValue([mockTenant]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrismaService.tenant.findMany).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('deve retornar um tenant', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findOne('tenant-id');

      expect(result).toHaveProperty('id', 'tenant-id');
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-id' },
        include: { subscription: true },
      });
    });

    it('deve lançar NotFoundException se tenant não existe', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findBySubdomain', () => {
    it('deve retornar tenant por subdomain', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const result = await service.findBySubdomain('oficina-teste');

      expect(result).toHaveProperty('subdomain', 'oficina-teste');
      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { subdomain: 'oficina-teste' },
        include: { subscription: true },
      });
    });

    it('deve normalizar subdomain para lowercase', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      await service.findBySubdomain('OFICINA-TESTE');

      expect(mockPrismaService.tenant.findUnique).toHaveBeenCalledWith({
        where: { subdomain: 'oficina-teste' },
        include: { subscription: true },
      });
    });
  });

  describe('update', () => {
    it('deve atualizar um tenant com sucesso', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        name: 'Nome Atualizado',
      });

      const result = await service.update('tenant-id', {
        name: 'Nome Atualizado',
      });

      expect(result.name).toBe('Nome Atualizado');
      expect(mockPrismaService.tenant.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se tenant não existe', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('activate', () => {
    it('deve ativar um tenant', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.ACTIVE,
      });

      const result = await service.activate('tenant-id');

      expect(result.status).toBe(TenantStatus.ACTIVE);
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-id' },
        data: { status: 'active' },
        include: { subscription: true },
      });
    });
  });

  describe('suspend', () => {
    it('deve suspender um tenant', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.SUSPENDED,
      });

      const result = await service.suspend('tenant-id');

      expect(result.status).toBe(TenantStatus.SUSPENDED);
    });
  });

  describe('cancel', () => {
    it('deve cancelar um tenant', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        status: TenantStatus.CANCELLED,
      });

      const result = await service.cancel('tenant-id');

      expect(result.status).toBe(TenantStatus.CANCELLED);
    });
  });
});
