import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { PrismaService } from '@database/prisma.service';
import { ElevatorsService } from '../elevators/elevators.service';
import { ServiceOrdersService } from '../service-orders/service-orders.service';
import { QuotePdfService } from './pdf/quote-pdf.service';
import { CreateQuoteDto, QuoteStatus, QuoteItemType } from './dto';

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
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    quoteItem: {
      deleteMany: jest.fn(),
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
    $transaction: jest.fn((callback) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback.map((promise) => promise));
      }
      return callback(mockPrismaService);
    }),
  };

  const mockElevatorsService = {
    reserve: jest.fn(),
  };

  const mockServiceOrdersService = {
    create: jest.fn(),
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
          useValue: mockPrismaService,
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
          provide: QuotePdfService,
          useValue: mockQuotePdfService,
        },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-id',
        tenantId: mockTenantId,
      });
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue({
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      });
      mockPrismaService.quote.findFirst.mockResolvedValue(null);
      mockPrismaService.quote.create.mockResolvedValue(createMockQuote());

      const result = await service.create(mockTenantId, createQuoteDto);

      expect(result).toHaveProperty('id', 'quote-id');
      expect(result).toHaveProperty('number', 'ORC-001');
      expect(mockPrismaService.quote.create).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se cliente não existir', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockTenantId, createQuoteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se veículo não existir', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-id',
        tenantId: mockTenantId,
      });
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue(null);

      await expect(
        service.create(mockTenantId, createQuoteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se não houver itens', async () => {
      const dtoWithoutItems: CreateQuoteDto = {
        customerId: 'customer-id',
        vehicleId: 'vehicle-id',
        items: [],
      };

      // Mockar validações anteriores para que o erro de itens seja o primeiro
      mockPrismaService.customer.findFirst.mockResolvedValue({
        id: 'customer-id',
        tenantId: mockTenantId,
      });
      mockPrismaService.customerVehicle.findFirst.mockResolvedValue({
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      });

      await expect(
        service.create(mockTenantId, dtoWithoutItems),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de orçamentos', async () => {
      mockPrismaService.$transaction.mockResolvedValue([
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
  });

  describe('findOne', () => {
    it('deve retornar orçamento encontrado', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(createMockQuote());

      const result = await service.findOne(mockTenantId, 'quote-id');

      expect(result).toHaveProperty('id', 'quote-id');
      expect(mockPrismaService.quote.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'quote-id',
          tenantId: mockTenantId,
        },
        include: expect.any(Object),
      });
    });

    it('deve lançar NotFoundException se orçamento não existir', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

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
      mockPrismaService.quote.findFirst.mockResolvedValue(mockQuote);
      mockPrismaService.quote.update.mockResolvedValue(
        createMockQuote({ status: QuoteStatus.SENT }),
      );

      const result = await service.update(
        mockTenantId,
        'quote-id',
        updateQuoteDto,
      );

      expect(result).toHaveProperty('status', QuoteStatus.SENT);
      expect(mockPrismaService.quote.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se orçamento não existir', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'quote-id', updateQuoteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se orçamento já foi convertido', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(
        createMockQuote({ status: QuoteStatus.CONVERTED, items: [] }),
      );

      await expect(
        service.update(mockTenantId, 'quote-id', updateQuoteDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approve', () => {
    const approveQuoteDto = {
      customerSignature: 'data:image/png;base64,...',
    };

    it('deve aprovar orçamento e criar Service Order', async () => {
      const mockQuote = createMockQuote();
      mockPrismaService.quote.findFirst.mockResolvedValue(mockQuote);
      mockServiceOrdersService.create.mockResolvedValue({
        id: 'service-order-id',
        number: 'OS-001',
      });
      mockPrismaService.quote.update.mockResolvedValue(
        createMockQuote({
          status: QuoteStatus.ACCEPTED,
          acceptedAt: new Date(),
          serviceOrderId: 'service-order-id',
        }),
      );

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
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

      await expect(
        service.approve(mockTenantId, 'quote-id', approveQuoteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se orçamento já foi convertido', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(
        createMockQuote({ status: QuoteStatus.CONVERTED }),
      );

      await expect(
        service.approve(mockTenantId, 'quote-id', approveQuoteDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deve remover orçamento com sucesso', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(createMockQuote());
      mockPrismaService.quote.delete.mockResolvedValue(createMockQuote());

      await service.remove(mockTenantId, 'quote-id');

      expect(mockPrismaService.quote.delete).toHaveBeenCalledWith({
        where: { id: 'quote-id' },
      });
    });

    it('deve lançar NotFoundException se orçamento não existir', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(null);

      await expect(service.remove(mockTenantId, 'quote-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deve lançar BadRequestException se orçamento foi convertido', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(
        createMockQuote({ status: QuoteStatus.CONVERTED }),
      );

      await expect(service.remove(mockTenantId, 'quote-id')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('generatePdf', () => {
    it('deve gerar PDF do orçamento', async () => {
      mockPrismaService.quote.findFirst.mockResolvedValue(createMockQuote());
      mockQuotePdfService.generatePdf.mockResolvedValue(Buffer.from('pdf'));

      const result = await service.generatePdf(mockTenantId, 'quote-id');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockQuotePdfService.generatePdf).toHaveBeenCalled();
    });
  });
});
