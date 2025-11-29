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
    $transaction: jest.fn((callback: unknown) => {
      if (Array.isArray(callback)) {
        return Promise.all(callback.map((promise: Promise<unknown>) => promise));
      }
      return (callback as (prisma: typeof mockPrismaService) => unknown)(mockPrismaService);
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
      const mockCustomer = {
        id: 'customer-id',
        tenantId: mockTenantId,
      };
      const mockVehicle = {
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      };
      const mockQuote = createMockQuote();
      
      (mockPrismaService.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);
      (mockPrismaService.customerVehicle.findFirst as jest.Mock).mockResolvedValue(mockVehicle);
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(null);
      (mockPrismaService.quote.create as jest.Mock).mockResolvedValue(mockQuote);

      const result = await service.create(mockTenantId, createQuoteDto);

      expect(result).toHaveProperty('id', 'quote-id');
      expect(result).toHaveProperty('number', 'ORC-001');
      expect(mockPrismaService.quote.create as jest.Mock).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se cliente não existir', async () => {
      (mockPrismaService.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(mockTenantId, createQuoteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se veículo não existir', async () => {
      const mockCustomer = {
        id: 'customer-id',
        tenantId: mockTenantId,
      };
      (mockPrismaService.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);
      (mockPrismaService.customerVehicle.findFirst as jest.Mock).mockResolvedValue(null);

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
      const mockCustomer = {
        id: 'customer-id',
        tenantId: mockTenantId,
      };
      const mockVehicle = {
        id: 'vehicle-id',
        customer: { tenantId: mockTenantId },
      };
      (mockPrismaService.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);
      (mockPrismaService.customerVehicle.findFirst as jest.Mock).mockResolvedValue(mockVehicle);

      await expect(
        service.create(mockTenantId, dtoWithoutItems),
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
  });

  describe('findOne', () => {
    it('deve retornar orçamento encontrado', async () => {
      const mockQuote = createMockQuote();
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(mockQuote);

      const result = await service.findOne(mockTenantId, 'quote-id');

      expect(result).toHaveProperty('id', 'quote-id');
      expect(mockPrismaService.quote.findFirst as jest.Mock).toHaveBeenCalledWith({
        where: {
          id: 'quote-id',
          tenantId: mockTenantId,
        },
        include: expect.any(Object),
      });
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
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(mockQuote);
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue(updatedQuote);

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
      const convertedQuote = createMockQuote({ status: QuoteStatus.CONVERTED, items: [] });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(convertedQuote);

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
      const acceptedQuote = createMockQuote({
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
        serviceOrderId: 'service-order-id',
      });
      const mockServiceOrder = {
        id: 'service-order-id',
        number: 'OS-001',
      };
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(mockQuote);
      (mockServiceOrdersService.create as jest.Mock).mockResolvedValue(mockServiceOrder);
      (mockPrismaService.quote.update as jest.Mock).mockResolvedValue(acceptedQuote);

      const result = await service.approve(
        mockTenantId,
        'quote-id',
        approveQuoteDto,
      );

      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('serviceOrder');
      expect(result.quote.status).toBe(QuoteStatus.ACCEPTED);
      expect(mockServiceOrdersService.create as jest.Mock).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se orçamento não existir', async () => {
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.approve(mockTenantId, 'quote-id', approveQuoteDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar BadRequestException se orçamento já foi convertido', async () => {
      const convertedQuote = createMockQuote({ status: QuoteStatus.CONVERTED });
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(convertedQuote);

      await expect(
        service.approve(mockTenantId, 'quote-id', approveQuoteDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deve remover orçamento com sucesso', async () => {
      const mockQuote = createMockQuote();
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(mockQuote);
      (mockPrismaService.quote.delete as jest.Mock).mockResolvedValue(mockQuote);

      await service.remove(mockTenantId, 'quote-id');

      expect(mockPrismaService.quote.delete as jest.Mock).toHaveBeenCalledWith({
        where: { id: 'quote-id' },
      });
    });

    it('deve lançar NotFoundException se orçamento não existir', async () => {
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(null);

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
      const mockQuote = createMockQuote();
      const pdfBuffer = Buffer.from('pdf');
      (mockPrismaService.quote.findFirst as jest.Mock).mockResolvedValue(mockQuote);
      (mockQuotePdfService.generatePdf as jest.Mock).mockResolvedValue(pdfBuffer);

      const result = await service.generatePdf(mockTenantId, 'quote-id');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockQuotePdfService.generatePdf as jest.Mock).toHaveBeenCalled();
    });
  });
});
