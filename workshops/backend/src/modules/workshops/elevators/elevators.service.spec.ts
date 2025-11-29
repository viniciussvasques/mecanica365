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
    },
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
});
