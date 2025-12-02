import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaService } from '@database/prisma.service';
import { GenerateReportDto, ReportType, ReportFormat } from './dto';

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
  });
});
