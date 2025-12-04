import { Test, TestingModule } from '@nestjs/testing';
import { QuotePdfService } from './quote-pdf.service';
import { QuoteResponseDto } from '../dto';
import { QuoteStatus } from '../dto/quote-status.enum';
import { QuoteItemType } from '../dto/quote-item.dto';
import { WorkshopSettings } from '@prisma/client';
import PDFDocument from 'pdfkit';
import * as fs from 'node:fs';

// Mock do PDFDocument
jest.mock('pdfkit', () => {
  const mockDoc = {
    on: jest.fn(),
    end: jest.fn(),
    fontSize: jest.fn().mockReturnThis(),
    font: jest.fn().mockReturnThis(),
    fillColor: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    moveTo: jest.fn().mockReturnThis(),
    lineTo: jest.fn().mockReturnThis(),
    lineWidth: jest.fn().mockReturnThis(),
    strokeColor: jest.fn().mockReturnThis(),
    stroke: jest.fn().mockReturnThis(),
    moveDown: jest.fn().mockReturnThis(),
    image: jest.fn().mockReturnThis(),
    addPage: jest.fn().mockReturnThis(),
    y: 50,
    page: { height: 842 },
  };
  return jest.fn(() => mockDoc);
});

// Mock do fs
jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
}));

describe('QuotePdfService', () => {
  let service: QuotePdfService;
  let mockDoc: {
    on: jest.Mock;
    end: jest.Mock;
    fontSize: jest.Mock;
    font: jest.Mock;
    fillColor: jest.Mock;
    text: jest.Mock;
    moveTo: jest.Mock;
    lineTo: jest.Mock;
    lineWidth: jest.Mock;
    strokeColor: jest.Mock;
    stroke: jest.Mock;
    moveDown: jest.Mock;
    image: jest.Mock;
    addPage: jest.Mock;
    y: number;
    page: { height: number };
  };

  const mockQuote: QuoteResponseDto = {
    id: 'quote-id',
    tenantId: 'tenant-id',
    number: 'QUOTE-001',
    status: QuoteStatus.SENT,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    totalCost: 1000,
    discount: 0,
    taxAmount: 0,
    reportedProblemSymptoms: [],
    inspectionPhotos: [],
    items: [
      {
        id: 'item-1',
        type: QuoteItemType.SERVICE,
        name: 'Item 1',
        description: 'Descrição do item 1',
        quantity: 2,
        unitCost: 100,
        totalCost: 200,
        hours: 2,
      },
    ],
    customer: {
      id: 'customer-id',
      name: 'Cliente Teste',
      phone: '11999999999',
      email: 'cliente@teste.com',
    },
    vehicle: {
      id: 'vehicle-id',
      placa: 'ABC1234',
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuotePdfService],
    }).compile();

    service = module.get<QuotePdfService>(QuotePdfService);

    // Obter instância mockada do PDFDocument
    const PDFDocumentMock = PDFDocument as jest.MockedClass<typeof PDFDocument>;
    mockDoc = new PDFDocumentMock() as unknown as typeof mockDoc;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePdf', () => {
    it('deve gerar PDF com sucesso', async () => {
      mockDoc.on.mockImplementation(
        (event: string, callback: (chunk?: unknown) => void) => {
          if (event === 'data') {
            // Simular chunks de dados
            setTimeout(() => {
              callback(Buffer.from('test data'));
            }, 0);
          } else if (event === 'end') {
            setTimeout(() => {
              callback();
            }, 10);
          }
          return mockDoc;
        },
      );

      const result = await service.generatePdf(mockQuote);

      expect(result).toBeInstanceOf(Buffer);
      expect(mockDoc.end).toHaveBeenCalled();
    });

    it('deve gerar PDF com workshopSettings', async () => {
      const workshopSettings: Partial<WorkshopSettings> = {
        displayName: 'Oficina Teste',
        primaryColor: '#FF0000',
        phone: '11999999999',
        email: 'oficina@teste.com',
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(
        mockQuote,
        workshopSettings as WorkshopSettings,
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(mockDoc.end).toHaveBeenCalled();
    });

    it('deve tratar erros ao gerar PDF', async () => {
      const error = new Error('PDF generation failed');
      mockDoc.on.mockImplementation(
        (event: string, callback: (error?: unknown) => void) => {
          if (event === 'error') {
            setTimeout(() => {
              callback(error);
            }, 10);
          }
          return mockDoc;
        },
      );

      await expect(service.generatePdf(mockQuote)).rejects.toThrow(
        'PDF generation failed',
      );
    });

    it('deve gerar PDF com problema relatado', async () => {
      const quoteWithProblem = {
        ...mockQuote,
        reportedProblemDescription: 'Problema relatado',
        reportedProblemCategory: 'MOTOR',
        reportedProblemSymptoms: ['Sintoma 1', 'Sintoma 2'],
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(quoteWithProblem);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('deve gerar PDF com problema identificado', async () => {
      const quoteWithIdentified = {
        ...mockQuote,
        identifiedProblemDescription: 'Problema identificado',
        identifiedProblemCategory: 'FREIO',
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(quoteWithIdentified);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('deve gerar PDF com recomendações', async () => {
      const quoteWithRecommendations = {
        ...mockQuote,
        recommendations: 'Recomendações importantes',
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(quoteWithRecommendations);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('deve gerar PDF com notas de diagnóstico', async () => {
      const quoteWithNotes = {
        ...mockQuote,
        diagnosticNotes: 'Notas de diagnóstico',
        inspectionNotes: 'Notas de inspeção',
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(quoteWithNotes);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('deve gerar PDF com mecânico atribuído', async () => {
      const quoteWithMechanic: QuoteResponseDto = {
        ...mockQuote,
        assignedMechanic: {
          id: 'mechanic-id',
          name: 'Mecânico Teste',
          email: 'mechanic@teste.com',
        },
        assignedAt: new Date(),
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(quoteWithMechanic);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('deve gerar PDF com validade', async () => {
      const quoteWithValidity = {
        ...mockQuote,
        validUntil: new Date(Date.now() + 86400000),
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(quoteWithValidity);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('deve gerar PDF com assinatura do cliente', async () => {
      const quoteWithSignature = {
        ...mockQuote,
        customerSignature: 'signature-data',
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(quoteWithSignature);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('deve gerar PDF com logo quando configurado', async () => {
      const workshopSettings: Partial<WorkshopSettings> = {
        logoUrl: '/uploads/logo.png',
        showLogoOnQuotes: true,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(
        mockQuote,
        workshopSettings as WorkshopSettings,
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(fs.existsSync).toHaveBeenCalled();
    });

    it('deve gerar PDF sem logo quando não existe', async () => {
      const workshopSettings: Partial<WorkshopSettings> = {
        logoUrl: '/uploads/logo.png',
        showLogoOnQuotes: true,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(false);

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(
        mockQuote,
        workshopSettings as WorkshopSettings,
      );

      expect(result).toBeInstanceOf(Buffer);
    });

    it('deve gerar PDF com desconto e impostos', async () => {
      const quoteWithDiscount = {
        ...mockQuote,
        discount: 100,
        taxAmount: 50,
        laborCost: 200,
        partsCost: 300,
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(quoteWithDiscount);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('deve gerar PDF com elevador', async () => {
      const quoteWithElevator: QuoteResponseDto = {
        ...mockQuote,
        elevator: {
          id: 'elevator-id',
          name: 'Elevador 1',
          number: 'ELEV-001',
          status: 'free',
        },
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(quoteWithElevator);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('deve gerar PDF sem cliente', async () => {
      const quoteWithoutCustomer = {
        ...mockQuote,
        customer: undefined,
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(quoteWithoutCustomer);

      expect(result).toBeInstanceOf(Buffer);
    });

    it('deve gerar PDF sem veículo', async () => {
      const quoteWithoutVehicle = {
        ...mockQuote,
        vehicle: undefined,
      };

      mockDoc.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'end') {
          setTimeout(() => {
            callback();
          }, 10);
        }
        return mockDoc;
      });

      const result = await service.generatePdf(quoteWithoutVehicle);

      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
