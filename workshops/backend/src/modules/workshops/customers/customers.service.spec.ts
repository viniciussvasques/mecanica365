import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { PrismaService } from '@database/prisma.service';
import { CreateCustomerDto, UpdateCustomerDto, DocumentType } from './dto';

describe('CustomersService', () => {
  let service: CustomersService;

  const mockTenantId = 'tenant-id';
  const mockCustomer = {
    id: 'customer-id',
    tenantId: mockTenantId,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '(11) 98765-4321',
    documentType: 'cpf',
    cpf: '11144477735', // CPF válido para testes
    cnpj: null,
    address: 'Rua das Flores, 123',
    notes: 'Cliente preferencial',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    customer: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCustomerDto: CreateCustomerDto = {
      name: 'João Silva',
      email: 'joao.silva@email.com',
      phone: '(11) 98765-4321',
      cpf: '11144477735', // CPF válido para testes
      address: 'Rua das Flores, 123',
      notes: 'Cliente preferencial',
    };

    it('deve criar um cliente com sucesso', async () => {
      // Mock das verificações: telefone e CPF não existem
      mockPrismaService.customer.findFirst
        .mockResolvedValueOnce(null) // Telefone não existe
        .mockResolvedValueOnce(null); // CPF não existe
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);

      const result = await service.create(mockTenantId, createCustomerDto);

      expect(result).toHaveProperty('id', 'customer-id');
      expect(result).toHaveProperty('name', 'João Silva');
      expect(result).toHaveProperty('email', 'joao.silva@email.com');
      expect(mockPrismaService.customer.findFirst).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.customer.findFirst).toHaveBeenNthCalledWith(1, {
        where: {
          tenantId: mockTenantId,
          phone: createCustomerDto.phone,
        },
      });
      expect(mockPrismaService.customer.findFirst).toHaveBeenNthCalledWith(2, {
        where: {
          tenantId: mockTenantId,
          cpf: createCustomerDto.cpf,
        },
      });
      expect(mockPrismaService.customer.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          name: createCustomerDto.name.trim(),
          email: createCustomerDto.email?.trim() || null,
          phone: createCustomerDto.phone.trim(),
          documentType: 'cpf',
          cpf: createCustomerDto.cpf?.trim() || null,
          cnpj: null,
          address: createCustomerDto.address?.trim() || null,
          notes: createCustomerDto.notes?.trim() || null,
        },
      });
    });

    it('deve criar cliente sem CPF quando documentType não for CPF', async () => {
      const dtoWithoutCpf: CreateCustomerDto = {
        name: 'Maria Santos',
        phone: '(11) 98765-4322',
        email: 'maria@email.com',
        documentType: DocumentType.CNPJ,
        cnpj: '11222333000181', // CNPJ válido
      };

      // Mock das verificações: telefone e CNPJ não existem
      mockPrismaService.customer.findFirst
        .mockResolvedValueOnce(null) // Telefone não existe
        .mockResolvedValueOnce(null); // CNPJ não existe
      mockPrismaService.customer.create.mockResolvedValue({
        ...mockCustomer,
        cpf: null,
        cnpj: '11222333000181',
        documentType: 'cnpj',
      });

      const result = await service.create(mockTenantId, dtoWithoutCpf);

      expect(result).toHaveProperty('id');
      expect(mockPrismaService.customer.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          name: dtoWithoutCpf.name.trim(),
          email: dtoWithoutCpf.email?.trim() || null,
          phone: dtoWithoutCpf.phone.trim(),
          documentType: 'cnpj',
          cpf: null,
          cnpj: dtoWithoutCpf.cnpj?.trim() || null,
          address: null,
          notes: null,
        },
      });
    });

    it('deve lançar ConflictException se telefone já existe', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);

      await expect(
        service.create(mockTenantId, createCustomerDto),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.customer.create).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException se CPF já existe', async () => {
      mockPrismaService.customer.findFirst
        .mockResolvedValueOnce(null) // Telefone não existe
        .mockResolvedValueOnce(mockCustomer); // CPF existe

      await expect(
        service.create(mockTenantId, createCustomerDto),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.customer.create).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se CPF inválido', async () => {
      const dtoWithInvalidCpf: CreateCustomerDto = {
        ...createCustomerDto,
        cpf: '12345678900', // CPF inválido (dígitos verificadores incorretos)
      };

      await expect(
        service.create(mockTenantId, dtoWithInvalidCpf),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.customer.create).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se CPF com todos dígitos iguais', async () => {
      const dtoWithInvalidCpf: CreateCustomerDto = {
        ...createCustomerDto,
        cpf: '11111111111', // Todos dígitos iguais
      };

      await expect(
        service.create(mockTenantId, dtoWithInvalidCpf),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('deve listar clientes com sucesso', async () => {
      const filters = { page: 1, limit: 20 };
      const mockCustomers = [mockCustomer];

      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);
      mockPrismaService.customer.count.mockResolvedValue(1);

      const result = await service.findAll(mockTenantId, filters);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 20);
      expect(result).toHaveProperty('totalPages', 1);
      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('deve aplicar filtro por nome', async () => {
      const filters = { name: 'João', page: 1, limit: 20 };

      mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);
      mockPrismaService.customer.count.mockResolvedValue(1);

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          name: {
            contains: 'João',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('deve aplicar filtro por telefone', async () => {
      const filters = { phone: '98765', page: 1, limit: 20 };

      mockPrismaService.customer.findMany.mockResolvedValue([mockCustomer]);
      mockPrismaService.customer.count.mockResolvedValue(1);

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          phone: {
            contains: '98765',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
      });
    });

    it('deve aplicar paginação corretamente', async () => {
      const filters = { page: 2, limit: 10 };

      mockPrismaService.customer.findMany.mockResolvedValue([]);
      mockPrismaService.customer.count.mockResolvedValue(25);

      const result = await service.findAll(mockTenantId, filters);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
      expect(mockPrismaService.customer.findMany).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        skip: 10, // (page - 1) * limit
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('deve buscar cliente por ID com sucesso', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);

      const result = await service.findOne(mockTenantId, 'customer-id');

      expect(result).toHaveProperty('id', 'customer-id');
      expect(result).toHaveProperty('name', 'João Silva');
      expect(mockPrismaService.customer.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'customer-id',
          tenantId: mockTenantId,
        },
      });
    });

    it('deve lançar NotFoundException se cliente não encontrado', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateCustomerDto: UpdateCustomerDto = {
      name: 'João Silva Santos',
      email: 'joao.santos@email.com',
    };

    it('deve atualizar cliente com sucesso', async () => {
      mockPrismaService.customer.findFirst
        .mockResolvedValueOnce(mockCustomer) // Cliente existe
        .mockResolvedValueOnce(null); // Telefone não conflita
      mockPrismaService.customer.update.mockResolvedValue({
        ...mockCustomer,
        ...updateCustomerDto,
      });

      const result = await service.update(
        mockTenantId,
        'customer-id',
        updateCustomerDto,
      );

      expect(result).toHaveProperty('name', 'João Silva Santos');
      expect(mockPrismaService.customer.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se cliente não encontrado', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'non-existent-id', updateCustomerDto),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.customer.update).not.toHaveBeenCalled();
    });

    it('deve lançar ConflictException se telefone já existe em outro cliente', async () => {
      const updateDto: UpdateCustomerDto = {
        phone: '(11) 98765-9999',
      };

      mockPrismaService.customer.findFirst
        .mockResolvedValueOnce(mockCustomer) // Cliente existe
        .mockResolvedValueOnce({ ...mockCustomer, id: 'other-id' }); // Telefone já existe

      await expect(
        service.update(mockTenantId, 'customer-id', updateDto),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.customer.update).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se CPF inválido', async () => {
      const updateDto: UpdateCustomerDto = {
        cpf: '12345678900', // CPF inválido
      };

      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);

      await expect(
        service.update(mockTenantId, 'customer-id', updateDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deve remover cliente com sucesso', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        serviceOrders: [],
        invoices: [],
        appointments: [],
      });
      mockPrismaService.customer.delete.mockResolvedValue(mockCustomer);

      await service.remove(mockTenantId, 'customer-id');

      expect(mockPrismaService.customer.delete).toHaveBeenCalledWith({
        where: { id: 'customer-id' },
      });
    });

    it('deve lançar NotFoundException se cliente não encontrado', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(mockTenantId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.customer.delete).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se cliente tem ordens de serviço', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        serviceOrders: [{ id: 'os-id' }],
        invoices: [],
        appointments: [],
      });

      await expect(service.remove(mockTenantId, 'customer-id')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.customer.delete).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se cliente tem faturas', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        serviceOrders: [],
        invoices: [{ id: 'invoice-id' }],
        appointments: [],
      });

      await expect(service.remove(mockTenantId, 'customer-id')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.customer.delete).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se cliente tem agendamentos', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        ...mockCustomer,
        serviceOrders: [],
        invoices: [],
        appointments: [{ id: 'appointment-id' }],
      });

      await expect(service.remove(mockTenantId, 'customer-id')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.customer.delete).not.toHaveBeenCalled();
    });
  });

  describe('isValidCPF', () => {
    it('deve validar CPF válido', async () => {
      // CPF válido: 11144477735 (dígitos verificadores corretos)
      const validCpf = '11144477735';
      const dto: CreateCustomerDto = {
        name: 'Test',
        phone: '(11) 98765-4321',
        cpf: validCpf,
      };

      mockPrismaService.customer.findFirst.mockResolvedValue(null);
      mockPrismaService.customer.create.mockResolvedValue({
        ...mockCustomer,
        cpf: validCpf,
      });

      const result = await service.create(mockTenantId, dto);
      expect(result).toHaveProperty('id');
      expect(mockPrismaService.customer.create).toHaveBeenCalled();
    });

    it('deve rejeitar CPF com dígitos verificadores incorretos', async () => {
      const invalidCpf = '11144477700'; // Dígitos verificadores incorretos
      const dto: CreateCustomerDto = {
        name: 'Test',
        phone: '(11) 98765-4321',
        cpf: invalidCpf,
      };

      await expect(service.create(mockTenantId, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
