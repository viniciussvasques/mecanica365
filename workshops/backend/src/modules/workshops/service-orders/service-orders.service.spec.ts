import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { PrismaService } from '@database/prisma.service';
import { ElevatorsService } from '../elevators/elevators.service';
import { ChecklistsService } from '../checklists/checklists.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { NotificationsService } from '@core/notifications/notifications.service';
import { CreateServiceOrderDto, ServiceOrderStatus } from './dto';
import { ChecklistType } from '../checklists/dto';

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
    services: [],
    partsConsumed: [],
    elevatorUsages: [],
    quotes: [],
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
      findMany: jest.fn(),
    },
    customerVehicle: {
      findFirst: jest.fn(),
    },
    elevatorUsage: {
      findFirst: jest.fn(),
    },
    checklist: {
      findMany: jest.fn(),
    },
    attachment: {
      findMany: jest.fn(),
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

  const mockChecklistsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByEntity: jest.fn(),
    validate: jest.fn(),
  };

  const mockAttachmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
    notifyAllMechanics: jest.fn(),
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
        {
          provide: ChecklistsService,
          useValue: mockChecklistsService,
        },
        {
          provide: AttachmentsService,
          useValue: mockAttachmentsService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
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

    it('deve gerar número OS-002 quando há ordem anterior', async () => {
      const lastOrder = createMockServiceOrder({ number: 'OS-001' });
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-id',
        tenantId: mockTenantId,
      });
      mockPrismaService.serviceOrder.findFirst
        .mockResolvedValueOnce(lastOrder) // Para buscar último número
        .mockResolvedValueOnce(null); // Para verificar se número existe
      mockPrismaService.serviceOrder.create.mockResolvedValue(
        createMockServiceOrder({ number: 'OS-002' }),
      );

      const result = await service.create(mockTenantId, createServiceOrderDto);

      expect(result.number).toBe('OS-002');
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
      // Resetar mock para garantir estado limpo
      mockPrismaService.serviceOrder.findFirst.mockReset();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.checklist.findMany.mockResolvedValue([]);
      mockPrismaService.attachment.findMany.mockResolvedValue([]);

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
      // Resetar mocks para garantir que não há interferência de testes anteriores
      mockPrismaService.serviceOrder.findFirst.mockReset();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(null);
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.checklist.findMany.mockResolvedValue([]);
      mockPrismaService.attachment.findMany.mockResolvedValue([]);

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
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.IN_PROGRESS,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );
      mockChecklistsService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);
      mockPrismaService.serviceOrder.update.mockResolvedValue(
        createMockServiceOrder({
          status: ServiceOrderStatus.COMPLETED,
          completedAt: new Date(),
        }),
      );
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.checklist.findMany.mockResolvedValue([]);
      mockPrismaService.attachment.findMany.mockResolvedValue([]);

      const result = await service.complete(mockTenantId, 'service-order-id');

      expect(result.status).toBe(ServiceOrderStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
    });

    it('deve validar checklist pré-serviço antes de finalizar', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.IN_PROGRESS,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );
      mockChecklistsService.findAll.mockResolvedValue({
        data: [
          {
            id: 'checklist-id',
            checklistType: ChecklistType.PRE_SERVICE,
            status: 'completed',
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
      mockChecklistsService.validate.mockResolvedValue(true);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);
      mockPrismaService.serviceOrder.update.mockResolvedValue(
        createMockServiceOrder({
          status: ServiceOrderStatus.COMPLETED,
          completedAt: new Date(),
        }),
      );
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.checklist.findMany.mockResolvedValue([]);
      mockPrismaService.attachment.findMany.mockResolvedValue([]);

      const result = await service.complete(mockTenantId, 'service-order-id');

      expect(result.status).toBe(ServiceOrderStatus.COMPLETED);
      expect(mockChecklistsService.validate).toHaveBeenCalled();
    });

    it('deve validar checklist pós-serviço antes de finalizar', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.IN_PROGRESS,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );
      mockChecklistsService.findAll.mockResolvedValue({
        data: [
          {
            id: 'checklist-id',
            checklistType: ChecklistType.POST_SERVICE,
            status: 'completed',
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
      mockChecklistsService.validate.mockResolvedValue(true);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);
      mockPrismaService.serviceOrder.update.mockResolvedValue(
        createMockServiceOrder({
          status: ServiceOrderStatus.COMPLETED,
          completedAt: new Date(),
        }),
      );
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.checklist.findMany.mockResolvedValue([]);
      mockPrismaService.attachment.findMany.mockResolvedValue([]);

      const result = await service.complete(mockTenantId, 'service-order-id');

      expect(result.status).toBe(ServiceOrderStatus.COMPLETED);
      expect(mockChecklistsService.validate).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se checklist pré-serviço não estiver completo', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.IN_PROGRESS,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );
      mockChecklistsService.findAll.mockResolvedValue({
        data: [
          {
            id: 'checklist-id',
            checklistType: ChecklistType.PRE_SERVICE,
            status: 'in_progress',
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
      mockChecklistsService.validate.mockResolvedValue(false);

      await expect(
        service.complete(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se checklist pós-serviço não estiver completo', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.IN_PROGRESS,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );
      mockChecklistsService.findAll.mockResolvedValue({
        data: [
          {
            id: 'checklist-id',
            checklistType: ChecklistType.POST_SERVICE,
            status: 'in_progress',
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
      mockChecklistsService.validate.mockResolvedValue(false);

      await expect(
        service.complete(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(BadRequestException);
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

  describe('update', () => {
    it('deve atualizar ordem de serviço com sucesso', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce(
        mockServiceOrder,
      );
      mockPrismaService.serviceOrder.update.mockResolvedValue({
        ...mockServiceOrder,
        status: ServiceOrderStatus.IN_PROGRESS,
      });

      const result = await service.update(mockTenantId, 'service-order-id', {
        status: ServiceOrderStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(ServiceOrderStatus.IN_PROGRESS);
      expect(mockPrismaService.serviceOrder.update).toHaveBeenCalled();
    });

    it('deve atualizar dados do veículo', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce(
        mockServiceOrder,
      );
      mockPrismaService.serviceOrder.update.mockResolvedValue({
        ...mockServiceOrder,
        vehicleMake: 'Toyota',
        vehicleModel: 'Corolla',
      });

      const result = await service.update(mockTenantId, 'service-order-id', {
        vehicleMake: 'Toyota',
        vehicleModel: 'Corolla',
      });

      expect(result.vehicleMake).toBe('Toyota');
      expect(result.vehicleModel).toBe('Corolla');
    });

    it('deve atualizar custos e recalcular total', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce(
        mockServiceOrder,
      );
      mockPrismaService.serviceOrder.update.mockResolvedValue({
        ...mockServiceOrder,
        laborCost: { toNumber: () => 500 },
        partsCost: { toNumber: () => 300 },
        totalCost: { toNumber: () => 800 },
      });

      const result = await service.update(mockTenantId, 'service-order-id', {
        laborCost: 500,
        partsCost: 300,
      });

      expect(result).toBeDefined();
    });

    it('deve lançar NotFoundException se ordem de serviço não existe', async () => {
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'non-existent', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve validar cliente ao atualizar', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce(
        mockServiceOrder,
      );
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'service-order-id', {
          customerId: 'non-existent',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve validar mecânico ao atualizar', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce(
        mockServiceOrder,
      );
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'service-order-id', {
          technicianId: 'non-existent',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('start - casos adicionais', () => {
    it('deve iniciar OS com elevador', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.SCHEDULED,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce(
        mockServiceOrder,
      );
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue({
        id: 'usage-id',
        elevatorId: 'elevator-id',
        serviceOrderId: 'service-order-id',
        endTime: null,
      });
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue({
        id: 'vehicle-id',
      });
      mockElevatorsService.startUsage.mockResolvedValue({
        id: 'usage-id',
      });
      mockPrismaService.serviceOrder.update.mockResolvedValue({
        ...mockServiceOrder,
        status: ServiceOrderStatus.IN_PROGRESS,
        startedAt: new Date(),
      });

      const result = await service.start(mockTenantId, 'service-order-id');

      expect(result.status).toBe(ServiceOrderStatus.IN_PROGRESS);
    });

    it('deve lançar BadRequestException se OS já está em progresso', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.IN_PROGRESS,
        startedAt: new Date(),
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );

      await expect(
        service.start(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se OS já está completa', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.COMPLETED,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );

      await expect(
        service.start(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se OS está cancelada', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.CANCELLED,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );

      await expect(
        service.start(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('complete - casos adicionais', () => {
    it('deve finalizar OS com checklist', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.IN_PROGRESS,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce(
        mockServiceOrder,
      );
      mockChecklistsService.findAll.mockResolvedValue({
        data: [
          {
            id: 'checklist-id',
            checklistType: ChecklistType.POST_SERVICE,
            status: 'completed',
          },
        ],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });
      mockChecklistsService.validate.mockResolvedValue(true);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue(null);
      mockPrismaService.serviceOrder.update.mockResolvedValue({
        ...mockServiceOrder,
        status: ServiceOrderStatus.COMPLETED,
        completedAt: new Date(),
      });
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.checklist.findMany.mockResolvedValue([]);
      mockPrismaService.attachment.findMany.mockResolvedValue([]);

      const result = await service.complete(mockTenantId, 'service-order-id');

      expect(result.status).toBe(ServiceOrderStatus.COMPLETED);
    });

    it('deve lançar BadRequestException se OS não está em progresso', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.SCHEDULED,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );
      mockChecklistsService.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      await expect(
        service.complete(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se OS já está completa', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.COMPLETED,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );

      await expect(
        service.complete(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se OS está cancelada', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.CANCELLED,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );

      await expect(
        service.complete(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve finalizar uso de elevador ao completar', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.IN_PROGRESS,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce(
        mockServiceOrder,
      );
      mockChecklistsService.findByEntity = jest.fn().mockResolvedValue([]);
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue({
        id: 'usage-id',
        elevatorId: 'elevator-id',
        endTime: null,
      });
      mockElevatorsService.endUsage.mockResolvedValue({});
      mockPrismaService.serviceOrder.update.mockResolvedValue({
        ...mockServiceOrder,
        status: ServiceOrderStatus.COMPLETED,
      });
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.checklist.findMany.mockResolvedValue([]);
      mockPrismaService.attachment.findMany.mockResolvedValue([]);

      const result = await service.complete(mockTenantId, 'service-order-id');

      expect(result.status).toBe(ServiceOrderStatus.COMPLETED);
    });
  });

  describe('cancel - casos adicionais', () => {
    it('deve lançar BadRequestException se OS já está completa', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.COMPLETED,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );

      await expect(
        service.cancel(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se OS já está cancelada', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.CANCELLED,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValue(
        mockServiceOrder,
      );

      await expect(
        service.cancel(mockTenantId, 'service-order-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve finalizar uso de elevador ao cancelar', async () => {
      const mockServiceOrder = createMockServiceOrder({
        status: ServiceOrderStatus.IN_PROGRESS,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce(
        mockServiceOrder,
      );
      mockPrismaService.elevatorUsage.findFirst.mockResolvedValue({
        id: 'usage-id',
        elevatorId: 'elevator-id',
        endTime: null,
      });
      mockElevatorsService.endUsage.mockResolvedValue({});
      mockPrismaService.serviceOrder.update.mockResolvedValue({
        ...mockServiceOrder,
        status: ServiceOrderStatus.CANCELLED,
      });

      const result = await service.cancel(mockTenantId, 'service-order-id');

      expect(result.status).toBe(ServiceOrderStatus.CANCELLED);
    });
  });

  describe('findAll - filtros adicionais', () => {
    it('deve filtrar por status', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.$transaction.mockResolvedValue([[mockServiceOrder], 1]);

      const result = await service.findAll(mockTenantId, {
        status: ServiceOrderStatus.SCHEDULED,
      });

      expect(result.data).toHaveLength(1);
    });

    it('deve filtrar por cliente', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.$transaction.mockResolvedValue([[mockServiceOrder], 1]);

      const result = await service.findAll(mockTenantId, {
        customerId: 'customer-id',
      });

      expect(result.data).toHaveLength(1);
    });

    it('deve filtrar por período', async () => {
      const mockServiceOrder = createMockServiceOrder();
      mockPrismaService.$transaction.mockResolvedValue([[mockServiceOrder], 1]);

      const result = await service.findAll(mockTenantId, {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.data).toHaveLength(1);
    });
  });
});
