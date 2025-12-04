import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '@database/prisma.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentStatus,
  PaymentMethod,
} from './dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('PaymentsService', () => {
  let service: PaymentsService;

  const mockTenantId = 'tenant-id';
  const mockPaymentId = 'payment-id';
  const mockInvoiceId = 'invoice-id';

  const mockPayment = {
    id: mockPaymentId,
    tenantId: mockTenantId,
    invoiceId: mockInvoiceId,
    amount: new Decimal(1000.0),
    method: PaymentMethod.CREDIT_CARD,
    status: PaymentStatus.PENDING,
    paidAt: null,
    transactionId: null,
    installments: 1,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    invoice: {
      id: mockInvoiceId,
      invoiceNumber: 'FAT-001',
      total: new Decimal(1000.0),
      status: 'issued',
    },
  };

  const mockPrismaService = {
    payment: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    invoice: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => {
      return callback(mockPrismaService);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createPaymentDto: CreatePaymentDto = {
      invoiceId: mockInvoiceId,
      amount: 1000.0,
      method: PaymentMethod.CREDIT_CARD,
      status: PaymentStatus.PENDING,
      installments: 1,
    };

    it('deve criar um pagamento com sucesso', async () => {
      // Mock: fatura existe
      mockPrismaService.invoice.findFirst.mockResolvedValueOnce({
        id: mockInvoiceId,
        total: new Decimal(1000.0),
      });

      // Mock: não há pagamentos existentes (para verificação de valor)
      mockPrismaService.payment.findMany.mockResolvedValueOnce([]);

      // Mock: criar pagamento
      mockPrismaService.payment.create.mockResolvedValueOnce(mockPayment);

      // Mock: atualizar status da fatura (não será chamado pois status não é COMPLETED)
      // Este mock não é necessário pois o status não é COMPLETED

      const result = await service.create(mockTenantId, createPaymentDto);

      expect(result).toHaveProperty('id', mockPaymentId);
      expect(result).toHaveProperty('amount', 1000.0);
      expect(result).toHaveProperty('method', PaymentMethod.CREDIT_CARD);
      expect(mockPrismaService.payment.create).toHaveBeenCalled();
    });

    it('deve lançar erro se fatura não encontrada', async () => {
      // Mock: fatura não encontrada
      mockPrismaService.invoice.findFirst.mockResolvedValueOnce(null);
      // Mock: payment.findMany não será chamado pois a fatura não existe
      mockPrismaService.payment.findMany.mockResolvedValueOnce([]);

      await expect(
        service.create(mockTenantId, createPaymentDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se valor excede fatura', async () => {
      // Mock: fatura existe com valor menor
      mockPrismaService.invoice.findFirst.mockResolvedValueOnce({
        id: mockInvoiceId,
        total: new Decimal(500.0),
      });
      // Mock: não há pagamentos existentes
      mockPrismaService.payment.findMany.mockResolvedValueOnce([]);

      const dtoWithExcessAmount = { ...createPaymentDto, amount: 1000.0 };

      await expect(
        service.create(mockTenantId, dtoWithExcessAmount),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('deve listar pagamentos com sucesso', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockPayment], 1]);

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
    it('deve buscar pagamento por ID com sucesso', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue(mockPayment);

      const result = await service.findOne(mockTenantId, mockPaymentId);

      expect(result).toHaveProperty('id', mockPaymentId);
      expect(result).toHaveProperty('amount', 1000.0);
    });

    it('deve lançar erro se pagamento não encontrado', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, mockPaymentId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updatePaymentDto: UpdatePaymentDto = {
      amount: 1200.0,
      status: PaymentStatus.COMPLETED,
    };

    it('deve atualizar pagamento com sucesso', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValueOnce({
        ...mockPayment,
        status: PaymentStatus.PENDING,
      });
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        amount: new Decimal(1200.0),
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      });

      // Mock: atualizar status da fatura (chamado internamente)
      mockPrismaService.invoice.findFirst.mockResolvedValueOnce({
        id: mockInvoiceId,
        total: new Decimal(1000.0),
        payments: [
          {
            id: mockPaymentId,
            amount: new Decimal(1200.0),
            status: PaymentStatus.COMPLETED,
          },
        ],
      });
      mockPrismaService.invoice.update.mockResolvedValueOnce({});

      const result = await service.update(
        mockTenantId,
        mockPaymentId,
        updatePaymentDto,
      );

      expect(result).toHaveProperty('id', mockPaymentId);
      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(mockPrismaService.payment.update).toHaveBeenCalled();
    });

    it('deve lançar erro se tentar atualizar pagamento reembolsado', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.REFUNDED,
      });

      await expect(
        service.update(mockTenantId, mockPaymentId, updatePaymentDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('deve remover pagamento com sucesso', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PENDING,
      });
      mockPrismaService.payment.delete.mockResolvedValue(mockPayment);

      // Mock: atualizar status da fatura
      mockPrismaService.invoice.findFirst.mockResolvedValueOnce({
        id: mockInvoiceId,
        total: new Decimal(1000.0),
        payments: [],
      });

      await service.remove(mockTenantId, mockPaymentId);

      expect(mockPrismaService.payment.delete).toHaveBeenCalled();
    });

    it('deve lançar erro se tentar remover pagamento completo', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
      });

      await expect(service.remove(mockTenantId, mockPaymentId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve lançar erro se tentar remover pagamento reembolsado', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.REFUNDED,
      });

      await expect(service.remove(mockTenantId, mockPaymentId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('create - casos adicionais', () => {
    it('deve criar pagamento sem fatura', async () => {
      const createPaymentDto: CreatePaymentDto = {
        amount: 1000.0,
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        installments: 1,
      };

      mockPrismaService.payment.create.mockResolvedValueOnce({
        ...mockPayment,
        invoiceId: null,
      });

      const result = await service.create(mockTenantId, createPaymentDto);

      expect(result).toHaveProperty('id', mockPaymentId);
      expect(result.invoiceId).toBeUndefined();
    });

    it('deve criar pagamento com status COMPLETED e atualizar fatura', async () => {
      const createPaymentDto: CreatePaymentDto = {
        invoiceId: mockInvoiceId,
        amount: 1000.0,
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.COMPLETED,
        installments: 1,
      };

      mockPrismaService.invoice.findFirst.mockResolvedValueOnce({
        id: mockInvoiceId,
        total: new Decimal(1000.0),
      });
      mockPrismaService.payment.findMany.mockResolvedValueOnce([]);
      mockPrismaService.payment.create.mockResolvedValueOnce({
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date(),
      });
      mockPrismaService.invoice.findFirst.mockResolvedValueOnce({
        id: mockInvoiceId,
        total: new Decimal(1000.0),
        payments: [
          {
            id: mockPaymentId,
            amount: new Decimal(1000.0),
            status: PaymentStatus.COMPLETED,
          },
        ],
      });
      mockPrismaService.invoice.update.mockResolvedValueOnce({});

      const result = await service.create(mockTenantId, createPaymentDto);

      expect(result.status).toBe(PaymentStatus.COMPLETED);
      expect(mockPrismaService.invoice.update).toHaveBeenCalled();
    });

    it('deve validar que pagamentos existentes não excedem fatura', async () => {
      const createPaymentDto: CreatePaymentDto = {
        invoiceId: mockInvoiceId,
        amount: 500.0,
        method: PaymentMethod.CREDIT_CARD,
        status: PaymentStatus.PENDING,
        installments: 1,
      };

      mockPrismaService.invoice.findFirst.mockResolvedValueOnce({
        id: mockInvoiceId,
        total: new Decimal(1000.0),
      });
      mockPrismaService.payment.findMany.mockResolvedValueOnce([
        {
          id: 'existing-payment',
          amount: new Decimal(600.0),
          status: PaymentStatus.COMPLETED,
        },
      ]);

      await expect(
        service.create(mockTenantId, createPaymentDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll - casos adicionais', () => {
    it('deve filtrar pagamentos por fatura', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockPayment], 1]);

      const result = await service.findAll(mockTenantId, {
        invoiceId: mockInvoiceId,
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
    });

    it('deve filtrar pagamentos por método', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockPayment], 1]);

      const result = await service.findAll(mockTenantId, {
        method: PaymentMethod.CREDIT_CARD,
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
    });

    it('deve filtrar pagamentos por status', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockPayment], 1]);

      const result = await service.findAll(mockTenantId, {
        status: PaymentStatus.PENDING,
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
    });

    it('deve filtrar pagamentos por período', async () => {
      mockPrismaService.$transaction.mockResolvedValue([[mockPayment], 1]);

      const result = await service.findAll(mockTenantId, {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
    });
  });

  describe('update - casos adicionais', () => {
    it('deve atualizar apenas amount', async () => {
      const updatePaymentDto: UpdatePaymentDto = {
        amount: 1500.0,
      };

      mockPrismaService.payment.findFirst.mockResolvedValueOnce({
        ...mockPayment,
        status: PaymentStatus.PENDING,
      });
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        amount: new Decimal(1500.0),
      });

      const result = await service.update(
        mockTenantId,
        mockPaymentId,
        updatePaymentDto,
      );

      expect(result.amount).toBe(1500.0);
    });

    it('deve atualizar apenas method', async () => {
      const updatePaymentDto: UpdatePaymentDto = {
        method: PaymentMethod.PIX,
      };

      mockPrismaService.payment.findFirst.mockResolvedValueOnce({
        ...mockPayment,
        status: PaymentStatus.PENDING,
      });
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        method: PaymentMethod.PIX,
      });

      const result = await service.update(
        mockTenantId,
        mockPaymentId,
        updatePaymentDto,
      );

      expect(result.method).toBe(PaymentMethod.PIX);
    });

    it('não deve atualizar fatura se pagamento não foi completado', async () => {
      const updatePaymentDto: UpdatePaymentDto = {
        status: PaymentStatus.PENDING,
      };

      mockPrismaService.payment.findFirst.mockResolvedValueOnce({
        ...mockPayment,
        status: PaymentStatus.PENDING,
      });
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        status: PaymentStatus.PENDING,
      });

      await service.update(mockTenantId, mockPaymentId, updatePaymentDto);

      expect(mockPrismaService.invoice.update).not.toHaveBeenCalled();
    });
  });
});
