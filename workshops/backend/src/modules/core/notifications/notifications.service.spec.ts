import { Test, TestingModule } from '@nestjs/testing';
import {
  NotificationsService,
  NotificationType,
} from './notifications.service';
import { PrismaService } from '@database/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockTenantId = 'tenant-id';
  const mockUserId = 'user-id';
  const mockNotificationId = 'notification-id';

  const mockNotification = {
    id: mockNotificationId,
    tenantId: mockTenantId,
    userId: mockUserId,
    type: NotificationType.QUOTE_ASSIGNED,
    title: 'Orçamento atribuído',
    message: 'Você recebeu um novo orçamento',
    data: { quoteId: 'quote-id' },
    read: false,
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    notification: {
      create: jest.fn(),
      createMany: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      tenantId: mockTenantId,
      userId: mockUserId,
      type: NotificationType.QUOTE_ASSIGNED,
      title: 'Orçamento atribuído',
      message: 'Você recebeu um novo orçamento',
      data: { quoteId: 'quote-id' },
    };

    it('deve criar uma notificação com sucesso', async () => {
      mockPrismaService.notification.create.mockResolvedValue(mockNotification);

      await service.create(createDto);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          userId: mockUserId,
          type: NotificationType.QUOTE_ASSIGNED,
          title: 'Orçamento atribuído',
          message: 'Você recebeu um novo orçamento',
          data: { quoteId: 'quote-id' },
        },
      });
    });

    it('deve criar notificação sem userId (notificação geral)', async () => {
      const dtoWithoutUserId = { ...createDto, userId: undefined };
      mockPrismaService.notification.create.mockResolvedValue({
        ...mockNotification,
        userId: null,
      });

      await service.create(dtoWithoutUserId);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          userId: null,
          type: NotificationType.QUOTE_ASSIGNED,
          title: 'Orçamento atribuído',
          message: 'Você recebeu um novo orçamento',
          data: { quoteId: 'quote-id' },
        },
      });
    });

    it('deve criar notificação sem data', async () => {
      const dtoWithoutData = { ...createDto, data: undefined };
      mockPrismaService.notification.create.mockResolvedValue({
        ...mockNotification,
        data: null,
      });

      await service.create(dtoWithoutData);

      expect(mockPrismaService.notification.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          userId: mockUserId,
          type: NotificationType.QUOTE_ASSIGNED,
          title: 'Orçamento atribuído',
          message: 'Você recebeu um novo orçamento',
          data: undefined,
        },
      });
    });

    it('não deve lançar erro se criação falhar', async () => {
      const error = new Error('Database error');
      mockPrismaService.notification.create.mockRejectedValue(error);

      // Não deve lançar erro
      await expect(service.create(createDto)).resolves.not.toThrow();
    });
  });

  describe('notifyAllMechanics', () => {
    it('deve notificar todos os mecânicos com sucesso', async () => {
      const mechanics = [
        { id: 'mechanic-1' },
        { id: 'mechanic-2' },
        { id: 'mechanic-3' },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mechanics);
      mockPrismaService.notification.createMany.mockResolvedValue({ count: 3 });

      await service.notifyAllMechanics(
        mockTenantId,
        NotificationType.QUOTE_AVAILABLE,
        'Novo orçamento disponível',
        'Há um novo orçamento aguardando atribuição',
        { quoteId: 'quote-id' },
      );

      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          role: 'mechanic',
          isActive: true,
        },
        select: { id: true },
      });

      expect(mockPrismaService.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            tenantId: mockTenantId,
            userId: 'mechanic-1',
            type: NotificationType.QUOTE_AVAILABLE,
            title: 'Novo orçamento disponível',
            message: 'Há um novo orçamento aguardando atribuição',
            data: { quoteId: 'quote-id' },
          },
          {
            tenantId: mockTenantId,
            userId: 'mechanic-2',
            type: NotificationType.QUOTE_AVAILABLE,
            title: 'Novo orçamento disponível',
            message: 'Há um novo orçamento aguardando atribuição',
            data: { quoteId: 'quote-id' },
          },
          {
            tenantId: mockTenantId,
            userId: 'mechanic-3',
            type: NotificationType.QUOTE_AVAILABLE,
            title: 'Novo orçamento disponível',
            message: 'Há um novo orçamento aguardando atribuição',
            data: { quoteId: 'quote-id' },
          },
        ],
      });
    });

    it('não deve criar notificações se não houver mecânicos', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await service.notifyAllMechanics(
        mockTenantId,
        NotificationType.QUOTE_AVAILABLE,
        'Novo orçamento disponível',
        'Há um novo orçamento aguardando atribuição',
      );

      expect(mockPrismaService.notification.createMany).not.toHaveBeenCalled();
    });

    it('não deve lançar erro se notificação falhar', async () => {
      const error = new Error('Database error');
      mockPrismaService.user.findMany.mockRejectedValue(error);

      // Não deve lançar erro
      await expect(
        service.notifyAllMechanics(
          mockTenantId,
          NotificationType.QUOTE_AVAILABLE,
          'Título',
          'Mensagem',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('markAsRead', () => {
    it('deve marcar notificação como lida com sucesso', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 1 });

      await service.markAsRead(mockTenantId, mockUserId, mockNotificationId);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: mockNotificationId,
          tenantId: mockTenantId,
          userId: mockUserId,
          read: false,
        },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      });
    });

    it('deve funcionar mesmo se notificação não for encontrada', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 0 });

      await service.markAsRead(mockTenantId, mockUserId, mockNotificationId);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalled();
    });
  });

  describe('markAllAsRead', () => {
    it('deve marcar todas as notificações como lidas com sucesso', async () => {
      mockPrismaService.notification.updateMany.mockResolvedValue({ count: 5 });

      await service.markAllAsRead(mockTenantId, mockUserId);

      expect(mockPrismaService.notification.updateMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          userId: mockUserId,
          read: false,
        },
        data: {
          read: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe('findByUser', () => {
    it('deve buscar notificações do usuário com sucesso', async () => {
      const mockNotifications = [mockNotification];
      mockPrismaService.notification.findMany.mockResolvedValue(
        mockNotifications,
      );
      mockPrismaService.notification.count.mockResolvedValue(3);

      const result = await service.findByUser(
        mockTenantId,
        mockUserId,
        50,
        false,
      );

      expect(result).toHaveProperty('notifications');
      expect(result).toHaveProperty('unreadCount');
      expect(result.notifications).toHaveLength(1);
      expect(result.unreadCount).toBe(3);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          userId: mockUserId,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('deve buscar apenas notificações não lidas quando solicitado', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValue(2);

      await service.findByUser(mockTenantId, mockUserId, 50, true);

      expect(mockPrismaService.notification.count).toHaveBeenCalled();

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          userId: mockUserId,
          read: false,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('deve buscar notificações gerais (userId = null)', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValue(0);

      await service.findByUser(mockTenantId, null, 50, false);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          userId: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('deve usar limite padrão quando não especificado', async () => {
      mockPrismaService.notification.findMany.mockResolvedValue([]);
      mockPrismaService.notification.count.mockResolvedValue(0);

      await service.findByUser(mockTenantId, mockUserId);

      expect(mockPrismaService.notification.findMany).toHaveBeenCalledWith({
        where: {
          tenantId: mockTenantId,
          userId: mockUserId,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });
  });
});
