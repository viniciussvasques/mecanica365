import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { PrismaService } from '@database/prisma.service';
import {
  CreateAutomationDto,
  AutomationTrigger,
  AutomationAction,
} from './dto';

describe('AutomationsService', () => {
  let service: AutomationsService;

  const mockTenantId = 'tenant-id';
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
      expect(result.trigger).toBe(AutomationTrigger.QUOTE_APPROVED);
      expect(result.action).toBe(AutomationAction.SEND_EMAIL);
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
});

