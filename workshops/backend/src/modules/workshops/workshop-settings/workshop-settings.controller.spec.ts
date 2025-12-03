import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { WorkshopSettingsController } from './workshop-settings.controller';
import { WorkshopSettingsService } from './workshop-settings.service';
import { CreateWorkshopSettingsDto, UpdateWorkshopSettingsDto } from './dto';

describe('WorkshopSettingsController', () => {
  let controller: WorkshopSettingsController;
  let service: WorkshopSettingsService;

  const mockTenantId = 'tenant-123';
  const mockSettings = {
    id: 'settings-123',
    tenantId: mockTenantId,
    displayName: 'Oficina Teste',
    logoUrl: '/uploads/logos/logo.png',
    primaryColor: '#00E0B8',
    secondaryColor: '#3ABFF8',
    accentColor: '#FF4E3D',
    phone: '(11) 98765-4321',
    email: 'contato@oficina.com.br',
    whatsapp: '5511987654321',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234-567',
    country: 'BR',
    website: 'https://www.oficina.com.br',
    facebook: 'https://www.facebook.com/oficina',
    instagram: 'https://www.instagram.com/oficina',
    linkedin: 'https://www.linkedin.com/company/oficina',
    showLogoOnQuotes: true,
    showAddressOnQuotes: true,
    showContactOnQuotes: true,
    quoteFooterText: 'Obrigado pela preferência!',
    invoiceFooterText: 'Pagamento em até 30 dias',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockService = {
    findOne: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkshopSettingsController],
      providers: [
        {
          provide: WorkshopSettingsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<WorkshopSettingsController>(
      WorkshopSettingsController,
    );
    service = module.get<WorkshopSettingsService>(WorkshopSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('deve retornar configurações da oficina', async () => {
      mockService.findOne.mockResolvedValue(mockSettings);

      const result = await controller.findOne(mockTenantId);

      expect(result).toEqual(mockSettings);
      expect(service.findOne).toHaveBeenCalledWith(mockTenantId);
    });
  });

  describe('upsert', () => {
    it('deve criar ou atualizar configurações', async () => {
      const createDto: CreateWorkshopSettingsDto = {
        displayName: 'Oficina Teste',
        primaryColor: '#00E0B8',
      };
      mockService.upsert.mockResolvedValue(mockSettings);

      const result = await controller.upsert(mockTenantId, createDto);

      expect(result).toEqual(mockSettings);
      expect(service.upsert).toHaveBeenCalledWith(mockTenantId, createDto);
    });
  });

  describe('update', () => {
    it('deve atualizar configurações', async () => {
      const updateDto: UpdateWorkshopSettingsDto = {
        displayName: 'Oficina Atualizada',
      };
      mockService.update.mockResolvedValue({
        ...mockSettings,
        displayName: 'Oficina Atualizada',
      });

      const result = await controller.update(mockTenantId, updateDto);

      expect(result.displayName).toBe('Oficina Atualizada');
      expect(service.update).toHaveBeenCalledWith(mockTenantId, updateDto);
    });
  });

  describe('uploadLogo', () => {
    it('deve fazer upload de logo com sucesso', async () => {
      const mockFile = {
        filename: 'logo-1234567890-123456789.png',
        path: './uploads/logos/logo-1234567890-123456789.png',
        mimetype: 'image/png',
      };
      mockService.update.mockResolvedValue({
        ...mockSettings,
        logoUrl: '/uploads/logos/logo-1234567890-123456789.png',
      });

      const result = await controller.uploadLogo(mockFile, mockTenantId);

      expect(result.url).toBe('/uploads/logos/logo-1234567890-123456789.png');
      expect(service.update).toHaveBeenCalledWith(mockTenantId, {
        logoUrl: '/uploads/logos/logo-1234567890-123456789.png',
      });
    });

    it('deve lançar erro se nenhum arquivo for enviado', async () => {
      await expect(
        controller.uploadLogo(
          null as unknown as { filename: string; path: string; mimetype: string },
          mockTenantId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

