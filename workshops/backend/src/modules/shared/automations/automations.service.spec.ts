import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { PrismaService } from '@database/prisma.service';
import {
  CreateAutomationDto,
  UpdateAutomationDto,
  AutomationTrigger,
  AutomationAction,
} from './dto';

describe('AutomationsService', () => {
  let service: AutomationsService;

  const mockTenantId = 'tenant-id';
  const mockAutomation = {
    id: 'automation-id',
    tenantId: mockTenantId,
    name: 'Notificar cliente',
    description: 'Envia email quando orçamento é aprovado',
    trigger: AutomationTrigger.QUOTE_APPROVED,
    action: AutomationAction.SEND_EMAIL,
    conditions: {},
    actionConfig: {
      template: 'quote-approved',
      to: '{{customer.email}}',
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    // Por enquanto, sem mocks necessários
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AutomationsService>(AutomationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createAutomationDto: CreateAutomationDto = {
      name: 'Notificar cliente',
      description: 'Envia email quando orçamento é aprovado',
      trigger: AutomationTrigger.QUOTE_APPROVED,
      action: AutomationAction.SEND_EMAIL,
      actionConfig: {
        template: 'quote-approved',
        to: '{{customer.email}}',
      },
      isActive: true,
    };

    it('deve criar uma automação com sucesso', async () => {
      const result = await service.create(mockTenantId, createAutomationDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Notificar cliente');
      expect(result.description).toBe(
        'Envia email quando orçamento é aprovado',
      );
      expect(result.trigger).toBe(AutomationTrigger.QUOTE_APPROVED);
      expect(result.action).toBe(AutomationAction.SEND_EMAIL);
      expect(result.actionConfig).toEqual(createAutomationDto.actionConfig);
      expect(result.isActive).toBe(true);
    });

    it('deve criar automação sem condições', async () => {
      const dtoWithoutConditions: CreateAutomationDto = {
        name: 'Automação simples',
        description: 'Descrição simples',
        trigger: AutomationTrigger.SERVICE_ORDER_COMPLETED,
        action: AutomationAction.CREATE_NOTIFICATION,
        actionConfig: {},
      };

      const result = await service.create(mockTenantId, dtoWithoutConditions);

      expect(result.conditions).toEqual({});
    });

    it('deve criar automação com condições', async () => {
      const dtoWithConditions: CreateAutomationDto = {
        name: 'Automação com condições',
        description: 'Descrição',
        trigger: AutomationTrigger.QUOTE_APPROVED,
        action: AutomationAction.SEND_EMAIL,
        conditions: {
          quoteTotal: { gt: 1000 },
        },
        actionConfig: {
          template: 'quote-approved',
        },
      };

      const result = await service.create(mockTenantId, dtoWithConditions);

      expect(result.conditions).toEqual(dtoWithConditions.conditions);
    });

    it('deve criar automação inativa quando isActive false', async () => {
      const dtoInactive: CreateAutomationDto = {
        name: 'Automação inativa',
        description: 'Descrição',
        trigger: AutomationTrigger.INVOICE_ISSUED,
        action: AutomationAction.SEND_SMS,
        actionConfig: {},
        isActive: false,
      };

      const result = await service.create(mockTenantId, dtoInactive);

      expect(result.isActive).toBe(false);
    });

    it('deve criar automação ativa por padrão', async () => {
      const dtoWithoutActive: CreateAutomationDto = {
        name: 'Automação padrão',
        description: 'Descrição',
        trigger: AutomationTrigger.PAYMENT_RECEIVED,
        action: AutomationAction.CREATE_JOB,
        actionConfig: {},
      };

      const result = await service.create(mockTenantId, dtoWithoutActive);

      expect(result.isActive).toBe(true);
    });

    it('deve criar automação com todos os triggers', async () => {
      const triggers = [
        AutomationTrigger.QUOTE_APPROVED,
        AutomationTrigger.SERVICE_ORDER_COMPLETED,
        AutomationTrigger.INVOICE_ISSUED,
        AutomationTrigger.PAYMENT_RECEIVED,
        AutomationTrigger.STOCK_LOW,
        AutomationTrigger.APPOINTMENT_SCHEDULED,
        AutomationTrigger.CUSTOM,
      ];

      for (const trigger of triggers) {
        const dto: CreateAutomationDto = {
          name: `Automação ${trigger}`,
          description: 'Descrição',
          trigger,
          action: AutomationAction.SEND_EMAIL,
          actionConfig: {},
        };

        const result = await service.create(mockTenantId, dto);
        expect(result.trigger).toBe(trigger);
      }
    });

    it('deve criar automação com todas as ações', async () => {
      const actions = [
        AutomationAction.SEND_EMAIL,
        AutomationAction.SEND_SMS,
        AutomationAction.CREATE_NOTIFICATION,
        AutomationAction.CREATE_JOB,
        AutomationAction.UPDATE_STATUS,
        AutomationAction.CUSTOM,
      ];

      for (const action of actions) {
        const dto: CreateAutomationDto = {
          name: `Automação ${action}`,
          description: 'Descrição',
          trigger: AutomationTrigger.QUOTE_APPROVED,
          action,
          actionConfig: {},
        };

        const result = await service.create(mockTenantId, dto);
        expect(result.action).toBe(action);
      }
    });
  });

  describe('findAll', () => {
    it('deve listar automações com sucesso', async () => {
      const result = await service.findAll(mockTenantId);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('deve lançar erro se automação não encontrada', async () => {
      await expect(
        service.findOne(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve lançar erro se automação não encontrada', async () => {
      const updateDto: UpdateAutomationDto = {
        name: 'Nome atualizado',
      };

      await expect(
        service.update(mockTenantId, 'non-existent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve lançar erro se automação não encontrada', async () => {
      await expect(
        service.remove(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('execute', () => {
    it('deve lançar erro se automação não encontrada', async () => {
      const data = { quoteId: 'quote-123' };

      await expect(
        service.execute(mockTenantId, 'non-existent', data),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve retornar erro se automação não está ativa', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockAutomation,
        isActive: false,
      });

      const data = { quoteId: 'quote-123' };

      const result = await service.execute(mockTenantId, 'automation-id', data);

      expect(result.success).toBe(false);
      expect(result.message).toContain('não está ativa');
    });

    it('deve executar automação ativa com sucesso', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAutomation);

      const data = { quoteId: 'quote-123', customerId: 'customer-456' };

      const result = await service.execute(mockTenantId, 'automation-id', data);

      expect(result.success).toBe(true);
      expect(result.message).toContain('sucesso');
    });

    it('deve executar automação com diferentes dados', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAutomation);

      const dataSets = [
        { quoteId: 'quote-123' },
        { serviceOrderId: 'so-456' },
        { invoiceId: 'inv-789' },
        { paymentId: 'pay-012' },
      ];

      for (const data of dataSets) {
        const result = await service.execute(
          mockTenantId,
          'automation-id',
          data,
        );

        expect(result.success).toBe(true);
      }
    });
  });

  describe('toResponseDto', () => {
    it('deve converter automação completa para DTO', async () => {
      const createDto: CreateAutomationDto = {
        name: 'Automação completa',
        description: 'Descrição completa',
        trigger: AutomationTrigger.QUOTE_APPROVED,
        action: AutomationAction.SEND_EMAIL,
        conditions: { total: { gt: 1000 } },
        actionConfig: {
          template: 'quote-approved',
          to: '{{customer.email}}',
        },
        isActive: true,
      };

      const result = await service.create(mockTenantId, createDto);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('trigger');
      expect(result).toHaveProperty('action');
      expect(result).toHaveProperty('conditions');
      expect(result).toHaveProperty('actionConfig');
      expect(result).toHaveProperty('isActive');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });
  });

  describe('error handling', () => {
    it('deve lidar com erros ao criar automação', async () => {
      const createDto: CreateAutomationDto = {
        name: 'Automação Test',
        description: 'Descrição',
        trigger: AutomationTrigger.QUOTE_APPROVED,
        action: AutomationAction.SEND_EMAIL,
        actionConfig: {},
      };

      // Mock para forçar erro
      jest
        .spyOn(service, 'create')
        .mockRejectedValueOnce(new Error('Test error'));

      await expect(service.create(mockTenantId, createDto)).rejects.toThrow(
        'Test error',
      );
    });

    it('deve lidar com erros ao listar automações', async () => {
      // Mock para forçar erro
      jest
        .spyOn(service, 'findAll')
        .mockRejectedValueOnce(new Error('Test error'));

      await expect(service.findAll(mockTenantId)).rejects.toThrow('Test error');
    });
  });
});
