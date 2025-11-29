import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { PrismaService } from '@database/prisma.service';
import { ElevatorsService } from '../elevators/elevators.service';
import { CreateServiceOrderDto, ServiceOrderStatus } from './dto';

describe('ServiceOrdersService', () => {
  let service: ServiceOrdersService;

  const mockTenantId = 'tenant-id';

  const createMockServiceOrder = (overrides = {}) => ({
    id: 'service-order-id',
    tenantId: mockTenantId,
    number: 'OS-001',
    customerId: 'customer-id',
    vehicleVin: null,
    vehiclePlaca: 'ABC1234',
    vehicleMake: 'Honda',
    vehicleModel: 'Civic',
    vehicleYear: 2020,
    vehicleMileage: null,
    technicianId: null,
    status: 'scheduled',
    appointmentDate: null,
    checkInDate: null,
    checkInKm: null,
    checkInFuelLevel: null,
    reportedProblemCategory: null,
    reportedProblemDescription: null,
    reportedProblemSymptoms: [],
    identifiedProblemCategory: null,
    identifiedProblemDescription: null,
    identifiedProblemId: null,
    inspectionNotes: null,
    inspectionPhotos: [],
    diagnosticNotes: null,
    recommendations: null,
    estimatedHours: null,
    laborCost: null,
    partsCost: null,
    totalCost: null,
    discount: { toNumber: () => 0 } as unknown,
    actualHours: null,
    startedAt: null,
    completedAt: null,
    invoiceId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer-id',
      name: 'João Silva',
      phone: '(11) 98765-4321',
      email: 'joao@email.com',
    },
    technician: null,
    ...overrides,
  });

  const mockPrismaService = {
    serviceOrder: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    customerVehicle: {
      findFirst: jest.fn(),
    },
    elevatorUsage: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback.map((promise) => promise));
      }
      return callback(mockPrismaService);
    }),
  };

  const mockElevatorsService = {
    reserve: jest.fn(),
    startUsage: jest.fn(),
    endUsage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceOrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ElevatorsService,
          useValue: mockElevatorsService,
        },
      ],
    }).compile();

    service = module.get<ServiceOrdersService>(ServiceOrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createServiceOrderDto: CreateServiceOrderDto = {
      customerId: 'customer-id',
      vehiclePlaca: 'ABC1234',
      vehicleMake: 'Honda',
      vehicleModel: 'Civic',
      vehicleYear: 2020,
      status: ServiceOrderStatus.SCHEDULED,
    };

    it('deve criar uma ordem de serviço com sucesso', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-id',
        tenantId: mockTenantId,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(null);
      mockPrismaService.serviceOrder.create.mockResolvedValue(
        createMockServiceOrder(),
      );

      const result = await service.create(mockTenantId, createServiceOrderDto);

      expect(result).toHaveProperty('id', 'service-order-id');
      expect(result).toHaveProperty('number', 'OS-001');
      expect(mockPrismaService.serviceOrder.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se cliente não existir', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockTenantId, createServiceOrderDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de ordens de serviço', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.$transaction.mockResolvedValue([[mockServiceOrder], 1]);

      const result = await service.findAll(mockTenantId, {
        page: 1,
        limit: 20,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 20);
    });
  });

  describe('findOne', () => {
    it('deve retornar ordem de serviço encontrada', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );

      const result = await service.findOne(mockTenantId, 'service-order-id');

      expect(result).toHaveProperty('id', 'service-order-id');
      expect(mockPrismaService.serviceOrder.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'service-order-id',
          tenantId: mockTenantId,
        },
        include: expect.any(Object),
      });
    });

    it('deve lançar NotFoundException se ordem de serviço não existir', async () => {
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('start', () => {
    it('deve iniciar ordem de serviço', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);
      mockPrismaService.serviceOrder.update.mockResolvedValue(
        createMockServiceOrder({
          status: ServiceOrderStatus.IN_PROGRESS,
          startedAt: new Date(),
        }),
      );

      const result = await service.start(mockTenantId, 'service-order-id');

      expect(result.status).toBe(ServiceOrderStatus.IN_PROGRESS);
      expect(result.startedAt).toBeDefined();
    });

    it('deve lançar NotFoundException se ordem de serviço não existir', async () => {
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.start(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('complete', () => {
    it('deve finalizar ordem de serviço', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);
      mockPrismaService.serviceOrder.update.mockResolvedValue(
        createMockServiceOrder({
          status: ServiceOrderStatus.COMPLETED,
          completedAt: new Date(),
        }),
      );

      const result = await service.complete(mockTenantId, 'service-order-id');

      expect(result.status).toBe(ServiceOrderStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
    });
  });

  describe('cancel', () => {
    it('deve cancelar ordem de serviço', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);
      mockPrismaService.serviceOrder.update.mockResolvedValue(
        createMockServiceOrder({
          status: ServiceOrderStatus.CANCELLED,
        }),
      );

      const result = await service.cancel(mockTenantId, 'service-order-id');

      expect(result.status).toBe(ServiceOrderStatus.CANCELLED);
    });
  });

  describe('remove', () => {
    it('deve remover ordem de serviço', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );
      mockPrismaService.serviceOrder.delete.mockResolvedValue(mockServiceOrder);

      await service.remove(mockTenantId, 'service-order-id');

      expect(mockPrismaService.serviceOrder.delete).toHaveBeenCalledWith({
        where: { id: 'service-order-id' },
      });
    });

    it('deve lançar BadRequestException se ordem de serviço tiver fatura', async () => {
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        createMockServiceOrder({ invoiceId: 'invoice-id' }),
      );

      await expect(
        service.remove(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
