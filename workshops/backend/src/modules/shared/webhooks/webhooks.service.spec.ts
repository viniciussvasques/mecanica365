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
  });
});

