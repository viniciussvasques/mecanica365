import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { PrismaService } from '@database/prisma.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
} from './dto';

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    customer: {
      findFirst: jest.fn(),
    },
    customerVehicle: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCustomer = {
    id: 'customer-1',
    tenantId: 'tenant-1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 98765-4321',
    cpf: '12345678901',
    address: 'Rua Teste, 123',
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVehicle = {
    id: 'vehicle-1',
    customerId: 'customer-1',
    vin: '1HGBH41JXMN109186',
    renavan: '12345678901',
    placa: 'ABC1234',
    make: 'Honda',
    model: 'Civic',
    year: 2020,
    color: 'Branco',
    mileage: 50000,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createVehicleDto: CreateVehicleDto = {
      customerId: 'customer-1',
      vin: '1HGBH41JXMN109186',
      renavan: '12345678901',
      placa: 'ABC1234',
      make: 'Honda',
      model: 'Civic',
      year: 2020,
      color: 'Branco',
      mileage: 50000,
      isDefault: false,
    };

    it('deve criar veículo com sucesso', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.customerVehicle.findFirst
        .mockResolvedValueOnce(null) // RENAVAN não existe
        .mockResolvedValueOnce(null) // VIN não existe
        .mockResolvedValueOnce(null); // Placa não existe
      mockPrismaService.customerVehicle.create.mockResolvedValue(mockVehicle);

      const result = await service.create('tenant-1', createVehicleDto);

      expect(result).toMatchObject({
        id: mockVehicle.id,
        customerId: mockVehicle.customerId,
        vin: mockVehicle.vin,
        renavan: mockVehicle.renavan,
        placa: mockVehicle.placa,
      });
      expect(mockPrismaService.customer.findFirst).toHaveBeenCalledWith({
        where: {
          id: createVehicleDto.customerId,
          tenantId: 'tenant-1',
        },
      });
      expect(mockPrismaService.customerVehicle.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se cliente não existir', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.create('tenant-1', createVehicleDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se nenhum identificador for fornecido', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);

      const dtoWithoutIdentifiers: CreateVehicleDto = {
        customerId: 'customer-1',
        make: 'Honda',
        model: 'Civic',
      };

      await expect(
        service.create('tenant-1', dtoWithoutIdentifiers),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ConflictException se RENAVAN já existir', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(mockVehicle);

      await expect(
        service.create('tenant-1', createVehicleDto),
      ).rejects.toThrow(ConflictException);
    });

    it('deve marcar outros veículos como não padrão quando isDefault for true', async () => {
      const dtoWithDefault: CreateVehicleDto = {
        ...createVehicleDto,
        isDefault: true,
      };

      mockPrismaService.customer.findFirst.mockResolvedValue(mockCustomer);
      mockPrismaService.customerVehicle.findFirst
        .mockResolvedValueOnce(null) // RENAVAN não existe
        .mockResolvedValueOnce(null) // VIN não existe
        .mockResolvedValueOnce(null); // Placa não existe
      mockPrismaService.customerVehicle.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.customerVehicle.create.mockResolvedValue({
        ...mockVehicle,
        isDefault: true,
      });

      await service.create('tenant-1', dtoWithDefault);

      expect(mockPrismaService.customerVehicle.updateMany).toHaveBeenCalledWith({
        where: {
          customerId: createVehicleDto.customerId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    });
  });

  describe('findAll', () => {
    it('deve listar veículos com paginação', async () => {
      const filters = {
        page: 1,
        limit: 20,
      };

      mockPrismaService.customerVehicle.findMany.mockResolvedValue([mockVehicle]);
      mockPrismaService.customerVehicle.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-1', filters);

      expect(result).toMatchObject({
        data: expect.any(Array),
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      expect(mockPrismaService.customerVehicle.findMany).toHaveBeenCalled();
      expect(mockPrismaService.customerVehicle.count).toHaveBeenCalled();
    });

    it('deve filtrar por customerId', async () => {
      const filters = {
        customerId: 'customer-1',
        page: 1,
        limit: 20,
      };

      mockPrismaService.customerVehicle.findMany.mockResolvedValue([mockVehicle]);
      mockPrismaService.customerVehicle.count.mockResolvedValue(1);

      await service.findAll('tenant-1', filters);

      expect(mockPrismaService.customerVehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            customerId: 'customer-1',
          }),
        }),
      );
    });

    it('deve filtrar por placa', async () => {
      const filters = {
        placa: 'ABC',
        page: 1,
        limit: 20,
      };

      mockPrismaService.customerVehicle.findMany.mockResolvedValue([mockVehicle]);
      mockPrismaService.customerVehicle.count.mockResolvedValue(1);

      await service.findAll('tenant-1', filters);

      expect(mockPrismaService.customerVehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            placa: expect.objectContaining({
              contains: 'ABC',
              mode: 'insensitive',
            }),
          }),
        }),
      );
    });

    it('deve filtrar por RENAVAN', async () => {
      const filters = {
        renavan: '123456',
        page: 1,
        limit: 20,
      };

      mockPrismaService.customerVehicle.findMany.mockResolvedValue([mockVehicle]);
      mockPrismaService.customerVehicle.count.mockResolvedValue(1);

      await service.findAll('tenant-1', filters);

      expect(mockPrismaService.customerVehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            renavan: expect.objectContaining({
              contains: '123456',
            }),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar veículo encontrado', async () => {
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(mockVehicle);

      const result = await service.findOne('tenant-1', 'vehicle-1');

      expect(result).toMatchObject({
        id: mockVehicle.id,
        customerId: mockVehicle.customerId,
      });
      expect(mockPrismaService.customerVehicle.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'vehicle-1',
          customer: {
            tenantId: 'tenant-1',
          },
        },
        include: expect.any(Object),
      });
    });

    it('deve lançar NotFoundException se veículo não existir', async () => {
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('tenant-1', 'vehicle-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateVehicleDto: UpdateVehicleDto = {
      make: 'Toyota',
      model: 'Corolla',
    };

    it('deve atualizar veículo com sucesso', async () => {
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(mockVehicle);
      mockPrismaService.customerVehicle.update.mockResolvedValue({
        ...mockVehicle,
        ...updateVehicleDto,
      });

      const result = await service.update('tenant-1', 'vehicle-1', updateVehicleDto);

      expect(result).toMatchObject({
        id: mockVehicle.id,
        make: 'Toyota',
        model: 'Corolla',
      });
      expect(mockPrismaService.customerVehicle.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se veículo não existir', async () => {
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(null);

      await expect(
        service.update('tenant-1', 'vehicle-1', updateVehicleDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException se RENAVAN já existir em outro veículo', async () => {
      mockPrismaService.customerVehicle.findFirst
        .mockResolvedValueOnce(mockVehicle) // Veículo existe
        .mockResolvedValueOnce({ ...mockVehicle, id: 'vehicle-2' }); // RENAVAN já existe

      const dtoWithRenavan: UpdateVehicleDto = {
        renavan: '99999999999',
      };

      await expect(
        service.update('tenant-1', 'vehicle-1', dtoWithRenavan),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar BadRequestException se remover todos os identificadores', async () => {
      // Veículo que já não tem identificadores
      const vehicleWithoutIdentifiers = {
        ...mockVehicle,
        vin: null,
        renavan: null,
        placa: null,
      };

      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(
        vehicleWithoutIdentifiers,
      );

      // Tentar remover os identificadores restantes (que já são null)
      // O service verifica se após a atualização não há nenhum identificador
      const dtoRemovingAll: UpdateVehicleDto = {
        vin: undefined,
        renavan: undefined,
        placa: undefined,
      };

      // Mock do update para retornar veículo sem identificadores
      mockPrismaService.customerVehicle.update.mockResolvedValue({
        ...vehicleWithoutIdentifiers,
        vin: null,
        renavan: null,
        placa: null,
      });

      await expect(
        service.update('tenant-1', 'vehicle-1', dtoRemovingAll),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve desmarcar outros veículos quando isDefault for true', async () => {
      const dtoWithDefault: UpdateVehicleDto = {
        isDefault: true,
      };

      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(mockVehicle);
      mockPrismaService.customerVehicle.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.customerVehicle.update.mockResolvedValue({
        ...mockVehicle,
        isDefault: true,
      });

      await service.update('tenant-1', 'vehicle-1', dtoWithDefault);

      expect(mockPrismaService.customerVehicle.updateMany).toHaveBeenCalledWith({
        where: {
          customerId: mockVehicle.customerId,
          id: { not: 'vehicle-1' },
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    });
  });

  describe('remove', () => {
    it('deve remover veículo com sucesso', async () => {
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue({
        ...mockVehicle,
        customer: {
          serviceOrders: [],
        },
      });
      mockPrismaService.customerVehicle.delete.mockResolvedValue(mockVehicle);

      await service.remove('tenant-1', 'vehicle-1');

      expect(mockPrismaService.customerVehicle.delete).toHaveBeenCalledWith({
        where: { id: 'vehicle-1' },
      });
    });

    it('deve lançar NotFoundException se veículo não existir', async () => {
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('tenant-1', 'vehicle-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se veículo tiver ordens de serviço', async () => {
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue({
        ...mockVehicle,
        customer: {
          serviceOrders: [{ id: 'os-1' }],
        },
      });

      await expect(
        service.remove('tenant-1', 'vehicle-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('toResponseDto', () => {
    it('deve converter PrismaVehicle para VehicleResponseDto corretamente', async () => {
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(mockVehicle);

      const result = await service.findOne('tenant-1', 'vehicle-1');

      expect(result).toMatchObject({
        id: mockVehicle.id,
        customerId: mockVehicle.customerId,
        vin: mockVehicle.vin,
        renavan: mockVehicle.renavan,
        placa: mockVehicle.placa,
        make: mockVehicle.make,
        model: mockVehicle.model,
        year: mockVehicle.year,
        color: mockVehicle.color,
        mileage: mockVehicle.mileage,
        isDefault: mockVehicle.isDefault,
        createdAt: mockVehicle.createdAt,
        updatedAt: mockVehicle.updatedAt,
      });
    });
  });
});

