import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { PrismaService } from '@database/prisma.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceStatus,
  PaymentStatus,
  InvoiceType,
  InvoiceItemType,
} from './dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('InvoicingService', () => {
  let service: InvoicingService;

  const mockTenantId = 'tenant-id';
  const mockInvoiceId = 'invoice-id';
  const mockCustomerId = 'customer-id';
  const mockServiceOrderId = 'service-order-id';

  const mockInvoice = {
    id: mockInvoiceId,
    tenantId: mockTenantId,
    invoiceNumber: 'FAT-001',
    serviceOrderId: mockServiceOrderId,
    customerId: mockCustomerId,
    type: InvoiceType.SERVICE,
    total: new Decimal(1000.0),
    discount: new Decimal(0),
    taxAmount: new Decimal(0),
    paymentMethod: 'credit_card',
    paymentStatus: PaymentStatus.PENDING,
    status: InvoiceStatus.DRAFT,
    dueDate: null,
    nfeKey: null,
    nfeXmlUrl: null,
    nfePdfUrl: null,
    nfeStatus: null,
    paidAt: null,
    issuedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    customer: {
      id: mockCustomerId,
      name: 'Cliente Teste',
      phone: '11999999999',
      email: 'cliente@teste.com',
    },
    serviceOrder: {
      id: mockServiceOrderId,
      number: 'OS-001',
      status: 'completed',
    },
    items: [
      {
        id: 'item-id',
        type: 'service',
        name: 'Serviço Teste',
        description: 'Descrição do serviço',
        quantity: 1,
        unitPrice: new Decimal(1000.0),
        totalPrice: new Decimal(1000.0),
      },
    ],
  };

  const mockPrismaService = {
    invoice: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    customer: {
      findFirst: jest.fn(),
    },
    serviceOrder: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((callback) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<InvoicingService>(InvoicingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createInvoiceDto: CreateInvoiceDto = {
      serviceOrderId: mockServiceOrderId,
      customerId: mockCustomerId,
      type: InvoiceType.SERVICE,
      items: [
        {
          type: InvoiceItemType.SERVICE,
          name: 'Serviço Teste',
          description: 'Descrição do serviço',
          quantity: 1,
          unitPrice: 1000.0,
          totalPrice: 1000.0,
        },
      ],
      total: 1000.0,
      discount: 0,
      taxAmount: 0,
      paymentMethod: 'credit_card',
      paymentStatus: PaymentStatus.PENDING,
      status: InvoiceStatus.DRAFT,
    };

    it('deve criar uma fatura com sucesso', async () => {
      // Mock: cliente existe
      mockPrismaService.customer.findFirst.mockResolvedValueOnce({
        id: mockCustomerId,
        name: 'Cliente Teste',
      });

      // Mock: ordem de serviço existe
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce({
        id: mockServiceOrderId,
        number: 'OS-001',
      });

      // Mock: não existe fatura para esta OS
      mockPrismaService.invoice.findFirst.mockResolvedValueOnce(null);

      // Mock: número de fatura não existe
      mockPrismaService.invoice.findUnique.mockResolvedValueOnce(null);

      // Mock: criar fatura
      mockPrismaService.invoice.create.mockResolvedValue(mockInvoice);

      const result = await service.create(mockTenantId, createInvoiceDto);

      expect(result).toHaveProperty('id', mockInvoiceId);
      expect(result).toHaveProperty('invoiceNumber', 'FAT-001');
      expect(result).toHaveProperty('type', InvoiceType.SERVICE);
      expect(mockPrismaService.invoice.create).toHaveBeenCalled();
    });

    it('deve lançar erro se cliente não encontrado', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.create(mockTenantId, createInvoiceDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se ordem de serviço não encontrada', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValueOnce({
        id: mockCustomerId,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.create(mockTenantId, createInvoiceDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se já existe fatura para a OS', async () => {
      mockPrismaService.customer.findFirst.mockResolvedValueOnce({
        id: mockCustomerId,
      });
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce({
        id: mockServiceOrderId,
      });
      mockPrismaService.invoice.findFirst.mockResolvedValueOnce({
        id: 'existing-invoice-id',
      });

      await expect(
        service.create(mockTenantId, createInvoiceDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se fatura não tem itens', async () => {
      const dtoWithoutItems = { ...createInvoiceDto, items: [] };

      // Mock: cliente existe (para não falhar antes)
      mockPrismaService.customer.findFirst.mockResolvedValueOnce({
        id: mockCustomerId,
        name: 'Cliente Teste',
      });
      // Mock: serviceOrder existe (para não falhar antes)
      mockPrismaService.serviceOrder.findFirst.mockResolvedValueOnce({
        id: mockServiceOrderId,
      });
      // Mock: não existe fatura para esta OS
      mockPrismaService.invoice.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.create(mockTenantId, dtoWithoutItems),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('deve listar faturas com sucesso', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockInvoice], 1]);

      const result = await service.findAll(mockTenantId, {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });
  });

  describe('findOne', () => {
    it('deve buscar fatura por ID com sucesso', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(mockInvoice);

      const result = await service.findOne(mockTenantId, mockInvoiceId);

      expect(result).toHaveProperty('id', mockInvoiceId);
      expect(result).toHaveProperty('invoiceNumber', 'FAT-001');
    });

    it('deve lançar erro se fatura não encontrada', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, mockInvoiceId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateInvoiceDto: UpdateInvoiceDto = {
      total: 1200.0,
      discount: 100.0,
    };

    it('deve atualizar fatura com sucesso', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValueOnce({
        ...mockInvoice,
        status: InvoiceStatus.DRAFT,
      });
      mockPrismaService.invoice.update.mockResolvedValue({
        ...mockInvoice,
        total: new Decimal(1200.0),
        discount: new Decimal(100.0),
      });

      const result = await service.update(
        mockTenantId,
        mockInvoiceId,
        updateInvoiceDto,
      );

      expect(result).toHaveProperty('id', mockInvoiceId);
      expect(mockPrismaService.invoice.update).toHaveBeenCalled();
    });

    it('deve lançar erro se fatura não encontrada', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, mockInvoiceId, updateInvoiceDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se tentar atualizar fatura emitida', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.ISSUED,
      });

      await expect(
        service.update(mockTenantId, mockInvoiceId, updateInvoiceDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deve remover fatura com sucesso', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.DRAFT,
      });
      mockPrismaService.invoice.delete.mockResolvedValue(mockInvoice);

      await service.remove(mockTenantId, mockInvoiceId);

      expect(mockPrismaService.invoice.delete).toHaveBeenCalled();
    });

    it('deve lançar erro se tentar remover fatura emitida', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.ISSUED,
      });

      await expect(service.remove(mockTenantId, mockInvoiceId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('issue', () => {
    it('deve emitir fatura com sucesso', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.DRAFT,
      });
      mockPrismaService.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.ISSUED,
        issuedAt: new Date(),
      });

      const result = await service.issue(mockTenantId, mockInvoiceId);

      expect(result.status).toBe(InvoiceStatus.ISSUED);
      expect(mockPrismaService.invoice.update).toHaveBeenCalled();
    });

    it('deve lançar erro se fatura já foi emitida', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.ISSUED,
      });

      await expect(service.issue(mockTenantId, mockInvoiceId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('cancel', () => {
    it('deve cancelar fatura com sucesso', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
      });
      mockPrismaService.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.CANCELLED,
      });

      const result = await service.cancel(mockTenantId, mockInvoiceId);

      expect(result.status).toBe(InvoiceStatus.CANCELLED);
      expect(mockPrismaService.invoice.update).toHaveBeenCalled();
    });

    it('deve lançar erro se fatura já está paga', async () => {
      mockPrismaService.invoice.findFirst.mockResolvedValue({
        ...mockInvoice,
        paymentStatus: PaymentStatus.PAID,
      });

      await expect(service.cancel(mockTenantId, mockInvoiceId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
