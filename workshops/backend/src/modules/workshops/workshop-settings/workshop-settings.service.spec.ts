import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WorkshopSettingsService } from './workshop-settings.service';
import { PrismaService } from '@database/prisma.service';
import { CreateWorkshopSettingsDto, UpdateWorkshopSettingsDto } from './dto';

describe('WorkshopSettingsService', () => {
  let service: WorkshopSettingsService;

  const mockTenantId = 'tenant-id';
  const mockSettingsId = 'settings-id';

  const mockSettings = {
    id: mockSettingsId,
    tenantId: mockTenantId,
    displayName: 'Oficina Mecânica Silva',
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

  const mockTenant = {
    id: mockTenantId,
    name: 'Tenant Test',
    subdomain: 'test',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    workshopSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkshopSettingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WorkshopSettingsService>(WorkshopSettingsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('deve retornar configurações existentes', async () => {
      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(
        mockSettings,
      );

      const result = await service.findOne(mockTenantId);

      expect(result).toHaveProperty('id', mockSettingsId);
      expect(result).toHaveProperty('displayName', 'Oficina Mecânica Silva');
      expect(result).toHaveProperty('tenantId', mockTenantId);
      expect(
        mockPrismaService.workshopSettings.findUnique,
      ).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
      });
    });

    it('deve retornar configurações padrão se não existir', async () => {
      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(null);

      const result = await service.findOne(mockTenantId);

      expect(result).toHaveProperty('tenantId', mockTenantId);
      expect(result).toHaveProperty('country', 'BR');
      expect(result).toHaveProperty('showLogoOnQuotes', true);
      expect(result).toHaveProperty('showAddressOnQuotes', true);
      expect(result).toHaveProperty('showContactOnQuotes', true);
      expect(result.id).toBe('');
    });
  });

  describe('upsert', () => {
    const createDto: CreateWorkshopSettingsDto = {
      displayName: 'Oficina Mecânica Silva',
      logoUrl: '/uploads/logos/logo.png',
      primaryColor: '#00E0B8',
      phone: '(11) 98765-4321',
      email: 'contato@oficina.com.br',
      country: 'BR',
    };

    it('deve criar configurações se não existirem', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(null);
      mockPrismaService.workshopSettings.create.mockResolvedValue(mockSettings);

      const result = await service.upsert(mockTenantId, createDto);

      expect(result).toHaveProperty('id', mockSettingsId);
      expect(result).toHaveProperty('displayName', 'Oficina Mecânica Silva');
      expect(mockPrismaService.workshopSettings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: mockTenantId,
          displayName: createDto.displayName,
          logoUrl: createDto.logoUrl,
          primaryColor: createDto.primaryColor,
          phone: createDto.phone,
          email: createDto.email,
          country: 'BR',
          showLogoOnQuotes: true,
          showAddressOnQuotes: true,
          showContactOnQuotes: true,
        }),
      });
    });

    it('deve atualizar configurações se já existirem', async () => {
      const updatedSettings = {
        ...mockSettings,
        displayName: 'Oficina Atualizada',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(
        mockSettings,
      );
      mockPrismaService.workshopSettings.update.mockResolvedValue(
        updatedSettings,
      );

      const updateDto: CreateWorkshopSettingsDto = {
        displayName: 'Oficina Atualizada',
      };

      const result = await service.upsert(mockTenantId, updateDto);

      expect(result).toHaveProperty('displayName', 'Oficina Atualizada');
      expect(mockPrismaService.workshopSettings.update).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        data: expect.objectContaining({
          displayName: 'Oficina Atualizada',
        }),
      });
    });

    it('deve lançar NotFoundException se tenant não existe', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.upsert(mockTenantId, createDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.workshopSettings.create).not.toHaveBeenCalled();
      expect(mockPrismaService.workshopSettings.update).not.toHaveBeenCalled();
    });

    it('deve usar valores padrão para campos booleanos ao criar', async () => {
      const minimalDto: CreateWorkshopSettingsDto = {
        displayName: 'Oficina Teste',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(null);
      mockPrismaService.workshopSettings.create.mockResolvedValue({
        ...mockSettings,
        displayName: 'Oficina Teste',
      });

      await service.upsert(mockTenantId, minimalDto);

      expect(mockPrismaService.workshopSettings.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          showLogoOnQuotes: true,
          showAddressOnQuotes: true,
          showContactOnQuotes: true,
          country: 'BR',
        }),
      });
    });

    it('deve limpar campos quando receber string vazia', async () => {
      const clearDto: CreateWorkshopSettingsDto = {
        displayName: '',
        logoUrl: '',
        phone: '',
      };

      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);
      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(
        mockSettings,
      );
      mockPrismaService.workshopSettings.update.mockResolvedValue({
        ...mockSettings,
        displayName: null,
        logoUrl: null,
        phone: null,
      });

      await service.upsert(mockTenantId, clearDto);

      expect(mockPrismaService.workshopSettings.update).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        data: expect.objectContaining({
          displayName: null,
          logoUrl: null,
          phone: null,
        }),
      });
    });
  });

  describe('update', () => {
    const updateDto: UpdateWorkshopSettingsDto = {
      displayName: 'Oficina Atualizada',
      phone: '(11) 99999-9999',
    };

    it('deve atualizar configurações existentes', async () => {
      const updatedSettings = {
        ...mockSettings,
        displayName: 'Oficina Atualizada',
        phone: '(11) 99999-9999',
      };

      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(
        mockSettings,
      );
      mockPrismaService.workshopSettings.update.mockResolvedValue(
        updatedSettings,
      );

      const result = await service.update(mockTenantId, updateDto);

      expect(result).toHaveProperty('displayName', 'Oficina Atualizada');
      expect(result).toHaveProperty('phone', '(11) 99999-9999');
      expect(mockPrismaService.workshopSettings.update).toHaveBeenCalledWith({
        where: { tenantId: mockTenantId },
        data: expect.objectContaining({
          displayName: 'Oficina Atualizada',
          phone: '(11) 99999-9999',
        }),
      });
    });

    it('deve lançar NotFoundException se configurações não existem', async () => {
      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(null);

      await expect(service.update(mockTenantId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.workshopSettings.update).not.toHaveBeenCalled();
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      const partialUpdate: UpdateWorkshopSettingsDto = {
        displayName: 'Novo Nome',
      };

      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(
        mockSettings,
      );
      mockPrismaService.workshopSettings.update.mockResolvedValue({
        ...mockSettings,
        displayName: 'Novo Nome',
      });

      await service.update(mockTenantId, partialUpdate);

      const updateCall =
        mockPrismaService.workshopSettings.update.mock.calls[0][0];
      expect(updateCall.data).toHaveProperty('displayName', 'Novo Nome');
      // Verificar que outros campos não foram incluídos
      expect(updateCall.data).not.toHaveProperty('phone');
      expect(updateCall.data).not.toHaveProperty('email');
    });

    it('deve ignorar campos undefined', async () => {
      const updateWithUndefined: UpdateWorkshopSettingsDto = {
        displayName: 'Novo Nome',
        phone: undefined,
        email: undefined,
      };

      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(
        mockSettings,
      );
      mockPrismaService.workshopSettings.update.mockResolvedValue({
        ...mockSettings,
        displayName: 'Novo Nome',
      });

      await service.update(mockTenantId, updateWithUndefined);

      const updateCall =
        mockPrismaService.workshopSettings.update.mock.calls[0][0];
      expect(updateCall.data).toHaveProperty('displayName', 'Novo Nome');
      expect(updateCall.data).not.toHaveProperty('phone');
      expect(updateCall.data).not.toHaveProperty('email');
    });
  });

  describe('toResponseDto', () => {
    it('deve converter Prisma para DTO corretamente', async () => {
      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(
        mockSettings,
      );

      const result = await service.findOne(mockTenantId);

      expect(result).toHaveProperty('id', mockSettingsId);
      expect(result).toHaveProperty('tenantId', mockTenantId);
      expect(result).toHaveProperty('displayName', mockSettings.displayName);
      expect(result).toHaveProperty('logoUrl', mockSettings.logoUrl);
      expect(result).toHaveProperty('primaryColor', mockSettings.primaryColor);
      expect(result).toHaveProperty('phone', mockSettings.phone);
      expect(result).toHaveProperty('email', mockSettings.email);
      expect(result).toHaveProperty('country', 'BR');
      expect(result).toHaveProperty('showLogoOnQuotes', true);
    });

    it('deve converter null para undefined em campos opcionais', async () => {
      const settingsWithNulls = {
        ...mockSettings,
        displayName: null,
        logoUrl: null,
        phone: null,
        email: null,
        address: null,
      };

      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(
        settingsWithNulls,
      );

      const result = await service.findOne(mockTenantId);

      expect(result.displayName).toBeUndefined();
      expect(result.logoUrl).toBeUndefined();
      expect(result.phone).toBeUndefined();
      expect(result.email).toBeUndefined();
      expect(result.address).toBeUndefined();
    });

    it('deve usar valores padrão para campos booleanos', async () => {
      const settingsWithNullBooleans = {
        ...mockSettings,
        showLogoOnQuotes: null,
        showAddressOnQuotes: null,
        showContactOnQuotes: null,
      };

      mockPrismaService.workshopSettings.findUnique.mockResolvedValue(
        settingsWithNullBooleans,
      );

      const result = await service.findOne(mockTenantId);

      expect(result.showLogoOnQuotes).toBe(true);
      expect(result.showAddressOnQuotes).toBe(true);
      expect(result.showContactOnQuotes).toBe(true);
    });
  });
});
