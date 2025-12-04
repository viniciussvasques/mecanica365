import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { PrismaService } from '@database/prisma.service';
import {
  CreateIntegrationDto,
  UpdateIntegrationDto,
  IntegrationType,
  IntegrationStatus,
  TestIntegrationDto,
} from './dto';
import axios, { AxiosError } from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('IntegrationsService', () => {
  let service: IntegrationsService;

  const mockTenantId = 'tenant-id';
  const mockIntegration = {
    id: 'integration-id',
    tenantId: mockTenantId,
    name: 'API RENAVAN',
    type: IntegrationType.RENAVAN,
    apiUrl: 'https://api.example.com',
    apiKey: 'test-key',
    config: {},
    status: IntegrationStatus.ACTIVE,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    integration: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createIntegrationDto: CreateIntegrationDto = {
      name: 'API RENAVAN',
      type: IntegrationType.RENAVAN,
      apiUrl: 'https://api.example.com',
      apiKey: 'test-key',
      isActive: true,
    };

    it('deve criar uma integração com sucesso', async () => {
      mockPrismaService.integration.create.mockResolvedValue(mockIntegration);

      const result = await service.create(mockTenantId, createIntegrationDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('API RENAVAN');
      expect(result.type).toBe(IntegrationType.RENAVAN);
      expect(result.apiUrl).toBe('https://api.example.com');
      expect(result.status).toBe(IntegrationStatus.ACTIVE);
      expect(result.isActive).toBe(true);
      expect(mockPrismaService.integration.create).toHaveBeenCalledWith({
        data: {
          tenantId: mockTenantId,
          name: createIntegrationDto.name,
          type: createIntegrationDto.type,
          apiUrl: createIntegrationDto.apiUrl,
          apiKey: createIntegrationDto.apiKey,
          config: {},
          status: IntegrationStatus.ACTIVE,
          isActive: true,
        },
      });
    });

    it('deve criar integração sem API key', async () => {
      const dtoWithoutKey: CreateIntegrationDto = {
        name: 'API CEP',
        type: IntegrationType.CEP,
        apiUrl: 'https://api.cep.com',
      };

      const mockIntegrationWithoutKey = {
        ...mockIntegration,
        id: 'integration-cep',
        name: 'API CEP',
        type: IntegrationType.CEP,
        apiUrl: 'https://api.cep.com',
        apiKey: null,
      };

      mockPrismaService.integration.create.mockResolvedValue(
        mockIntegrationWithoutKey,
      );

      const result = await service.create(mockTenantId, dtoWithoutKey);

      expect(result.apiKey).toBeUndefined();
      expect(result.type).toBe(IntegrationType.CEP);
    });

    it('deve criar integração com config', async () => {
      const dtoWithConfig: CreateIntegrationDto = {
        name: 'API Custom',
        type: IntegrationType.CUSTOM,
        apiUrl: 'https://api.custom.com',
        config: {
          timeout: 5000,
          retry: 3,
        },
      };

      const mockIntegrationWithConfig = {
        ...mockIntegration,
        id: 'integration-custom',
        name: 'API Custom',
        type: IntegrationType.CUSTOM,
        apiUrl: 'https://api.custom.com',
        config: dtoWithConfig.config,
      };

      mockPrismaService.integration.create.mockResolvedValue(
        mockIntegrationWithConfig,
      );

      const result = await service.create(mockTenantId, dtoWithConfig);

      expect(result.config).toEqual(dtoWithConfig.config);
    });

    it('deve criar integração inativa quando isActive false', async () => {
      const dtoInactive: CreateIntegrationDto = {
        name: 'API Inativa',
        type: IntegrationType.VIN,
        apiUrl: 'https://api.vin.com',
        isActive: false,
      };

      const mockIntegrationInactive = {
        ...mockIntegration,
        id: 'integration-inactive',
        name: 'API Inativa',
        type: IntegrationType.VIN,
        apiUrl: 'https://api.vin.com',
        isActive: false,
      };

      mockPrismaService.integration.create.mockResolvedValue(
        mockIntegrationInactive,
      );

      const result = await service.create(mockTenantId, dtoInactive);

      expect(result.isActive).toBe(false);
    });

    it('deve criar integração ativa por padrão', async () => {
      const dtoWithoutActive: CreateIntegrationDto = {
        name: 'API Default',
        type: IntegrationType.CEP,
        apiUrl: 'https://api.default.com',
      };

      const mockIntegrationDefault = {
        ...mockIntegration,
        id: 'integration-default',
        name: 'API Default',
        type: IntegrationType.CEP,
        apiUrl: 'https://api.default.com',
        isActive: true,
      };

      mockPrismaService.integration.create.mockResolvedValue(
        mockIntegrationDefault,
      );

      const result = await service.create(mockTenantId, dtoWithoutActive);

      expect(result.isActive).toBe(true);
    });

    it('deve criar integração com todos os tipos', async () => {
      const types = [
        IntegrationType.RENAVAN,
        IntegrationType.VIN,
        IntegrationType.CEP,
        IntegrationType.CUSTOM,
      ];

      for (const type of types) {
        const dto: CreateIntegrationDto = {
          name: `API ${type}`,
          type,
          apiUrl: `https://api.${type}.com`,
        };

        const mockIntegrationForType = {
          ...mockIntegration,
          id: `integration-${type}`,
          name: `API ${type}`,
          type,
          apiUrl: `https://api.${type}.com`,
        };

        mockPrismaService.integration.create.mockResolvedValueOnce(
          mockIntegrationForType,
        );

        const result = await service.create(mockTenantId, dto);
        expect(result.type).toBe(type);
      }
    });
  });

  describe('findAll', () => {
    it('deve listar integrações com sucesso', async () => {
      mockPrismaService.integration.findMany.mockResolvedValue([
        mockIntegration,
      ]);

      const result = await service.findAll(mockTenantId);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('id', mockIntegration.id);
    });
  });

  describe('findOne', () => {
    it('deve buscar integração por ID com sucesso', async () => {
      mockPrismaService.integration.findFirst.mockResolvedValue(
        mockIntegration,
      );

      const result = await service.findOne(mockTenantId, 'integration-id');

      expect(result).toHaveProperty('id', mockIntegration.id);
      expect(result.name).toBe(mockIntegration.name);
    });

    it('deve lançar erro se integração não encontrada', async () => {
      mockPrismaService.integration.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar integração com sucesso', async () => {
      const updateDto: UpdateIntegrationDto = {
        name: 'Updated Name',
        isActive: false,
      };

      const updatedIntegration = {
        ...mockIntegration,
        name: 'Updated Name',
        isActive: false,
      };

      mockPrismaService.integration.findFirst.mockResolvedValue(
        mockIntegration,
      );
      mockPrismaService.integration.update.mockResolvedValue(
        updatedIntegration,
      );

      const result = await service.update(
        mockTenantId,
        'integration-id',
        updateDto,
      );

      expect(result.name).toBe('Updated Name');
      expect(result.isActive).toBe(false);
      expect(mockPrismaService.integration.update).toHaveBeenCalled();
    });

    it('deve lançar erro se integração não encontrada', async () => {
      const updateDto: UpdateIntegrationDto = {
        name: 'Updated Name',
      };

      mockPrismaService.integration.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, 'non-existent', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve remover integração com sucesso', async () => {
      mockPrismaService.integration.findFirst.mockResolvedValue(
        mockIntegration,
      );
      mockPrismaService.integration.delete.mockResolvedValue(mockIntegration);

      await service.remove(mockTenantId, 'integration-id');

      expect(mockPrismaService.integration.delete).toHaveBeenCalledWith({
        where: { id: 'integration-id' },
      });
    });

    it('deve lançar erro se integração não encontrada', async () => {
      mockPrismaService.integration.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('test', () => {
    it('deve lançar erro se integração não encontrada', async () => {
      const testData: TestIntegrationDto = {
        testData: { renavan: '12345678901' },
      };

      await expect(
        service.test(mockTenantId, 'non-existent', testData),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar erro se integração não está ativa', async () => {
      // Mock findOne para retornar integração inativa
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...mockIntegration,
        isActive: false,
      });

      const testData: TestIntegrationDto = {
        testData: { renavan: '12345678901' },
      };

      await expect(
        service.test(mockTenantId, 'integration-id', testData),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve testar integração com sucesso', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockIntegration);

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      const testData: TestIntegrationDto = {
        testData: { renavan: '12345678901' },
      };

      const result = await service.test(
        mockTenantId,
        'integration-id',
        testData,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('sucesso');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.post).toHaveBeenCalledWith(
        mockIntegration.apiUrl,
        testData.testData,
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-API-Key': mockIntegration.apiKey,
          }) as never,
        }) as never,
      );
    });

    it('deve testar integração sem API key', async () => {
      const integrationWithoutKey = {
        ...mockIntegration,
        apiKey: undefined,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(integrationWithoutKey);

      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { success: true },
      });

      const testData: TestIntegrationDto = {
        testData: { cep: '01310-100' },
      };

      const result = await service.test(
        mockTenantId,
        'integration-id',
        testData,
      );

      expect(result.success).toBe(true);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mockedAxios.post).toHaveBeenCalledWith(
        integrationWithoutKey.apiUrl,
        testData.testData,
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'X-API-Key': expect.anything() as never,
          }) as never,
        }) as never,
      );
    });

    it('deve retornar erro quando teste falha', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockIntegration);

      const axiosError = {
        response: {
          status: 500,
          data: { error: 'Internal Server Error' },
        },
        message: 'Network Error',
      } as AxiosError;

      mockedAxios.post.mockRejectedValue(axiosError);

      const testData: TestIntegrationDto = {
        testData: { renavan: '12345678901' },
      };

      const result = await service.test(
        mockTenantId,
        'integration-id',
        testData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Erro');
      expect(result.data).toEqual(axiosError.response?.data);
    });

    it('deve lidar com timeout', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockIntegration);

      const timeoutError = {
        message: 'timeout of 10000ms exceeded',
        code: 'ECONNABORTED',
      };

      mockedAxios.post.mockRejectedValue(timeoutError);

      const testData: TestIntegrationDto = {
        testData: { renavan: '12345678901' },
      };

      const result = await service.test(
        mockTenantId,
        'integration-id',
        testData,
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Erro');
    });
  });

  describe('toResponseDto', () => {
    it('deve ocultar API key na resposta', async () => {
      const createDto: CreateIntegrationDto = {
        name: 'API Test',
        type: IntegrationType.RENAVAN,
        apiUrl: 'https://api.test.com',
        apiKey: 'secret-key',
      };

      const result = await service.create(mockTenantId, createDto);

      expect(result.apiKey).toBe('***');
    });

    it('deve retornar undefined quando não há API key', async () => {
      const createDto: CreateIntegrationDto = {
        name: 'API Test',
        type: IntegrationType.CEP,
        apiUrl: 'https://api.test.com',
      };

      const mockIntegrationWithoutKey = {
        ...mockIntegration,
        id: 'integration-test',
        name: 'API Test',
        type: IntegrationType.RENAVAN,
        apiUrl: 'https://api.test.com',
        apiKey: null,
      };

      mockPrismaService.integration.create.mockResolvedValue(
        mockIntegrationWithoutKey,
      );

      const result = await service.create(mockTenantId, createDto);

      expect(result.apiKey).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('deve lidar com erros ao criar integração', async () => {
      const createDto: CreateIntegrationDto = {
        name: 'API Test',
        type: IntegrationType.RENAVAN,
        apiUrl: 'https://api.test.com',
        apiKey: 'secret-key',
      };

      mockPrismaService.integration.create.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.create(mockTenantId, createDto)).rejects.toThrow(
        'Database error',
      );
    });

    it('deve lidar com erros ao listar integrações', async () => {
      mockPrismaService.integration.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(service.findAll(mockTenantId)).rejects.toThrow(
        'Database error',
      );
    });
  });
});
