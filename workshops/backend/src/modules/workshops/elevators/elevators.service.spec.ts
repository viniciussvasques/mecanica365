import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ElevatorsService } from './elevators.service';
import { PrismaService } from '@database/prisma.service';
import {
  CreateElevatorDto,
  UpdateElevatorDto,
  ElevatorType,
  ElevatorStatus,
} from './dto';

describe('ElevatorsService', () => {
  let service: ElevatorsService;

  const mockTenantId = 'tenant-id';
  const mockElevator = {
    id: 'elevator-id',
    tenantId: mockTenantId,
    name: 'Elevador 1',
    number: 'ELEV-001',
    type: 'hydraulic',
    capacity: 3.5,
    status: 'free',
    location: 'Setor A - Box 1',
    notes: 'Revisão anual em dezembro',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    elevator: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    elevatorUsage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    customerVehicle: {
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
        ElevatorsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ElevatorsService>(ElevatorsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createElevatorDto: CreateElevatorDto = {
      name: 'Elevador 1',
      number: 'ELEV-001',
      type: ElevatorType.HYDRAULIC,
      capacity: 3.5,
      status: ElevatorStatus.FREE,
      location: 'Setor A - Box 1',
      notes: 'Revisão anual em dezembro',
    };

    it('deve criar um elevador com sucesso', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);
      mockPrismaService.elevator.create.mockResolvedValue(mockElevator);

      const result = await service.create(mockTenantId, createElevatorDto);

      expect(result).toHaveProperty('id', 'elevator-id');
      expect(result).toHaveProperty('name', 'Elevador 1');
      expect(result).toHaveProperty('number', 'ELEV-001');
      expect(mockPrismaService.elevator.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          number: createElevatorDto.number,
        },
      });
      expect(mockPrismaService.elevator.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          name: createElevatorDto.name.trim(),
          number: createElevatorDto.number.trim(),
          type: createElevatorDto.type,
          capacity: createElevatorDto.capacity,
          status: createElevatorDto.status,
          location: createElevatorDto.location?.trim() || null,
          notes: createElevatorDto.notes?.trim() || null,
        },
      });
    });

    it('deve lançar ConflictException quando número já existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);

      await expect(
        service.create(mockTenantId, createElevatorDto),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.elevator.create).not.toHaveBeenCalled();
    });

    it('deve criar elevador com valores padrão quando não fornecidos', async () => {
      const dtoWithoutDefaults: CreateElevatorDto = {
        name: 'Elevador 2',
        number: 'ELEV-002',
        capacity: 4.0,
      };

      mockPrismaService.elevator.findFirst.mockResolvedValue(null);
      mockPrismaService.elevator.create.mockResolvedValue({
        ...mockElevator,
        id: 'elevator-2',
        number: 'ELEV-002',
        type: 'hydraulic',
        status: 'free',
      });

      await service.create(mockTenantId, dtoWithoutDefaults);

      expect(mockPrismaService.elevator.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          name: dtoWithoutDefaults.name.trim(),
          number: dtoWithoutDefaults.number.trim(),
          type: 'hydraulic',
          capacity: dtoWithoutDefaults.capacity,
          status: 'free',
          location: null,
          notes: null,
        },
      });
    });
  });

  describe('findAll', () => {
    it('deve listar elevadores com sucesso', async () => {
      const mockElevators = [mockElevator];
      mockPrismaService.elevator.findMany.mockResolvedValue(mockElevators);
      mockPrismaService.elevator.count.mockResolvedValue(1);

      const filters = { page: 1, limit: 10 };
      const result = await service.findAll(mockTenantId, filters);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 10);
      expect(result.data).toHaveLength(1);
      expect(mockPrismaService.elevator.findMany).toHaveBeenCalled();
      expect(mockPrismaService.elevator.count).toHaveBeenCalled();
    });

    it('deve aplicar filtros corretamente', async () => {
      mockPrismaService.elevator.findMany.mockResolvedValue([mockElevator]);
      mockPrismaService.elevator.count.mockResolvedValue(1);

      const filters = {
        name: 'Elevador',
        status: ElevatorStatus.FREE,
        type: ElevatorType.HYDRAULIC,
        page: 1,
        limit: 10,
      };

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.elevator.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          name: {
            contains: filters.name,
            mode: 'insensitive',
          },
          status: filters.status,
          type: filters.type,
        },
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('deve aplicar paginação corretamente', async () => {
      mockPrismaService.elevator.findMany.mockResolvedValue([]);
      mockPrismaService.elevator.count.mockResolvedValue(0);

      const filters = { page: 2, limit: 5 };
      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.elevator.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve buscar elevador por ID com sucesso', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);

      const result = await service.findOne(mockTenantId, 'elevator-id');

      expect(result).toHaveProperty('id', 'elevator-id');
      expect(mockPrismaService.elevator.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'elevator-id',
          tenantId: mockTenantId,
        },
      });
    });

    it('deve lançar NotFoundException quando elevador não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateElevatorDto: UpdateElevatorDto = {
      name: 'Elevador 1 - Atualizado',
      status: ElevatorStatus.OCCUPIED,
    };

    it('deve atualizar elevador com sucesso', async () => {
      mockPrismaService.elevator.findFirst
        .mockResolvedValueOnce(mockElevator) // Verifica existência
        .mockResolvedValueOnce(null); // Verifica se número já existe (não existe)
      mockPrismaService.elevator.update.mockResolvedValue({
        ...mockElevator,
        ...updateElevatorDto,
      });

      const result = await service.update(
        mockTenantId,
        'elevator-id',
        updateElevatorDto,
      );

      expect(result).toHaveProperty('name', 'Elevador 1 - Atualizado');
      expect(result).toHaveProperty('status', ElevatorStatus.OCCUPIED);
      expect(mockPrismaService.elevator.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando elevador não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'non-existent-id', updateElevatorDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException quando número já existe em outro elevador', async () => {
      mockPrismaService.elevator.findFirst
        .mockResolvedValueOnce(mockElevator)
        .mockResolvedValueOnce({
          ...mockElevator,
          id: 'other-elevator-id',
        });

      const dtoWithNumber: UpdateElevatorDto = {
        number: 'ELEV-002',
      };

      await expect(
        service.update(mockTenantId, 'elevator-id', dtoWithNumber),
      ).rejects.toThrow(ConflictException);
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      mockPrismaService.elevator.findFirst
        .mockResolvedValueOnce(mockElevator)
        .mockResolvedValueOnce(null);
      mockPrismaService.elevator.update.mockResolvedValue({
        ...mockElevator,
        name: 'Novo Nome',
      });

      const partialDto: UpdateElevatorDto = {
        name: 'Novo Nome',
      };

      await service.update(mockTenantId, 'elevator-id', partialDto);

      expect(mockPrismaService.elevator.update).toHaveBeenCalledWith({
        where: { id: 'elevator-id' },
        data: {
          name: 'Novo Nome',
        },
      });
    });
  });

  describe('remove', () => {
    it('deve remover elevador com sucesso', async () => {
      // Configurar mocks explicitamente
      mockPrismaService.elevator.findFirst = jest
        .fn()
        .mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst = jest
        .fn()
        .mockResolvedValue(null);
      mockPrismaService.elevator.delete = jest
        .fn()
        .mockResolvedValue(mockElevator);

      await service.remove(mockTenantId, 'elevator-id');

      expect(mockPrismaService.elevator.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'elevator-id',
          tenantId: mockTenantId,
        },
      });
      expect(mockPrismaService.elevatorUsage.findFirst).toHaveBeenCalledWith({
        where: {
          elevatorId: 'elevator-id',
          endTime: null,
        },
      });
      expect(mockPrismaService.elevator.delete).toHaveBeenCalledWith({
        where: { id: 'elevator-id' },
      });
    });

    it('deve lançar NotFoundException quando elevador não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(mockTenantId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.elevator.delete).not.toHaveBeenCalled();
    });

    it('deve lançar BadRequestException quando há uso ativo', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue({
        id: 'usage-id',
        elevatorId: 'elevator-id',
        endTime: null,
      });

      await expect(service.remove(mockTenantId, 'elevator-id')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.elevator.delete).not.toHaveBeenCalled();
    });
  });

  describe('startUsage', () => {
    const startUsageDto = {
      serviceOrderId: 'so-id',
      vehicleId: 'vehicle-id',
      notes: 'Iniciando uso do elevador',
    };

    it('deve iniciar uso do elevador com sucesso', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue({
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue({
        id: 'so-id',
        tenantId: mockTenantId,
      });
      mockPrismaService.elevatorUsage.create.mockResolvedValue({
        id: 'usage-id',
        elevatorId: 'elevator-id',
        serviceOrderId: 'so-id',
        vehicleId: 'vehicle-id',
        startTime: new Date(),
        endTime: null,
        notes: 'Iniciando uso do elevador',
        elevator: mockElevator,
        serviceOrder: {
          id: 'so-id',
          number: 'OS-001',
          customer: { id: 'customer-id', name: 'Cliente' },
          technician: { id: 'tech-id', name: 'Técnico' },
        },
        vehicle: {
          id: 'vehicle-id',
          placa: 'ABC1234',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          customer: { id: 'customer-id', name: 'Cliente' },
        },
        createdAt: new Date(),
      });
      mockPrismaService.elevator.update.mockResolvedValue({
        ...mockElevator,
        status: 'occupied',
      });

      const result = await service.startUsage(
        mockTenantId,
        'elevator-id',
        startUsageDto,
      );

      expect(result).toBeDefined();
      expect(result.elevatorId).toBe('elevator-id');
      expect(mockPrismaService.elevatorUsage.create).toHaveBeenCalled();
      expect(mockPrismaService.elevator.update).toHaveBeenCalledWith({
        where: { id: 'elevator-id' },
        data: { status: 'occupied' },
      });
    });

    it('deve lançar NotFoundException quando elevador não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);

      await expect(
        service.startUsage(mockTenantId, 'non-existent-id', startUsageDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException quando elevador está ocupado', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue({
        ...mockElevator,
        status: 'occupied',
      });

      await expect(
        service.startUsage(mockTenantId, 'elevator-id', startUsageDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException quando elevador está em manutenção', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue({
        ...mockElevator,
        status: 'maintenance',
      });

      await expect(
        service.startUsage(mockTenantId, 'elevator-id', startUsageDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar ConflictException quando já existe uso ativo', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue({
        id: 'usage-id',
        elevatorId: 'elevator-id',
        endTime: null,
      });

      await expect(
        service.startUsage(mockTenantId, 'elevator-id', startUsageDto),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar NotFoundException quando veículo não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(null);

      await expect(
        service.startUsage(mockTenantId, 'elevator-id', startUsageDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException quando OS não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue({
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.startUsage(mockTenantId, 'elevator-id', startUsageDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve iniciar uso sem veículo e OS quando não fornecidos', async () => {
      const dtoWithoutIds = {
        notes: 'Uso sem veículo',
      };

      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);
      mockPrismaService.elevatorUsage.create.mockResolvedValue({
        id: 'usage-id',
        elevatorId: 'elevator-id',
        serviceOrderId: null,
        vehicleId: null,
        startTime: new Date(),
        endTime: null,
        notes: 'Uso sem veículo',
        elevator: mockElevator,
        serviceOrder: null,
        vehicle: null,
        createdAt: new Date(),
      });
      mockPrismaService.elevator.update.mockResolvedValue({
        ...mockElevator,
        status: 'occupied',
      });

      const result = await service.startUsage(
        mockTenantId,
        'elevator-id',
        dtoWithoutIds,
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.elevatorUsage.create).toHaveBeenCalled();
    });
  });

  describe('endUsage', () => {
    const endUsageDto = {
      notes: 'Finalizando uso do elevador',
    };

    const mockActiveUsage = {
      id: 'usage-id',
      elevatorId: 'elevator-id',
      startTime: new Date(Date.now() - 3600000), // 1 hora atrás
      endTime: null,
      notes: 'Nota inicial',
      elevator: mockElevator,
      serviceOrder: {
        id: 'so-id',
        number: 'OS-001',
        customer: { id: 'customer-id', name: 'Cliente' },
        technician: { id: 'tech-id', name: 'Técnico' },
      },
      vehicle: {
        id: 'vehicle-id',
        placa: 'ABC1234',
        make: 'Toyota',
        model: 'Corolla',
        year: 2020,
        customer: { id: 'customer-id', name: 'Cliente' },
      },
      createdAt: new Date(),
    };

    it('deve finalizar uso do elevador com sucesso', async () => {
      const endTime = new Date();
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue({
        id: 'usage-id',
        notes: 'Nota inicial',
      });
      mockPrismaService.elevatorUsage.update.mockResolvedValue({
        ...mockActiveUsage,
        endTime,
        notes: 'Nota inicial\nFinalizando uso do elevador',
      });
      mockPrismaService.elevator.update.mockResolvedValue({
        ...mockElevator,
        status: 'free',
      });

      const result = await service.endUsage(
        mockTenantId,
        'elevator-id',
        endUsageDto,
      );

      expect(result).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(mockPrismaService.elevatorUsage.update).toHaveBeenCalled();
      expect(mockPrismaService.elevator.update).toHaveBeenCalledWith({
        where: { id: 'elevator-id' },
        data: { status: 'free' },
      });
    });

    it('deve lançar NotFoundException quando elevador não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);

      await expect(
        service.endUsage(mockTenantId, 'non-existent-id', endUsageDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException quando não há uso ativo', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);

      await expect(
        service.endUsage(mockTenantId, 'elevator-id', endUsageDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve finalizar uso usando usageId fornecido', async () => {
      const dtoWithUsageId = {
        usageId: 'usage-id',
        notes: 'Finalizando',
      };
      const endTime = new Date();

      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue({
        id: 'usage-id',
        notes: null,
      });
      mockPrismaService.elevatorUsage.update.mockResolvedValue({
        ...mockActiveUsage,
        endTime,
        notes: 'Finalizando',
      });
      mockPrismaService.elevator.update.mockResolvedValue({
        ...mockElevator,
        status: 'free',
      });

      await service.endUsage(mockTenantId, 'elevator-id', dtoWithUsageId);

      expect(mockPrismaService.elevatorUsage.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'usage-id',
          elevatorId: 'elevator-id',
          endTime: null,
        },
        select: {
          id: true,
          notes: true,
        },
      });
    });
  });

  describe('reserve', () => {
    const reserveDto = {
      serviceOrderId: 'so-id',
      vehicleId: 'vehicle-id',
      scheduledStartTime: new Date(Date.now() + 86400000).toISOString(), // Amanhã
      notes: 'Reserva para amanhã',
    };

    it('deve reservar elevador com sucesso', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue({
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue({
        id: 'so-id',
        tenantId: mockTenantId,
      });
      mockPrismaService.elevatorUsage.create.mockResolvedValue({
        id: 'usage-id',
        elevatorId: 'elevator-id',
        serviceOrderId: 'so-id',
        vehicleId: 'vehicle-id',
        startTime: new Date(reserveDto.scheduledStartTime),
        endTime: null,
        notes: 'Reserva para amanhã',
        elevator: mockElevator,
        serviceOrder: {
          id: 'so-id',
          number: 'OS-001',
          customer: { id: 'customer-id', name: 'Cliente' },
          technician: { id: 'tech-id', name: 'Técnico' },
        },
        vehicle: {
          id: 'vehicle-id',
          placa: 'ABC1234',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          customer: { id: 'customer-id', name: 'Cliente' },
        },
        createdAt: new Date(),
      });
      mockPrismaService.elevator.update.mockResolvedValue({
        ...mockElevator,
        status: 'scheduled',
      });

      const result = await service.reserve(
        mockTenantId,
        'elevator-id',
        reserveDto,
      );

      expect(result).toBeDefined();
      expect(mockPrismaService.elevatorUsage.create).toHaveBeenCalled();
      expect(mockPrismaService.elevator.update).toHaveBeenCalledWith({
        where: { id: 'elevator-id' },
        data: { status: 'scheduled' },
      });
    });

    it('deve lançar NotFoundException quando elevador não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);

      await expect(
        service.reserve(mockTenantId, 'non-existent-id', reserveDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar ConflictException quando elevador está ocupado', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue({
        ...mockElevator,
        status: 'occupied',
      });

      await expect(
        service.reserve(mockTenantId, 'elevator-id', reserveDto),
      ).rejects.toThrow(ConflictException);
    });

    it('deve lançar BadRequestException quando elevador está em manutenção', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue({
        ...mockElevator,
        status: 'maintenance',
      });

      await expect(
        service.reserve(mockTenantId, 'elevator-id', reserveDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar NotFoundException quando veículo não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(null);

      await expect(
        service.reserve(mockTenantId, 'elevator-id', reserveDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException quando OS não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue({
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.reserve(mockTenantId, 'elevator-id', reserveDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve usar data atual quando scheduledStartTime não for fornecido', async () => {
      const dtoWithoutTime = {
        serviceOrderId: 'so-id',
        vehicleId: 'vehicle-id',
        notes: 'Reserva',
      };

      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue({
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue({
        id: 'so-id',
        tenantId: mockTenantId,
      });
      mockPrismaService.elevatorUsage.create.mockResolvedValue({
        id: 'usage-id',
        elevatorId: 'elevator-id',
        startTime: new Date(),
        endTime: null,
        elevator: mockElevator,
        serviceOrder: null,
        vehicle: null,
        createdAt: new Date(),
      });
      mockPrismaService.elevator.update.mockResolvedValue({
        ...mockElevator,
        status: 'scheduled',
      });

      await service.reserve(mockTenantId, 'elevator-id', dtoWithoutTime);

      expect(mockPrismaService.elevatorUsage.create).toHaveBeenCalled();
    });
  });

  describe('getCurrentUsage', () => {
    it('deve retornar uso atual quando existe', async () => {
      const mockUsage = {
        id: 'usage-id',
        elevatorId: 'elevator-id',
        startTime: new Date(),
        endTime: null,
        notes: 'Uso ativo',
        elevator: mockElevator,
        serviceOrder: {
          id: 'so-id',
          number: 'OS-001',
          customer: { id: 'customer-id', name: 'Cliente' },
          technician: { id: 'tech-id', name: 'Técnico' },
        },
        vehicle: {
          id: 'vehicle-id',
          placa: 'ABC1234',
          make: 'Toyota',
          model: 'Corolla',
          year: 2020,
          customer: { id: 'customer-id', name: 'Cliente' },
        },
        createdAt: new Date(),
      };

      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(mockUsage);

      const result = await service.getCurrentUsage(mockTenantId, 'elevator-id');

      expect(result).toBeDefined();
      expect(result?.elevatorId).toBe('elevator-id');
    });

    it('deve retornar null quando não há uso ativo', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);

      const result = await service.getCurrentUsage(mockTenantId, 'elevator-id');

      expect(result).toBeNull();
    });

    it('deve lançar NotFoundException quando elevador não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);

      await expect(
        service.getCurrentUsage(mockTenantId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUsageHistory', () => {
    it('deve retornar histórico de uso com sucesso', async () => {
      const mockUsages = [
        {
          id: 'usage-1',
          elevatorId: 'elevator-id',
          startTime: new Date(),
          endTime: new Date(),
          notes: 'Uso 1',
          elevator: mockElevator,
          serviceOrder: null,
          vehicle: null,
          createdAt: new Date(),
        },
        {
          id: 'usage-2',
          elevatorId: 'elevator-id',
          startTime: new Date(),
          endTime: new Date(),
          notes: 'Uso 2',
          elevator: mockElevator,
          serviceOrder: null,
          vehicle: null,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.$transaction.mockResolvedValue([mockUsages, 2]);

      const result = await service.getUsageHistory(mockTenantId, 'elevator-id');

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('deve aplicar filtros de data', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.getUsageHistory(mockTenantId, 'elevator-id', {
        startDate,
        endDate,
        page: 1,
        limit: 10,
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('deve aplicar paginação corretamente', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(mockElevator);
      mockPrismaService.$transaction.mockResolvedValue([[], 0]);

      await service.getUsageHistory(mockTenantId, 'elevator-id', {
        page: 2,
        limit: 5,
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException quando elevador não existe', async () => {
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);

      await expect(
        service.getUsageHistory(mockTenantId, 'non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
