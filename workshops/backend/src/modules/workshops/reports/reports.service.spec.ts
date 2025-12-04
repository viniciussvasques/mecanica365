import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '@database/prisma.service';
import { GenerateReportDto, ReportType, ReportFormat } from './dto';
import { Decimal } from '@prisma/client/runtime/library';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockTenantId = 'tenant-id';

  const mockPrismaService = {
    serviceOrder: {
      findMany: jest.fn(),
    },
    invoice: {
      findMany: jest.fn(),
    },
    payment: {
      findMany: jest.fn(),
    },
    part: {
      findMany: jest.fn(),
    },
    customer: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    quote: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('deve gerar relatório de vendas com sucesso', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.SALES,
        format: ReportFormat.PDF,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      mockPrismaService.serviceOrder.findMany.mockResolvedValue([]);
      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(ReportType.SALES);
      expect(result.format).toBe(ReportFormat.PDF);
      expect(result).toHaveProperty('downloadUrl');
      expect(result).toHaveProperty('summary');
    });

    it('deve gerar relatório de serviços com sucesso', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.SERVICES,
        format: ReportFormat.EXCEL,
      };

      mockPrismaService.serviceOrder.findMany.mockResolvedValue([]);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(ReportType.SERVICES);
      expect(result.format).toBe(ReportFormat.EXCEL);
    });

    it('deve gerar relatório financeiro com sucesso', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.FINANCIAL,
        format: ReportFormat.CSV,
      };

      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.payment.findMany.mockResolvedValue([]);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(ReportType.FINANCIAL);
      expect(result.format).toBe(ReportFormat.CSV);
    });

    it('deve gerar relatório de estoque com sucesso', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.INVENTORY,
        format: ReportFormat.PDF,
      };

      mockPrismaService.part.findMany.mockResolvedValue([]);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(ReportType.INVENTORY);
    });

    it('deve gerar relatório de clientes com sucesso', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.CUSTOMERS,
        format: ReportFormat.PDF,
      };

      mockPrismaService.customer.findMany.mockResolvedValue([]);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(ReportType.CUSTOMERS);
    });

    it('deve gerar relatório de mecânicos com sucesso', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.MECHANICS,
        format: ReportFormat.PDF,
      };

      mockPrismaService.user.findMany.mockResolvedValue([]);
      mockPrismaService.serviceOrder.findMany.mockResolvedValue([]);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(ReportType.MECHANICS);
    });

    it('deve gerar relatório de orçamentos com sucesso', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.QUOTES,
        format: ReportFormat.PDF,
      };

      mockPrismaService.quote.findMany.mockResolvedValue([]);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(ReportType.QUOTES);
    });

    it('deve gerar relatório de faturas com sucesso', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.INVOICES,
        format: ReportFormat.PDF,
      };

      mockPrismaService.invoice.findMany.mockResolvedValue([]);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(ReportType.INVOICES);
    });

    it('deve gerar relatório de pagamentos com sucesso', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.PAYMENTS,
        format: ReportFormat.PDF,
      };

      mockPrismaService.payment.findMany.mockResolvedValue([]);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(ReportType.PAYMENTS);
    });

    it('deve lançar erro se data inicial maior que data final', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.SALES,
        format: ReportFormat.PDF,
        startDate: '2024-12-31',
        endDate: '2024-01-01',
      };

      await expect(
        service.generate(mockTenantId, generateReportDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar erro se tipo de relatório inválido', async () => {
      const generateReportDto = {
        type: 'invalid_type' as unknown as ReportType,
        format: ReportFormat.PDF,
      };

      await expect(
        service.generate(mockTenantId, generateReportDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve gerar relatório de vendas com dados reais', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.SALES,
        format: ReportFormat.PDF,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const mockServiceOrders = [
        {
          id: 'so-1',
          totalCost: new Decimal(500.0),
          status: 'completed',
          customer: { id: 'c1', name: 'Cliente 1' },
        },
      ];

      const mockInvoices = [
        {
          id: 'inv-1',
          total: new Decimal(1000.0),
          status: 'issued',
          customer: { id: 'c1', name: 'Cliente 1' },
        },
      ];

      mockPrismaService.serviceOrder.findMany.mockResolvedValue(
        mockServiceOrders,
      );
      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalRevenue');
    });

    it('deve gerar relatório de serviços com dados reais', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.SERVICES,
        format: ReportFormat.EXCEL,
      };

      const mockServiceOrders = [
        {
          id: 'so-1',
          status: 'completed',
          customer: { id: 'c1', name: 'Cliente 1' },
          technician: { id: 't1', name: 'Mecânico 1' },
        },
        {
          id: 'so-2',
          status: 'in_progress',
          customer: { id: 'c2', name: 'Cliente 2' },
          technician: { id: 't1', name: 'Mecânico 1' },
        },
      ];

      mockPrismaService.serviceOrder.findMany.mockResolvedValue(
        mockServiceOrders,
      );

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('total');
    });

    it('deve gerar relatório financeiro com dados reais', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.FINANCIAL,
        format: ReportFormat.CSV,
      };

      const mockInvoices = [
        {
          id: 'inv-1',
          total: new Decimal(1000.0),
          status: 'issued',
          customer: { id: 'c1', name: 'Cliente 1' },
        },
      ];

      const mockPayments = [
        {
          id: 'pay-1',
          amount: new Decimal(1000.0),
          method: 'credit_card',
          status: 'completed',
          invoice: { id: 'inv-1', invoiceNumber: 'FAT-001' },
        },
      ];

      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);
      mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('summary');
    });

    it('deve gerar relatório de estoque com dados reais', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.INVENTORY,
        format: ReportFormat.PDF,
      };

      const mockParts = [
        {
          id: 'part-1',
          name: 'Peça 1',
          quantity: 10,
          minQuantity: 5,
          costPrice: new Decimal(50.0),
          sellPrice: new Decimal(80.0),
        },
      ];

      mockPrismaService.part.findMany.mockResolvedValue(mockParts);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
    });

    it('deve gerar relatório de clientes com dados reais', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.CUSTOMERS,
        format: ReportFormat.PDF,
      };

      const mockCustomers = [
        {
          id: 'c1',
          name: 'Cliente 1',
          _count: { serviceOrders: 5, quotes: 3 },
        },
      ];

      mockPrismaService.customer.findMany.mockResolvedValue(mockCustomers);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
    });

    it('deve gerar relatório de mecânicos com dados reais', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.MECHANICS,
        format: ReportFormat.PDF,
      };

      const mockMechanics = [
        {
          id: 'm1',
          name: 'Mecânico 1',
          _count: { serviceOrders: 10 },
        },
      ];

      const mockServiceOrders = [
        {
          id: 'so-1',
          technicianId: 'm1',
          status: 'completed',
          technician: { id: 'm1', name: 'Mecânico 1' },
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockMechanics);
      mockPrismaService.serviceOrder.findMany.mockResolvedValue(
        mockServiceOrders,
      );

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
    });

    it('deve gerar relatório de orçamentos com dados reais', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.QUOTES,
        format: ReportFormat.PDF,
      };

      const mockQuotes = [
        {
          id: 'q1',
          status: 'approved',
          totalCost: new Decimal(2000.0),
          customer: { id: 'c1', name: 'Cliente 1' },
        },
      ];

      mockPrismaService.quote.findMany.mockResolvedValue(mockQuotes);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
    });

    it('deve gerar relatório de faturas com dados reais', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.INVOICES,
        format: ReportFormat.PDF,
      };

      const mockInvoices = [
        {
          id: 'inv-1',
          status: 'issued',
          total: new Decimal(1000.0),
          customer: { id: 'c1', name: 'Cliente 1' },
        },
      ];

      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
    });

    it('deve gerar relatório de pagamentos com dados reais', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.PAYMENTS,
        format: ReportFormat.PDF,
      };

      const mockPayments = [
        {
          id: 'pay-1',
          method: 'credit_card',
          status: 'completed',
          amount: new Decimal(1000.0),
          invoice: { id: 'inv-1', invoiceNumber: 'FAT-001' },
        },
      ];

      mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
    });

    it('deve gerar relatório de vendas com período específico', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.SALES,
        format: ReportFormat.PDF,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const mockServiceOrders = [
        {
          id: 'so-1',
          totalCost: new Decimal(500.0),
          status: 'completed',
          customer: { id: 'c1', name: 'Cliente 1' },
        },
      ];

      const mockInvoices = [
        {
          id: 'inv-1',
          total: new Decimal(1000.0),
          status: 'issued',
          customer: { id: 'c1', name: 'Cliente 1' },
        },
      ];

      mockPrismaService.serviceOrder.findMany.mockResolvedValue(
        mockServiceOrders,
      );
      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalRevenue');
    });

    it('deve calcular resumo corretamente para relatório financeiro', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.FINANCIAL,
        format: ReportFormat.CSV,
      };

      const mockInvoices = [
        {
          id: 'inv-1',
          total: new Decimal(2000.0),
          status: 'issued',
          customer: { id: 'c1', name: 'Cliente 1' },
        },
      ];

      const mockPayments = [
        {
          id: 'pay-1',
          amount: new Decimal(1500.0),
          method: 'credit_card',
          status: 'completed',
          invoice: { id: 'inv-1', invoiceNumber: 'FAT-001' },
        },
      ];

      mockPrismaService.invoice.findMany.mockResolvedValue(mockInvoices);
      mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalInvoiced');
      expect(result.summary).toHaveProperty('totalPaid');
      expect(result.summary).toHaveProperty('totalPending');
    });

    it('deve gerar relatório financeiro com período', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.FINANCIAL,
        format: ReportFormat.PDF,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      mockPrismaService.invoice.findMany.mockResolvedValue([]);
      mockPrismaService.payment.findMany.mockResolvedValue([]);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
      expect(result.type).toBe(ReportType.FINANCIAL);
    });

    it('deve gerar relatório de estoque com dados', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.INVENTORY,
        format: ReportFormat.PDF,
      };

      const mockParts = [
        {
          id: 'part-1',
          name: 'Peça 1',
          quantity: 5,
          minQuantity: 10,
          costPrice: new Decimal(50.0),
          sellPrice: new Decimal(80.0),
        },
        {
          id: 'part-2',
          name: 'Peça 2',
          quantity: 20,
          minQuantity: 5,
          costPrice: new Decimal(100.0),
          sellPrice: new Decimal(150.0),
        },
      ];

      mockPrismaService.part.findMany.mockResolvedValue(mockParts);

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('summary');
      expect(result.summary).toHaveProperty('totalParts');
      expect(result.summary).toHaveProperty('lowStock');
    });

    it('deve gerar relatório de mecânicos com período', async () => {
      const generateReportDto: GenerateReportDto = {
        type: ReportType.MECHANICS,
        format: ReportFormat.PDF,
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      };

      const mockMechanics = [
        {
          id: 'm1',
          name: 'Mecânico 1',
          _count: { serviceOrders: 10 },
        },
      ];

      const mockServiceOrders = [
        {
          id: 'so-1',
          technicianId: 'm1',
          status: 'completed',
          technician: { id: 'm1', name: 'Mecânico 1' },
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockMechanics);
      mockPrismaService.serviceOrder.findMany.mockResolvedValue(
        mockServiceOrders,
      );

      const result = await service.generate(mockTenantId, generateReportDto);

      expect(result).toHaveProperty('id');
    });
  });
});
