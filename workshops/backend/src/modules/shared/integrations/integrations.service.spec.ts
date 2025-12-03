import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { PrismaService } from '@database/prisma.service';
import { CreateIntegrationDto, IntegrationType } from './dto';
import axios from 'axios';

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
    status: 'active' as const,
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
      const result = await service.create(mockTenantId, createIntegrationDto);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('API RENAVAN');
      expect(result.type).toBe(IntegrationType.RENAVAN);
    });
  });

  describe('findAll', () => {
    it('deve listar integrações com sucesso', async () => {
      const result = await service.findAll(mockTenantId);

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOne', () => {
    it('deve lançar erro se integração não encontrada', async () => {
      await expect(
        service.findOne(mockTenantId, 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

