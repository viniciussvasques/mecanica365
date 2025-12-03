import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '@database/prisma.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto';

describe('WebhooksService', () => {
  let service: WebhooksService;

  const mockTenantId = 'tenant-id';
  const mockWebhook = {
    id: 'webhook-id',
    tenantId: mockTenantId,
    url: 'https://example.com/webhook',
    secret: 'secret-key',
    events: ['quote.approved', 'service_order.completed'],
    isActive: true,
    lastTriggeredAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    webhook: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    webhookAttempt: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createWebhookDto: CreateWebhookDto = {
      url: 'https://example.com/webhook',
      secret: 'secret-key',
      events: ['quote.approved'],
    };

    it('deve criar um webhook com sucesso', async () => {
      mockPrismaService.webhook.create.mockResolvedValue(mockWebhook);

      const result = await service.create(mockTenantId, createWebhookDto);

      expect(result).toHaveProperty('id', 'webhook-id');
      expect(result).toHaveProperty('url', 'https://example.com/webhook');
      expect(mockPrismaService.webhook.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          url: createWebhookDto.url,
          secret: createWebhookDto.secret,
          events: createWebhookDto.events,
          isActive: true,
        },
      });
    });

    it('deve criar webhook com diferentes eventos', async () => {
      const createDtoMultipleEvents: CreateWebhookDto = {
        url: 'https://example.com/webhook',
        secret: 'secret-key',
        events: ['quote.approved', 'service_order.completed', 'invoice.issued'],
      };

      const webhookWithMultipleEvents = {
        ...mockWebhook,
        events: createDtoMultipleEvents.events,
      };

      mockPrismaService.webhook.create.mockResolvedValue(webhookWithMultipleEvents);

      const result = await service.create(mockTenantId, createDtoMultipleEvents);

      expect(result.events).toHaveLength(3);
      expect(result.events).toContain('quote.approved');
      expect(result.events).toContain('service_order.completed');
      expect(result.events).toContain('invoice.issued');
    });
  });

  describe('findAll', () => {
    it('deve listar webhooks com sucesso', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([mockWebhook]);

      const result = await service.findAll(mockTenantId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', 'webhook-id');
    });
  });

  describe('findOne', () => {
    it('deve buscar webhook por ID com sucesso', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);

      const result = await service.findOne(mockTenantId, 'webhook-id');

      expect(result).toHaveProperty('id', 'webhook-id');
    });

    it('deve lançar erro se webhook não encontrado', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateWebhookDto: UpdateWebhookDto = {
      url: 'https://new-url.com/webhook',
      isActive: false,
    };

    it('deve atualizar webhook com sucesso', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);
      mockPrismaService.webhook.update.mockResolvedValue({
        ...mockWebhook,
        ...updateWebhookDto,
      });

      const result = await service.update(
        mockTenantId,
        'webhook-id',
        updateWebhookDto,
      );

      expect(result).toHaveProperty('url', 'https://new-url.com/webhook');
      expect(mockPrismaService.webhook.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve remover webhook com sucesso', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);
      mockPrismaService.webhook.delete.mockResolvedValue(mockWebhook);

      await service.remove(mockTenantId, 'webhook-id');

      expect(mockPrismaService.webhook.delete).toHaveBeenCalledWith({
        where: { id: 'webhook-id' },
      });
    });

    it('deve lançar erro se webhook não encontrado ao remover', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('trigger', () => {
    it('deve disparar webhook para evento específico', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([mockWebhook]);
      mockPrismaService.webhookAttempt.create.mockResolvedValue({});
      mockPrismaService.webhook.update.mockResolvedValue(mockWebhook);

      const payload = { quoteId: 'quote-123', status: 'approved' };

      await service.trigger(mockTenantId, 'quote.approved', payload);

      expect(mockPrismaService.webhook.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          isActive: true,
          events: {
            has: 'quote.approved',
          },
        },
      });
    });

    it('deve não disparar webhook se nenhum encontrado', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([]);

      const payload = { quoteId: 'quote-123' };

      await service.trigger(mockTenantId, 'quote.approved', payload);

      expect(mockPrismaService.webhookAttempt.create).not.toHaveBeenCalled();
    });

    it('deve lidar com erros ao disparar webhook sem interromper fluxo', async () => {
      mockPrismaService.webhook.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      const payload = { quoteId: 'quote-123' };

      // Não deve lançar erro
      await expect(
        service.trigger(mockTenantId, 'quote.approved', payload),
      ).resolves.toBeUndefined();
    });

    it('deve disparar múltiplos webhooks para o mesmo evento', async () => {
      const webhook1 = { ...mockWebhook, id: 'webhook-1' };
      const webhook2 = { ...mockWebhook, id: 'webhook-2' };

      mockPrismaService.webhook.findMany.mockResolvedValue([
        webhook1,
        webhook2,
      ]);
      mockPrismaService.webhookAttempt.create.mockResolvedValue({});
      mockPrismaService.webhook.update.mockResolvedValue(mockWebhook);

      const payload = { quoteId: 'quote-123' };

      await service.trigger(mockTenantId, 'quote.approved', payload);

      expect(mockPrismaService.webhookAttempt.create).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.webhook.update).toHaveBeenCalledTimes(2);
    });

    it('deve registrar tentativa falha quando sendWebhook falha', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([mockWebhook]);
      mockPrismaService.webhookAttempt.create
        .mockRejectedValueOnce(new Error('Database error'))
        .mockResolvedValueOnce({});

      const payload = { quoteId: 'quote-123' };

      await service.trigger(mockTenantId, 'quote.approved', payload);

      expect(mockPrismaService.webhookAttempt.create).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.webhookAttempt.create).toHaveBeenLastCalledWith({
        data: expect.objectContaining({
          status: 'failed',
          error: expect.any(String),
        }),
      });
    });
  });

  describe('error handling', () => {
    it('deve lidar com erros ao criar webhook', async () => {
      const createDto: CreateWebhookDto = {
        url: 'https://example.com/webhook',
        secret: 'secret-key',
        events: ['quote.approved'],
      };

      mockPrismaService.webhook.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.create(mockTenantId, createDto)).rejects.toThrow(
        'Database error',
      );
    });

    it('deve lidar com erros ao listar webhooks', async () => {
      mockPrismaService.webhook.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll(mockTenantId)).rejects.toThrow(
        'Database error',
      );
    });

    it('deve lidar com erros ao atualizar webhook', async () => {
      const updateDto: UpdateWebhookDto = {
        url: 'https://new-url.com/webhook',
      };

      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);
      mockPrismaService.webhook.update.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.update(mockTenantId, 'webhook-id', updateDto),
      ).rejects.toThrow('Database error');
    });

    it('deve lidar com erros ao remover webhook', async () => {
      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);
      mockPrismaService.webhook.delete.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.remove(mockTenantId, 'webhook-id')).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('create - casos especiais', () => {
    it('deve criar webhook com secret customizado', async () => {
      const createDto: CreateWebhookDto = {
        url: 'https://example.com/webhook',
        secret: 'custom-secret-key',
        events: ['quote.approved'],
      };

      const webhookWithCustomSecret = {
        ...mockWebhook,
        secret: 'custom-secret-key',
      };

      mockPrismaService.webhook.create.mockResolvedValue(webhookWithCustomSecret);

      const result = await service.create(mockTenantId, createDto);

      expect(result).toHaveProperty('id');
      expect(mockPrismaService.webhook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          secret: 'custom-secret-key',
        }),
      });
    });
  });

  describe('update - casos especiais', () => {
    it('deve atualizar apenas campos fornecidos', async () => {
      const updateDto: UpdateWebhookDto = {
        isActive: false,
      };

      mockPrismaService.webhook.findFirst.mockResolvedValue(mockWebhook);
      mockPrismaService.webhook.update.mockResolvedValue({
        ...mockWebhook,
        isActive: false,
      });

      const result = await service.update(
        mockTenantId,
        'webhook-id',
        updateDto,
      );

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.webhook.update).toHaveBeenCalledWith({
        where: { id: 'webhook-id' },
        data: expect.objectContaining({
          isActive: false,
        }),
      });
    });

    it('deve lançar erro se webhook não encontrado ao atualizar', async () => {
      const updateDto: UpdateWebhookDto = {
        url: 'https://new-url.com/webhook',
      };

      mockPrismaService.webhook.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'non-existent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
