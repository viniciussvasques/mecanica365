import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { VehicleQueryService } from './vehicle-query.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let vehiclesService: VehiclesService;
  let vehicleQueryService: VehicleQueryService;

  const mockTenantId = 'tenant-123';
  const mockVehicle = {
    id: 'vehicle-123',
    tenantId: mockTenantId,
    customerId: 'customer-123',
    make: 'Fiat',
    model: 'Uno',
    year: 2020,
    color: 'Branco',
    vin: '1HGBH41JXMN109186',
    renavan: '12345678901',
    placa: 'ABC1234',
    fuelType: 'FLEX',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVehiclesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockVehicleQueryService = {
    queryByPlaca: jest.fn(),
    queryByRenavan: jest.fn(),
    queryByVin: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: VehiclesService,
          useValue: mockVehiclesService,
        },
        {
          provide: VehicleQueryService,
          useValue: mockVehicleQueryService,
        },
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    vehiclesService = module.get<VehiclesService>(VehiclesService);
    vehicleQueryService = module.get<VehicleQueryService>(VehicleQueryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um veículo', async () => {
      const createDto: CreateVehicleDto = {
        customerId: 'customer-123',
        make: 'Fiat',
        model: 'Uno',
        year: 2020,
      };
      mockVehiclesService.create.mockResolvedValue(mockVehicle);

      const result = await controller.create(mockTenantId, createDto);

      expect(result).toEqual(mockVehicle);
      expect(vehiclesService.create).toHaveBeenCalledWith(
        mockTenantId,
        createDto,
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de veículos', async () => {
      mockVehiclesService.findAll.mockResolvedValue({
        data: [mockVehicle],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const result = await controller.findAll(mockTenantId, {});

      expect(result.data).toHaveLength(1);
      expect(vehiclesService.findAll).toHaveBeenCalledWith(mockTenantId, {});
    });
  });

  describe('findOne', () => {
    it('deve retornar um veículo', async () => {
      mockVehiclesService.findOne.mockResolvedValue(mockVehicle);

      const result = await controller.findOne(mockTenantId, 'vehicle-123');

      expect(result).toEqual(mockVehicle);
      expect(vehiclesService.findOne).toHaveBeenCalledWith(
        mockTenantId,
        'vehicle-123',
      );
    });
  });

  describe('update', () => {
    it('deve atualizar um veículo', async () => {
      const updateDto: UpdateVehicleDto = {
        make: 'Volkswagen',
        model: 'Gol',
      };
      mockVehiclesService.update.mockResolvedValue({
        ...mockVehicle,
        ...updateDto,
      });

      const result = await controller.update(
        mockTenantId,
        'vehicle-123',
        updateDto,
      );

      expect(result.make).toBe('Volkswagen');
      expect(vehiclesService.update).toHaveBeenCalledWith(
        mockTenantId,
        'vehicle-123',
        updateDto,
      );
    });
  });

  describe('remove', () => {
    it('deve remover um veículo', async () => {
      mockVehiclesService.remove.mockResolvedValue(undefined);

      await controller.remove(mockTenantId, 'vehicle-123');

      expect(vehiclesService.remove).toHaveBeenCalledWith(
        mockTenantId,
        'vehicle-123',
      );
    });
  });

  describe('queryByPlaca', () => {
    it('deve consultar dados por placa', async () => {
      const mockQueryResult = {
        make: 'Fiat',
        model: 'Uno',
        year: 2020,
      };
      mockVehicleQueryService.queryByPlaca.mockResolvedValue(mockQueryResult);

      const result = await controller.queryByPlaca('ABC1234');

      expect(result).toEqual(mockQueryResult);
      expect(vehicleQueryService.queryByPlaca).toHaveBeenCalledWith(
        'ABC1234',
      );
    });
  });
});

