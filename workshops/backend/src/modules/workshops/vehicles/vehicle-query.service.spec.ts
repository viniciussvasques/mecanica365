import { Test, TestingModule } from '@nestjs/testing';
import { VehicleQueryService } from './vehicle-query.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('VehicleQueryService', () => {
  let service: VehicleQueryService;
  let mockAxiosInstance: { get: jest.Mock };

  beforeEach(async () => {
    mockAxiosInstance = { get: jest.fn() };
    (mockedAxios.create as jest.Mock).mockReturnValue(mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [VehicleQueryService],
    }).compile();

    service = module.get<VehicleQueryService>(VehicleQueryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('queryByPlaca', () => {
    it('deve retornar dados do veículo por placa', async () => {
      const mockResponse = {
        data: {
          marca: 'Fiat',
          modelo: 'Uno',
          ano: '2020',
          cor: 'Branco',
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.queryByPlaca('ABC1234');

      expect(result).toBeDefined();
      expect(result.make).toBe('Fiat');
      expect(result.model).toBe('Uno');
    });

    it('deve retornar objeto vazio se API falhar', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('API Error'));

      const result = await service.queryByPlaca('ABC1234');

      expect(result).toEqual({});
    });

    it('deve lançar erro se placa inválida', async () => {
      await expect(service.queryByPlaca('ABC')).rejects.toThrow();
    });
  });

  describe('queryByRenavan', () => {
    it('deve retornar objeto vazio para APIs gratuitas', async () => {
      const result = await service.queryByRenavan('12345678901');

      expect(result).toEqual({});
    });

    it('deve lançar erro se RENAVAN inválido', async () => {
      await expect(service.queryByRenavan('123')).rejects.toThrow();
    });
  });

  describe('normalizeResponse', () => {
    it('deve normalizar resposta da API', () => {
      const mockData = {
        marca: 'Fiat',
        modelo: 'Uno',
        ano: '2020',
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.make).toBe('Fiat');
      expect(result.model).toBe('Uno');
      expect(result.year).toBe(2020);
    });

    it('deve retornar objeto vazio se data for inválido', () => {
      const result = service['normalizeResponse'](null);

      expect(result).toEqual({});
    });
  });
});

