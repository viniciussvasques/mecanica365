/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PrismaService } from '@database/prisma.service';
import { ElevatorsService } from '../elevators/elevators.service';
import { ServiceOrdersService } from '../service-orders/service-orders.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ChecklistsService } from '../checklists/checklists.service';
import { AttachmentsService } from '../attachments/attachments.service';
import { NotificationsService } from '@core/notifications/notifications.service';
import { QuotePdfService } from './pdf/quote-pdf.service';
import { CreateQuoteDto, QuoteStatus, QuoteItemType } from './dto';
import { ProblemCategory } from '@modules/workshops/shared/enums/problem-category.enum';

describe('QuotesService', () => {
  let service: QuotesService;

  const mockTenantId = 'tenant-id';

  const createMockQuote = (overrides = {}) => ({
    id: 'quote-id',
    tenantId: mockTenantId,
    number: 'ORC-001',
    customerId: 'customer-id',
    vehicleId: 'vehicle-id',
    elevatorId: null,
    serviceOrderId: null,
    status: 'draft',
    version: 1,
    parentQuoteId: null,
    laborCost: { toNumber: () => 200 } as unknown,
    partsCost: { toNumber: () => 300 } as unknown,
    totalCost: { toNumber: () => 500 } as unknown,
    discount: { toNumber: () => 0 } as unknown,
    taxAmount: { toNumber: () => 0 } as unknown,
    expiresAt: null,
    validUntil: null,
    sentAt: null,
    viewedAt: null,
    acceptedAt: null,
    rejectedAt: null,
    rejectedReason: null,
    customerSignature: null,
    convertedAt: null,
    convertedToServiceOrderId: null,
    publicToken: null,
    publicTokenExpiresAt: null,
    assignedMechanicId: null,
    assignedAt: null,
    reportedProblemCategory: null,
    reportedProblemDescription: null,
    reportedProblemSymptoms: [],
    identifiedProblemCategory: null,
    identifiedProblemDescription: null,
    identifiedProblemId: null,
    diagnosticNotes: null,
    inspectionNotes: null,
    recommendations: null,
    inspectionPhotos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: 'customer-id',
      name: 'João Silva',
      phone: '(11) 98765-4321',
      email: 'joao@email.com',
    },
    vehicle: {
      id: 'vehicle-id',
      placa: 'ABC1234',
      make: 'Honda',
      model: 'Civic',
      year: 2020,
    },
    elevator: null,
    items: [
      {
        id: 'item-1',
        quoteId: 'quote-id',
        type: 'service',
        serviceId: null,
        partId: null,
        name: 'Troca de óleo',
        description: 'Troca de óleo do motor',
        quantity: 1,
        unitCost: { toNumber: () => 150 } as unknown,
        totalCost: { toNumber: () => 150 } as unknown,
        hours: { toNumber: () => 1.5 } as unknown,
      },
    ],
    ...overrides,
  });

  const mockPrismaService = {
    quote: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    quoteItem: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    customerVehicle: {
      findFirst: jest.fn(),
    },
    elevator: {
      findFirst: jest.fn(),
    },
    workshopSettings: {
      findUnique: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    quoteAssignmentHistory: {
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback: unknown) => {
      if (Array.isArray(callback)) {
        return Promise.all(
          callback.map((promise: Promise<unknown>) => promise),
        );
      }
      return (callback as (prisma: typeof mockPrismaService) => unknown)(
        mockPrismaService,
      );
    }),
  };

  const mockElevatorsService = {
    reserve: jest.fn(),
  };

  const mockServiceOrdersService = {
    create: jest.fn(),
  };

  const mockAppointmentsService = {
    create: jest.fn(),
  };

  const mockChecklistsService = {
    create: jest.fn(),
  };

  const mockAttachmentsService = {
    create: jest.fn(),
  };

  const mockNotificationsService = {
    create: jest.fn(),
    notifyAllMechanics: jest.fn(),
  };

  const mockQuotePdfService = {
    generatePdf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService as unknown as PrismaService,
        },
        {
          provide: ElevatorsService,
          useValue: mockElevatorsService,
        },
        {
          provide: ServiceOrdersService,
          useValue: mockServiceOrdersService,
        },
        {
          provide: AppointmentsService,
          useValue: mockAppointmentsService,
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
        {
          provide: QuotePdfService,
          useValue: mockQuotePdfService,
        },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    const createQuoteDto: CreateQuoteDto = {
      customerId: 'customer-id',
      vehicleId: 'vehicle-id',
      items: [
        {
          type: QuoteItemType.SERVICE,
          name: 'Troca de óleo',
          description: 'Troca de óleo do motor',
          quantity: 1,
          unitCost: 150,
          hours: 1.5,
        },
      ],
      laborCost: 200,
      partsCost: 300,
      discount: 0,
      taxAmount: 0,
    };

    it('deve criar um orçamento com sucesso', async () => {
      const mockCustomer = {
        id: 'customer-id',
        tenantId: mockTenantId,
      };
      const mockVehicle = {
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      };
      const mockQuote = createMockQuote();

      (mockPrismaService.customer.findFirst as jest.Mock).mockResolvedValue(
        mockCustomer,
      );
      (
        mockPrismaService.customerVehicle.findFirst as jest.Mock
      ).mockResolvedValue(mockVehicle);
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrismaService.quote.create as jest.Mock).mockResolvedValue(
        mockQuote,
      );

      const result = await service.create(mockTenantId, createQuoteDto);

      expect(result).toHaveProperty('id', 'quote-id');
      expect(result).toHaveProperty('number', 'ORC-001');
      expect(mockPrismaService.quote.create as jest.Mock).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se cliente não existir', async () => {
      (mockPrismaService.customer.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.create(mockTenantId, createQuoteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se veículo não existir', async () => {
      const mockCustomer = {
        id: 'customer-id',
        tenantId: mockTenantId,
      };
      (mockPrismaService.customer.findFirst as jest.Mock).mockResolvedValue(
        mockCustomer,
      );
      (
        mockPrismaService.customerVehicle.findFirst as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.create(mockTenantId, createQuoteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se não houver itens', async () => {
      const dtoWithoutItems: CreateQuoteDto = {
        customerId: 'customer-id',
        vehicleId: 'vehicle-id',
        items: [],
        status: QuoteStatus.SENT, // Status diferente de DRAFT para validar itens
      };

      // Mockar validações anteriores para que o erro de itens seja o primeiro
      const mockCustomer = {
        id: 'customer-id',
        tenantId: mockTenantId,
      };
      const mockVehicle = {
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      };
      (mockPrismaService.customer.findFirst as jest.Mock).mockResolvedValue(
        mockCustomer,
      );
      (
        mockPrismaService.customerVehicle.findFirst as jest.Mock
      ).mockResolvedValue(mockVehicle);

      await expect(
        service.create(mockTenantId, dtoWithoutItems),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve gerar número ORC-002 quando há orçamento anterior', async () => {
      const lastQuote = createMockQuote({ number: 'ORC-001' });
      const mockCustomer = {
        id: 'customer-id',
        tenantId: mockTenantId,
      };
      const mockVehicle = {
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      };
      (mockPrismaService.customer.findFirst as jest.Mock).mockResolvedValue(
        mockCustomer,
      );
      (
        mockPrismaService.customerVehicle.findFirst as jest.Mock
      ).mockResolvedValue(mockVehicle);
      (mockPrismaService.quote.findFirst as jest.Mock)
        .mockResolvedValueOnce(lastQuote) // Para buscar último número
        .mockResolvedValueOnce(null); // Para verificar se número existe
      (mockPrismaService.quote.create as jest.Mock).mockResolvedValue(
        createMockQuote({ number: 'ORC-002' }),
      );

      const result = await service.create(mockTenantId, createQuoteDto);

      expect(result.number).toBe('ORC-002');
    });

    it('deve continuar mesmo se falhar ao criar checklist pré-diagnóstico', async () => {
      const mockCustomer = {
        id: 'customer-id',
        tenantId: mockTenantId,
      };
      const mockVehicle = {
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      };
      const mockQuote = createMockQuote();

      (mockPrismaService.customer.findFirst as jest.Mock).mockResolvedValue(
        mockCustomer,
      );
      (
        mockPrismaService.customerVehicle.findFirst as jest.Mock
      ).mockResolvedValue(mockVehicle);
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrismaService.quote.create as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      mockChecklistsService.create.mockRejectedValue(
        new Error('Erro ao criar checklist'),
      );

      const result = await service.create(mockTenantId, createQuoteDto);

      expect(result).toHaveProperty('id', 'quote-id');
      expect(mockChecklistsService.create).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException em caso de erro genérico', async () => {
      const mockCustomer = {
        id: 'customer-id',
        tenantId: mockTenantId,
      };
      const mockVehicle = {
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      };
      (mockPrismaService.customer.findFirst as jest.Mock).mockResolvedValue(
        mockCustomer,
      );
      (
        mockPrismaService.customerVehicle.findFirst as jest.Mock
      ).mockResolvedValue(mockVehicle);
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrismaService.quote.create as jest.Mock).mockRejectedValue(
        new Error('Erro genérico'),
      );

      await expect(
        service.create(mockTenantId, createQuoteDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de orçamentos', async () => {
      (mockPrismaService.$transaction as jest.Mock).mockResolvedValue([
        [createMockQuote()],
        1,
      ]);

      const result = await service.findAll(mockTenantId, {
        page: 1,
        limit: 20,
      });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 20);
    });

    it('deve lançar BadRequestException se houver erro ao processar orçamentos', async () => {
      (mockPrismaService.$transaction as jest.Mock).mockRejectedValue(
        new Error('Erro ao processar'),
      );

      await expect(
        service.findAll(mockTenantId, { page: 1, limit: 20 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se houver erro ao converter orçamento para DTO', async () => {
      const mockQuoteWithError = {
        ...createMockQuote(),
        totalCost: {
          toNumber: () => {
            throw new Error('Erro ao converter totalCost');
          },
        },
      };

      (mockPrismaService.$transaction as jest.Mock).mockResolvedValue([
        [mockQuoteWithError],
        1,
      ]);

      await expect(
        service.findAll(mockTenantId, { page: 1, limit: 20 }),
      ).rejects.toThrow(Error);
    });
  });

  describe('findOne', () => {
    it('deve retornar orçamento encontrado', async () => {
      const mockQuote = createMockQuote();
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );

      const result = await service.findOne(mockTenantId, 'quote-id');

      expect(result).toHaveProperty('id', 'quote-id');
      expect(
        mockPrismaService.quote.findFirst as jest.Mock,
      ).toHaveBeenCalledWith({
        where: {
          id: 'quote-id',
          tenantId: mockTenantId,
        },
        include: expect.any(Object),
      });
    });

    it('deve retornar orçamento com estimatedHours como string', async () => {
      const mockQuoteWithStringHours = createMockQuote({
        estimatedHours: '2.5' as unknown,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuoteWithStringHours,
      );

      const result = await service.findOne(mockTenantId, 'quote-id');

      expect(result).toBeDefined();
      expect(result.id).toBe('quote-id');
    });

    it('deve lançar NotFoundException se orçamento não existir', async () => {
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(mockTenantId, 'quote-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    const updateQuoteDto = {
      status: QuoteStatus.SENT,
    };

    it('deve atualizar orçamento com sucesso', async () => {
      const mockQuote = createMockQuote({ items: [] });
      const updatedQuote = createMockQuote({ status: QuoteStatus.SENT });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue(
        updatedQuote,
      );

      const result = await service.update(
        mockTenantId,
        'quote-id',
        updateQuoteDto,
      );

      expect(result).toHaveProperty('status', QuoteStatus.SENT);
      expect(mockPrismaService.quote.update as jest.Mock).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se orçamento não existir', async () => {
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'quote-id', updateQuoteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se orçamento já foi convertido', async () => {
      const convertedQuote = createMockQuote({
        status: QuoteStatus.CONVERTED,
        items: [],
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        convertedQuote,
      );

      await expect(
        service.update(mockTenantId, 'quote-id', updateQuoteDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException em caso de erro genérico', async () => {
      const mockQuote = createMockQuote({ items: [] });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockRejectedValue(
        new Error('Erro genérico'),
      );

      await expect(
        service.update(mockTenantId, 'quote-id', updateQuoteDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve atualizar itens do orçamento', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
        items: [{ id: 'item-1' }],
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quoteItem.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      });
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        items: [],
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        items: [
          {
            type: QuoteItemType.SERVICE,
            name: 'Novo serviço',
            quantity: 1,
            unitCost: 100,
          },
        ],
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar customerId', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        customerId: 'new-customer-id',
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        customerId: 'new-customer-id',
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar vehicleId', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        vehicleId: 'new-vehicle-id',
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        vehicleId: 'new-vehicle-id',
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar elevatorId', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        elevatorId: 'new-elevator-id',
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        elevatorId: 'new-elevator-id',
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar laborCost e partsCost', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        laborCost: { toNumber: () => 300 } as unknown,
        partsCost: { toNumber: () => 400 } as unknown,
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        laborCost: 300,
        partsCost: 400,
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar discount e taxAmount', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        discount: { toNumber: () => 50 } as unknown,
        taxAmount: { toNumber: () => 100 } as unknown,
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        discount: 50,
        taxAmount: 100,
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar validUntil', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        validUntil: futureDate,
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        validUntil: futureDate.toISOString(),
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar reportedProblemCategory e reportedProblemDescription', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        reportedProblemCategory: ProblemCategory.MOTOR,
        reportedProblemDescription: 'Nova descrição',
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        reportedProblemCategory: ProblemCategory.MOTOR,
        reportedProblemDescription: 'Nova descrição',
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar reportedProblemSymptoms', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        reportedProblemSymptoms: ['sintoma1', 'sintoma2'],
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        reportedProblemSymptoms: ['sintoma1', 'sintoma2'],
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar identifiedProblemCategory e identifiedProblemDescription', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        identifiedProblemCategory: ProblemCategory.MOTOR,
        identifiedProblemDescription: 'Descrição identificada',
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        identifiedProblemCategory: ProblemCategory.MOTOR,
        identifiedProblemDescription: 'Descrição identificada',
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar identifiedProblemId', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        identifiedProblemId: 'problem-id',
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        identifiedProblemId: 'problem-id',
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar diagnosticNotes e inspectionNotes', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        diagnosticNotes: 'Notas do diagnóstico',
        inspectionNotes: 'Notas de inspeção',
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        diagnosticNotes: 'Notas do diagnóstico',
        inspectionNotes: 'Notas de inspeção',
      });

      expect(result).toBeDefined();
    });

    it('deve atualizar inspectionPhotos e recommendations', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue({
        ...mockQuote,
        inspectionPhotos: ['photo1.jpg', 'photo2.jpg'],
        recommendations: 'Recomendações',
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        inspectionPhotos: ['photo1.jpg', 'photo2.jpg'],
        recommendations: 'Recomendações',
      });

      expect(result).toBeDefined();
    });
  });

  describe('approve', () => {
    const approveQuoteDto = {
      customerSignature: 'data:image/png;base64,...',
    };

    it('deve aprovar orçamento e criar Service Order', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.SENT,
      });
      const acceptedQuote = createMockQuote({
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
        serviceOrderId: 'service-order-id',
      });
      const mockServiceOrder = {
        id: 'service-order-id',
        number: 'OS-001',
      };
      (mockPrismaService.quote.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockQuote) // findQuoteForApproval
        .mockResolvedValueOnce(mockQuote); // findQuoteByIdAndTenant
      mockServiceOrdersService.create.mockResolvedValue(mockServiceOrder);
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue(
        acceptedQuote,
      );
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);
      mockAppointmentsService.create.mockResolvedValue({});
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.approve(
        mockTenantId,
        'quote-id',
        approveQuoteDto,
      );

      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('serviceOrder');
      expect(result.quote.status).toBe(QuoteStatus.ACCEPTED);
      expect(mockServiceOrdersService.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se orçamento não existir', async () => {
      (mockPrismaService.quote.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // findQuoteForApproval
        .mockResolvedValueOnce(null); // findQuoteByIdAndTenant (não será chamado)

      await expect(
        service.approve(mockTenantId, 'quote-id', approveQuoteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se orçamento já foi convertido', async () => {
      const convertedQuote = createMockQuote({
        status: QuoteStatus.CONVERTED,
        assignedMechanic: null,
      });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValueOnce(
        convertedQuote,
      );

      await expect(
        service.approve(mockTenantId, 'quote-id', approveQuoteDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve aprovar orçamento com elevatorId e inspectionNotes', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.SENT,
        inspectionNotes: 'Notas de inspeção',
        assignedMechanic: null,
      });
      const acceptedQuote = createMockQuote({
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
        serviceOrderId: 'service-order-id',
      });
      const mockServiceOrder = {
        id: 'service-order-id',
        number: 'OS-001',
      };
      (mockPrismaService.quote.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockQuote) // findQuoteForApproval
        .mockResolvedValueOnce(mockQuote); // findQuoteByIdAndTenant
      mockServiceOrdersService.create.mockResolvedValue(mockServiceOrder);
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue(
        acceptedQuote,
      );
      mockPrismaService.elevator.findFirst.mockResolvedValue({
        id: 'elevator-id',
        name: 'Elevador 1',
      });
      mockAppointmentsService.create.mockResolvedValue({});
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.approve(mockTenantId, 'quote-id', {
        ...approveQuoteDto,
        elevatorId: 'elevator-id',
      });

      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('serviceOrder');
    });

    it('deve aprovar orçamento com dados completos do veículo', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.SENT,
        vehicle: {
          id: 'vehicle-id',
          placa: 'ABC1234',
          make: 'Honda',
          model: 'Civic',
          year: 2020,
          mileage: 50000,
        },
        assignedMechanic: null,
      });
      const acceptedQuote = createMockQuote({
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
        serviceOrderId: 'service-order-id',
      });
      const mockServiceOrder = {
        id: 'service-order-id',
        number: 'OS-001',
      };
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValueOnce(
        mockQuote,
      );
      mockServiceOrdersService.create.mockResolvedValue(mockServiceOrder);
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue(
        acceptedQuote,
      );
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);
      mockAppointmentsService.create.mockResolvedValue({});
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.approve(
        mockTenantId,
        'quote-id',
        approveQuoteDto,
      );

      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('serviceOrder');
    });

    it('deve aprovar orçamento sem veículo', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.SENT,
        vehicle: null,
        assignedMechanic: null,
      });
      const acceptedQuote = createMockQuote({
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
        serviceOrderId: 'service-order-id',
      });
      const mockServiceOrder = {
        id: 'service-order-id',
        number: 'OS-001',
      };
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValueOnce(
        mockQuote,
      );
      mockServiceOrdersService.create.mockResolvedValue(mockServiceOrder);
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue(
        acceptedQuote,
      );
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);
      mockAppointmentsService.create.mockResolvedValue({});
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.approve(
        mockTenantId,
        'quote-id',
        approveQuoteDto,
      );

      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('serviceOrder');
    });

    it('deve aprovar orçamento sem estimatedHours, calculando dos itens', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.SENT,
        estimatedHours: null,
        assignedMechanic: null,
        items: [
          {
            id: 'item-1',
            quoteId: 'quote-id',
            type: 'service',
            serviceId: null,
            partId: null,
            name: 'Troca de óleo',
            description: 'Troca de óleo do motor',
            quantity: 1,
            unitCost: { toNumber: () => 150 } as unknown,
            totalCost: { toNumber: () => 150 } as unknown,
            hours: { toNumber: () => 1.5 } as unknown,
          },
          {
            id: 'item-2',
            quoteId: 'quote-id',
            type: 'service',
            serviceId: null,
            partId: null,
            name: 'Troca de filtro',
            description: 'Troca de filtro de ar',
            quantity: 1,
            unitCost: { toNumber: () => 50 } as unknown,
            totalCost: { toNumber: () => 50 } as unknown,
            hours: { toNumber: () => 0.5 } as unknown,
          },
        ],
      });
      const acceptedQuote = createMockQuote({
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
        serviceOrderId: 'service-order-id',
      });
      const mockServiceOrder = {
        id: 'service-order-id',
        number: 'OS-001',
      };
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValueOnce(
        mockQuote,
      );
      (mockPrismaService.quote.findUnique as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      mockServiceOrdersService.create.mockResolvedValue(mockServiceOrder);
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue(
        acceptedQuote,
      );
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);
      mockAppointmentsService.create.mockResolvedValue({});
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.approve(
        mockTenantId,
        'quote-id',
        approveQuoteDto,
      );

      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('serviceOrder');
    });

    it('deve aprovar orçamento com estimatedHours como string (não objeto)', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.SENT,
        estimatedHours: '2.5' as unknown,
        assignedMechanic: null,
      });
      const acceptedQuote = createMockQuote({
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
        serviceOrderId: 'service-order-id',
      });
      const mockServiceOrder = {
        id: 'service-order-id',
        number: 'OS-001',
      };
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValueOnce(
        mockQuote,
      );
      mockServiceOrdersService.create.mockResolvedValue(mockServiceOrder);
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue(
        acceptedQuote,
      );
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);
      mockAppointmentsService.create.mockResolvedValue({});
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.approve(
        mockTenantId,
        'quote-id',
        approveQuoteDto,
      );

      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('serviceOrder');
    });
  });

  describe('remove', () => {
    it('deve remover orçamento com sucesso', async () => {
      const mockQuote = createMockQuote();
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      (mockPrismaService.quote.delete as jest.Mock).mockResolvedValue(
        mockQuote,
      );

      await service.remove(mockTenantId, 'quote-id');

      expect(mockPrismaService.quote.delete as jest.Mock).toHaveBeenCalledWith({
        where: { id: 'quote-id' },
      });
    });

    it('deve lançar NotFoundException se orçamento não existir', async () => {
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValueOnce(
        null,
      );

      await expect(service.remove(mockTenantId, 'quote-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException se orçamento foi convertido', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(
        createMockQuote({ status: QuoteStatus.CONVERTED }),
      );

      await expect(service.remove(mockTenantId, 'quote-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update - casos adicionais', () => {
    it('deve atualizar itens do orçamento', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.quoteItem.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.quoteItem.create.mockResolvedValue({
        id: 'new-item-id',
        quoteId: 'quote-id',
        type: 'service',
        name: 'Novo serviço',
        quantity: 2,
        unitCost: { toNumber: () => 100 } as unknown,
        totalCost: { toNumber: () => 200 } as unknown,
        hours: { toNumber: () => 1 } as unknown,
      });
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        totalCost: { toNumber: () => 200 } as unknown,
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        items: [
          {
            type: QuoteItemType.SERVICE,
            name: 'Novo serviço',
            quantity: 2,
            unitCost: 100,
            hours: 1,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(mockPrismaService.quoteItem.deleteMany).toHaveBeenCalled();
    });

    it('deve recalcular total ao atualizar', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.quoteItem.deleteMany.mockResolvedValue({ count: 0 });
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        totalCost: { toNumber: () => 600 } as unknown,
      });

      const result = await service.update(mockTenantId, 'quote-id', {
        laborCost: 300,
        partsCost: 300,
      });

      expect(result).toBeDefined();
    });

    it('deve lançar BadRequestException ao tentar adicionar itens antes do diagnóstico', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DRAFT,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);

      await expect(
        service.update(mockTenantId, 'quote-id', {
          items: [
            {
              type: QuoteItemType.SERVICE,
              name: 'Novo serviço',
              quantity: 1,
              unitCost: 100,
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException ao tentar editar custos antes do diagnóstico', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DRAFT,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);

      await expect(
        service.update(mockTenantId, 'quote-id', {
          laborCost: 300,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('sendForDiagnosis', () => {
    it('deve enviar orçamento para diagnóstico', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DRAFT,
        customerId: 'customer-id',
        vehicleId: 'vehicle-id',
        reportedProblemCategory: ProblemCategory.MOTOR,
        reportedProblemSymptoms: ['sintoma1'],
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockNotificationsService.notifyAllMechanics.mockResolvedValue(undefined);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.AWAITING_DIAGNOSIS,
      });

      const result = await service.sendForDiagnosis(mockTenantId, 'quote-id');

      expect(result.status).toBe(QuoteStatus.AWAITING_DIAGNOSIS);
      expect(mockNotificationsService.notifyAllMechanics).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se orçamento não existe', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.sendForDiagnosis(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se orçamento não está em rascunho', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.SENT,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);

      await expect(
        service.sendForDiagnosis(mockTenantId, 'quote-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se não houver cliente', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DRAFT,
        customerId: null,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);

      await expect(
        service.sendForDiagnosis(mockTenantId, 'quote-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se não houver veículo', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DRAFT,
        customerId: 'customer-id',
        vehicleId: null,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);

      await expect(
        service.sendForDiagnosis(mockTenantId, 'quote-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se não houver categoria ou sintomas', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DRAFT,
        customerId: 'customer-id',
        vehicleId: 'vehicle-id',
        reportedProblemCategory: null,
        reportedProblemSymptoms: [],
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);

      await expect(
        service.sendForDiagnosis(mockTenantId, 'quote-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeDiagnosis', () => {
    it('deve completar diagnóstico', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.AWAITING_DIAGNOSIS,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.SENT,
      });

      const result = await service.completeDiagnosis(mockTenantId, 'quote-id', {
        identifiedProblemCategory: ProblemCategory.MOTOR,
        identifiedProblemDescription: 'Problema identificado',
      });

      expect(result.status).toBe(QuoteStatus.SENT);
    });

    it('deve lançar NotFoundException se orçamento não existe', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

      await expect(
        service.completeDiagnosis(mockTenantId, 'non-existent', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se status não permitir conclusão', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DRAFT,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);

      await expect(
        service.completeDiagnosis(mockTenantId, 'quote-id', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve completar diagnóstico com identifiedProblemId', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.AWAITING_DIAGNOSIS,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.DIAGNOSED,
        identifiedProblemId: 'problem-id',
      });

      const result = await service.completeDiagnosis(mockTenantId, 'quote-id', {
        identifiedProblemId: 'problem-id',
      });

      expect(result).toBeDefined();
    });

    it('deve completar diagnóstico com recommendations', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.AWAITING_DIAGNOSIS,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.DIAGNOSED,
        recommendations: 'Recomendações',
      });

      const result = await service.completeDiagnosis(mockTenantId, 'quote-id', {
        recommendations: 'Recomendações',
      });

      expect(result).toBeDefined();
    });

    it('deve completar diagnóstico com diagnosticNotes', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.AWAITING_DIAGNOSIS,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.DIAGNOSED,
        diagnosticNotes: 'Notas do diagnóstico',
      });

      const result = await service.completeDiagnosis(mockTenantId, 'quote-id', {
        diagnosticNotes: 'Notas do diagnóstico',
      });

      expect(result).toBeDefined();
    });

    it('deve completar diagnóstico com estimatedHours', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.AWAITING_DIAGNOSIS,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.DIAGNOSED,
        estimatedHours: { toNumber: () => 5 } as unknown,
      });

      const result = await service.completeDiagnosis(mockTenantId, 'quote-id', {
        estimatedHours: 5,
      });

      expect(result).toBeDefined();
    });
  });

  describe('sendToCustomer', () => {
    it('deve enviar orçamento para cliente', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
        items: [{ id: 'item-1' }],
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.SENT,
        sentAt: new Date(),
      });

      const result = await service.sendToCustomer(mockTenantId, 'quote-id');

      expect(result.status).toBe(QuoteStatus.SENT);
    });

    it('deve lançar NotFoundException se orçamento não existe', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

      await expect(
        service.sendToCustomer(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se não houver itens', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DIAGNOSED,
        items: [],
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);

      await expect(
        service.sendToCustomer(mockTenantId, 'quote-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se status não permitir envio', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.DRAFT,
        items: [{ id: 'item-1' }],
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);

      await expect(
        service.sendToCustomer(mockTenantId, 'quote-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('rejectByPublicToken', () => {
    it('deve rejeitar orçamento por token público', async () => {
      const mockQuote = createMockQuote({
        publicToken: 'token-123',
        publicTokenExpiresAt: new Date(Date.now() + 86400000), // 1 dia no futuro
        status: QuoteStatus.SENT,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.REJECTED,
        rejectedAt: new Date(),
      });
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.rejectByPublicToken(
        'token-123',
        'Preço muito alto',
      );

      expect(result.status).toBe(QuoteStatus.REJECTED);
    });

    it('deve rejeitar orçamento por token público sem reason', async () => {
      const mockQuote = createMockQuote({
        publicToken: 'token-123',
        publicTokenExpiresAt: new Date(Date.now() + 86400000),
        status: QuoteStatus.SENT,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 'receptionist-id',
          role: 'receptionist',
          email: 'receptionist@email.com',
        },
      ]);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedReason: null,
      });
      mockNotificationsService.create.mockResolvedValue({});

      const result = await service.rejectByPublicToken('token-123');

      expect(result.status).toBe(QuoteStatus.REJECTED);
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });

    it('deve tratar erro ao criar notificação de rejeição', async () => {
      const mockQuote = createMockQuote({
        publicToken: 'token-123',
        publicTokenExpiresAt: new Date(Date.now() + 86400000),
        status: QuoteStatus.SENT,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 'receptionist-id',
          role: 'receptionist',
          email: 'receptionist@email.com',
        },
      ]);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedReason: null,
      });
      mockNotificationsService.create.mockRejectedValue(
        new Error('Erro ao criar notificação'),
      );

      const result = await service.rejectByPublicToken('token-123');

      expect(result.status).toBe(QuoteStatus.REJECTED);
    });

    it('deve lançar NotFoundException se token inválido', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

      await expect(
        service.rejectByPublicToken('invalid-token', ''),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('approveManually', () => {
    it('deve aprovar orçamento manualmente', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.SENT,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockServiceOrdersService.create.mockResolvedValue({
        id: 'service-order-id',
        number: 'OS-001',
      });
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        status: QuoteStatus.ACCEPTED,
        convertedAt: new Date(),
      });
      mockPrismaService.elevator.findFirst.mockResolvedValue(null);
      mockAppointmentsService.create.mockResolvedValue({});
      mockPrismaService.user.findMany.mockResolvedValue([]);

      const result = await service.approveManually(mockTenantId, 'quote-id');

      expect(result.quote.status).toBe(QuoteStatus.ACCEPTED);
    });

    it('deve lançar NotFoundException se orçamento não existe', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

      await expect(
        service.approveManually(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assignMechanic', () => {
    it('deve atribuir mecânico ao orçamento', async () => {
      const mockQuote = createMockQuote({
        assignedMechanic: {
          id: 'old-mechanic-id',
          name: 'Mecânico Antigo',
          email: 'old@email.com',
        },
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'mechanic-id',
        role: 'mechanic',
        name: 'Novo Mecânico',
        email: 'new@email.com',
      });
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        assignedMechanicId: 'mechanic-id',
        assignedMechanic: {
          id: 'mechanic-id',
          name: 'Novo Mecânico',
          email: 'new@email.com',
        },
      });

      const result = await service.assignMechanic(
        mockTenantId,
        'quote-id',
        {
          mechanicId: 'mechanic-id',
        },
        'admin-id',
        'admin',
      );

      expect(result).toBeDefined();
      expect(result.assignedMechanic).toBeDefined();
      expect(result.assignedMechanic?.id).toBe('mechanic-id');
      expect(result.assignedMechanic?.name).toBe('Novo Mecânico');
      expect(result.assignedMechanic?.email).toBe('new@email.com');
    });

    it('deve lançar NotFoundException se orçamento não existe', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

      await expect(
        service.assignMechanic(
          mockTenantId,
          'non-existent',
          {
            mechanicId: 'mechanic-id',
          },
          'admin-id',
          'admin',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se mecânico não existe', async () => {
      const mockQuote = createMockQuote();
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.assignMechanic(
          mockTenantId,
          'quote-id',
          {
            mechanicId: 'non-existent',
          },
          'admin-id',
          'admin',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('claimQuote', () => {
    it('deve reivindicar orçamento', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.AWAITING_DIAGNOSIS,
        assignedMechanicId: null,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: 'mechanic-id',
        role: 'mechanic',
      });
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        assignedMechanicId: 'mechanic-id',
      });
      mockPrismaService.quoteAssignmentHistory.create.mockResolvedValue({});
      mockPrismaService.quoteAssignmentHistory.updateMany.mockResolvedValue({
        count: 0,
      });

      const result = await service.claimQuote(
        mockTenantId,
        'quote-id',
        'mechanic-id',
      );

      expect(result).toBeDefined();
    });

    it('deve lançar NotFoundException se orçamento não existe', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

      await expect(
        service.claimQuote(mockTenantId, 'non-existent', 'mechanic-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se já está atribuído', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.AWAITING_DIAGNOSIS,
        assignedMechanicId: 'other-mechanic-id',
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);

      await expect(
        service.claimQuote(mockTenantId, 'quote-id', 'mechanic-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se status não permitir claim', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.SENT,
        assignedMechanicId: null,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);

      await expect(
        service.claimQuote(mockTenantId, 'quote-id', 'mechanic-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar NotFoundException se mecânico não existe', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.AWAITING_DIAGNOSIS,
        assignedMechanicId: null,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.claimQuote(mockTenantId, 'quote-id', 'non-existent-mechanic'),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve continuar mesmo se notificação falhar', async () => {
      const mockQuote = createMockQuote({
        status: QuoteStatus.AWAITING_DIAGNOSIS,
        assignedMechanicId: null,
      });
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.user.findFirst.mockResolvedValueOnce({
        id: 'mechanic-id',
        role: 'mechanic',
      });
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        assignedMechanicId: 'mechanic-id',
      });
      mockPrismaService.quoteAssignmentHistory.create.mockResolvedValue({});
      mockPrismaService.quoteAssignmentHistory.updateMany.mockResolvedValue({
        count: 0,
      });
      mockNotificationsService.create.mockRejectedValue(
        new Error('Erro ao criar notificação'),
      );

      const result = await service.claimQuote(
        mockTenantId,
        'quote-id',
        'mechanic-id',
      );

      expect(result).toBeDefined();
    });
  });

  describe('regeneratePublicToken', () => {
    it('deve regenerar token público', async () => {
      const mockQuote = createMockQuote();
      mockPrismaService.quote.findFirst.mockResolvedValueOnce(mockQuote);
      mockPrismaService.quote.update.mockResolvedValue({
        ...mockQuote,
        publicToken: 'new-token',
      });

      const result = await service.regeneratePublicToken(
        mockTenantId,
        'quote-id',
      );

      expect(result).toHaveProperty('publicToken');
    });

    it('deve lançar NotFoundException se orçamento não existe', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

      await expect(
        service.regeneratePublicToken(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll - filtros adicionais', () => {
    it('deve filtrar por status', async () => {
      const mockQuote = createMockQuote();
      mockPrismaService.$transaction.mockResolvedValue([[mockQuote], 1]);

      const result = await service.findAll(mockTenantId, {
        status: QuoteStatus.DRAFT,
      });

      expect(result.data).toHaveLength(1);
    });

    it('deve filtrar por cliente', async () => {
      const mockQuote = createMockQuote();
      mockPrismaService.$transaction.mockResolvedValue([[mockQuote], 1]);

      const result = await service.findAll(mockTenantId, {
        customerId: 'customer-id',
      });

      expect(result.data).toHaveLength(1);
    });

    it('deve filtrar por período', async () => {
      const mockQuote = createMockQuote();
      mockPrismaService.$transaction.mockResolvedValue([[mockQuote], 1]);

      const result = await service.findAll(mockTenantId, {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('generatePdf', () => {
    it('deve gerar PDF do orçamento', async () => {
      const mockQuote = createMockQuote();
      const pdfBuffer = Buffer.from('pdf');
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(
        mockQuote,
      );
      mockQuotePdfService.generatePdf.mockResolvedValue(pdfBuffer);

      const result = await service.generatePdf(mockTenantId, 'quote-id');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockQuotePdfService.generatePdf).toHaveBeenCalled();
    });
  });
});
