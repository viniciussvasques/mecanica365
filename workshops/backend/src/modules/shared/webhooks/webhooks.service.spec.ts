import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '@database/prisma.service';
import { CreateWebhookDto, UpdateWebhookDto } from './dto';
import axios, { AxiosError } from 'axios';

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
      findMany: jest.fn(),
      update: jest.fn(),
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

      mockPrismaService.webhook.create.mockResolvedValue(
        webhookWithMultipleEvents,
      );

      const result = await service.create(
        mockTenantId,
        createDtoMultipleEvents,
      );

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
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.post).not.toHaveBeenCalled();
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
      mockPrismaService.webhookAttempt.create.mockResolvedValue({
        id: 'attempt-id',
        webhookId: 'webhook-id',
        event: 'quote.approved',
        payload: {},
        status: 'pending',
        attemptedAt: new Date(),
      });
      mockPrismaService.webhookAttempt.update.mockResolvedValue({
        id: 'attempt-id',
        status: 'success',
      });
      mockPrismaService.webhook.update.mockResolvedValue(mockWebhook);

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      const payload = { quoteId: 'quote-123' };

      const triggerPromise = service.trigger(
        mockTenantId,
        'quote.approved',
        payload,
      );
      await jest.runAllTimersAsync();
      await triggerPromise;

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.post).toHaveBeenCalledTimes(2);
    });

    it('deve registrar tentativa falha quando sendWebhook falha', async () => {
      mockPrismaService.webhook.findMany.mockResolvedValue([mockWebhook]);
      mockPrismaService.webhookAttempt.create.mockResolvedValue({
        id: 'attempt-id',
        webhookId: 'webhook-id',
        event: 'quote.approved',
        payload: {},
        status: 'pending',
        attemptedAt: new Date(),
      });
      mockPrismaService.webhookAttempt.update.mockResolvedValue({
        id: 'attempt-id',
        status: 'failed',
      });

      mockedAxios.post.mockRejectedValue({
        response: { status: 500 },
        isAxiosError: true,
      } as AxiosError);

      const payload = { quoteId: 'quote-123' };

      const triggerPromise = service.trigger(
        mockTenantId,
        'quote.approved',
        payload,
      );
      await jest.runAllTimersAsync();
      await triggerPromise;

      // Verificar que foi chamado com status 'failed' na última tentativa
      expect(mockPrismaService.webhookAttempt.update).toHaveBeenCalled();
      const updateCalls = mockPrismaService.webhookAttempt.update.mock.calls;
      const lastCall = updateCalls.at(-1);
      if (lastCall && lastCall[0] && 'data' in lastCall[0]) {
        expect((lastCall[0] as { data: { status: string } }).data.status).toBe(
          'failed',
        );
      } else {
        // Verificar se alguma chamada tem status 'failed'
        const hasFailedStatus = updateCalls.some(
          (call) =>
            call[0] &&
            'data' in call[0] &&
            (call[0] as { data: { status: string } }).data.status === 'failed',
        );
        expect(hasFailedStatus).toBe(true);
      }
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

      mockPrismaService.webhook.create.mockResolvedValue(
        webhookWithCustomSecret,
      );

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

  describe('trigger - envio real com retry', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('deve enviar webhook com sucesso na primeira tentativa', async () => {
      const webhooks = [mockWebhook];
      mockPrismaService.webhook.findMany.mockResolvedValue(webhooks);
      mockPrismaService.webhookAttempt.create.mockResolvedValue({
        id: 'attempt-id',
        webhookId: 'webhook-id',
        event: 'quote.approved',
        payload: {},
        status: 'pending',
        attemptedAt: new Date(),
      });
      mockPrismaService.webhookAttempt.update.mockResolvedValue({
        id: 'attempt-id',
        status: 'success',
        statusCode: 200,
      });
      mockPrismaService.webhook.update.mockResolvedValue(mockWebhook);

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      await service.trigger(mockTenantId, 'quote.approved', {
        quoteId: 'quote-123',
      });

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.webhookAttempt.update).toHaveBeenCalledWith({
        where: { id: expect.any(String) }, // UUID gerado dinamicamente
        data: {
          status: 'success',
          statusCode: 200,
          response: expect.any(String),
        },
      });
    });

    it('deve fazer retry em caso de erro retryable (5xx)', async () => {
      const webhooks = [mockWebhook];
      mockPrismaService.webhook.findMany.mockResolvedValue(webhooks);
      mockPrismaService.webhookAttempt.create.mockResolvedValue({
        id: 'attempt-id',
        webhookId: 'webhook-id',
        event: 'quote.approved',
        payload: {},
        status: 'pending',
        attemptedAt: new Date(),
      });

      // Primeira tentativa falha com 500
      mockedAxios.post
        .mockRejectedValueOnce({
          response: { status: 500 },
          isAxiosError: true,
        } as AxiosError)
        // Segunda tentativa falha com 503
        .mockRejectedValueOnce({
          response: { status: 503 },
          isAxiosError: true,
        } as AxiosError)
        // Terceira tentativa sucesso
        .mockResolvedValueOnce({
          status: 200,
          data: { success: true },
        });

      mockPrismaService.webhookAttempt.update.mockResolvedValue({
        id: 'attempt-id',
        status: 'success',
      });
      mockPrismaService.webhook.update.mockResolvedValue(mockWebhook);

      const triggerPromise = service.trigger(mockTenantId, 'quote.approved', {
        quoteId: 'quote-123',
      });

      // Avançar timers para processar retries
      await jest.runAllTimersAsync();
      await triggerPromise;

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
    });

    it('deve marcar como failed após todas as tentativas falharem', async () => {
      const webhooks = [mockWebhook];
      mockPrismaService.webhook.findMany.mockResolvedValue(webhooks);
      mockPrismaService.webhookAttempt.create.mockResolvedValue({
        id: 'attempt-id',
        webhookId: 'webhook-id',
        event: 'quote.approved',
        payload: {},
        status: 'pending',
        attemptedAt: new Date(),
      });

      // Todas as tentativas falham
      mockedAxios.post.mockRejectedValue({
        response: { status: 500 },
        isAxiosError: true,
      } as AxiosError);

      mockPrismaService.webhookAttempt.update.mockResolvedValue({
        id: 'attempt-id',
        status: 'failed',
      });

      const triggerPromise = service.trigger(mockTenantId, 'quote.approved', {
        quoteId: 'quote-123',
      });

      await jest.runAllTimersAsync();
      await triggerPromise;

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.post).toHaveBeenCalledTimes(3);
      // Verificar que foi chamado com status 'failed' na última tentativa
      expect(mockPrismaService.webhookAttempt.update).toHaveBeenCalled();
      const updateCalls = mockPrismaService.webhookAttempt.update.mock.calls;
      const lastCall = updateCalls.at(-1);
      if (lastCall && lastCall[0] && 'data' in lastCall[0]) {
        expect((lastCall[0] as { data: { status: string } }).data.status).toBe(
          'failed',
        );
      } else {
        // Verificar se alguma chamada tem status 'failed'
        const hasFailedStatus = updateCalls.some(
          (call) =>
            call[0] &&
            'data' in call[0] &&
            (call[0] as { data: { status: string } }).data.status === 'failed',
        );
        expect(hasFailedStatus).toBe(true);
      }
    });

    it('não deve fazer retry para erros não retryable (4xx)', async () => {
      const webhooks = [mockWebhook];
      mockPrismaService.webhook.findMany.mockResolvedValue(webhooks);
      mockPrismaService.webhookAttempt.create.mockResolvedValue({
        id: 'attempt-id',
        webhookId: 'webhook-id',
        event: 'quote.approved',
        payload: {},
        status: 'pending',
        attemptedAt: new Date(),
      });

      // Erro 400 (não retryable)
      mockedAxios.post.mockRejectedValue({
        response: { status: 400 },
        isAxiosError: true,
      } as AxiosError);

      mockPrismaService.webhookAttempt.update.mockResolvedValue({
        id: 'attempt-id',
        status: 'failed',
      });

      await service.trigger(mockTenantId, 'quote.approved', {
        quoteId: 'quote-123',
      });

      // Apenas 1 tentativa (sem retry)
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('retryFailedWebhooks', () => {
    it('deve reprocessar webhooks falhos', async () => {
      const failedAttempt = {
        id: 'attempt-id',
        webhookId: 'webhook-id',
        event: 'quote.approved',
        payload: { quoteId: 'quote-123' },
        status: 'failed',
        error: 'Connection timeout',
        attemptedAt: new Date(),
        webhook: mockWebhook,
      };

      mockPrismaService.webhookAttempt.findMany.mockResolvedValue([
        failedAttempt,
      ]);
      mockPrismaService.webhookAttempt.create.mockResolvedValue({
        id: 'new-attempt-id',
        status: 'success',
      });
      mockPrismaService.webhook.update.mockResolvedValue(mockWebhook);

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      const result: {
        retried: number;
        succeeded: number;
        failed: number;
      } = await service.retryFailedWebhooks(mockTenantId, 10);

      expect(result.retried).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('deve lidar com falhas ao reprocessar', async () => {
      const failedAttempt = {
        id: 'attempt-id',
        webhookId: 'webhook-id',
        event: 'quote.approved',
        payload: { quoteId: 'quote-123' },
        status: 'failed',
        error: 'Connection timeout',
        attemptedAt: new Date(),
        webhook: mockWebhook,
      };

      mockPrismaService.webhookAttempt.findMany.mockResolvedValue([
        failedAttempt,
      ]);
      mockPrismaService.webhookAttempt.create.mockResolvedValue({
        id: 'new-attempt-id',
        status: 'failed',
      });

      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      const result = await service.retryFailedWebhooks(mockTenantId, 10);

      expect(result.retried).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);
    });
  });
});
