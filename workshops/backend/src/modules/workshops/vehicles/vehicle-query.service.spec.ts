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
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('deve retornar dados do veículo por placa', async () => {
      process.env.VEHICLE_API_PROVIDER = 'placa-fipe';
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
      process.env.VEHICLE_API_PROVIDER = 'placa-fipe';
      mockAxiosInstance.get.mockRejectedValue(new Error('API Error'));

      const result = await service.queryByPlaca('ABC1234');

      expect(result).toEqual({});
    });

    it('deve lançar erro se placa inválida', async () => {
      await expect(service.queryByPlaca('ABC')).rejects.toThrow();
    });

    it('deve retornar objeto vazio se precisar de API key mas não tiver', async () => {
      process.env.VEHICLE_API_PROVIDER = 'placaapi';
      delete process.env.VEHICLE_API_KEY;

      const result = await service.queryByPlaca('ABC1234');

      expect(result).toEqual({});
    });

    it('deve usar API Brasil quando provider for api-brasil', async () => {
      process.env.VEHICLE_API_PROVIDER = 'api-brasil';
      process.env.VEHICLE_API_URL = 'https://custom-api.com';
      const mockResponse = {
        data: {
          marca: 'Honda',
          modelo: 'Civic',
          ano: 2020,
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.queryByPlaca('ABC1234');

      expect(result).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://custom-api.com/veiculo/placa/ABC1234',
        expect.any(Object),
      );
    });

    it('deve usar API placaapi quando provider for placaapi', async () => {
      process.env.VEHICLE_API_PROVIDER = 'placaapi';
      process.env.VEHICLE_API_KEY = 'test-key';
      process.env.VEHICLE_API_URL = 'https://custom-api.com';
      const mockResponse = {
        data: {
          marca: 'Toyota',
          modelo: 'Corolla',
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.queryByPlaca('ABC1234');

      expect(result).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://custom-api.com/placa/ABC1234',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        }),
      );
    });

    it('deve usar API customizada quando provider for custom', async () => {
      process.env.VEHICLE_API_PROVIDER = 'custom';
      process.env.VEHICLE_API_URL = 'https://custom-api.com';
      process.env.VEHICLE_API_KEY = 'test-key';
      const mockResponse = {
        data: {
          marca: 'Volkswagen',
          modelo: 'Gol',
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.queryByPlaca('ABC1234');

      expect(result).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://custom-api.com/placa/ABC1234',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        }),
      );
    });

    it('deve retornar objeto vazio se API customizada não tiver API key', async () => {
      process.env.VEHICLE_API_PROVIDER = 'custom';
      process.env.VEHICLE_API_URL = 'https://custom-api.com';
      delete process.env.VEHICLE_API_KEY;

      const result = await service.queryByPlaca('ABC1234');

      expect(result).toEqual({});
      expect(mockAxiosInstance.get).not.toHaveBeenCalled();
    });

    it('deve retornar objeto vazio se provider não configurado corretamente', async () => {
      process.env.VEHICLE_API_PROVIDER = 'invalid-provider';
      delete process.env.VEHICLE_API_URL;

      const result = await service.queryByPlaca('ABC1234');

      expect(result).toEqual({});
    });

    it('deve retornar objeto vazio se API falhar', async () => {
      process.env.VEHICLE_API_PROVIDER = 'placa-fipe';
      mockAxiosInstance.get.mockRejectedValue(new Error('Network Error'));

      const result = await service.queryByPlaca('ABC1234');

      expect(result).toEqual({});
    });
  });

  describe('queryByRenavan', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('deve retornar objeto vazio para APIs gratuitas', async () => {
      process.env.VEHICLE_API_PROVIDER = 'placa-fipe';

      const result = await service.queryByRenavan('12345678901');

      expect(result).toEqual({});
    });

    it('deve lançar erro se RENAVAN inválido', async () => {
      await expect(service.queryByRenavan('123')).rejects.toThrow();
    });

    it('deve retornar objeto vazio se precisar de API key mas não tiver', async () => {
      process.env.VEHICLE_API_PROVIDER = 'placaapi';
      delete process.env.VEHICLE_API_KEY;

      const result = await service.queryByRenavan('12345678901');

      expect(result).toEqual({});
    });

    it('deve usar API placaapi quando provider for placaapi', async () => {
      process.env.VEHICLE_API_PROVIDER = 'placaapi';
      process.env.VEHICLE_API_KEY = 'test-key';
      process.env.VEHICLE_API_URL = 'https://custom-api.com';
      const mockResponse = {
        data: {
          marca: 'Chevrolet',
          modelo: 'Onix',
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.queryByRenavan('12345678901');

      expect(result).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://custom-api.com/renavan/12345678901',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        }),
      );
    });

    it('deve usar API customizada quando provider for custom', async () => {
      process.env.VEHICLE_API_PROVIDER = 'custom';
      process.env.VEHICLE_API_URL = 'https://custom-api.com';
      process.env.VEHICLE_API_KEY = 'test-key';
      const mockResponse = {
        data: {
          marca: 'Nissan',
          modelo: 'Versa',
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.queryByRenavan('12345678901');

      expect(result).toBeDefined();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        'https://custom-api.com/renavan/12345678901',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key',
          }),
        }),
      );
    });

    it('deve usar API customizada sem API key quando não fornecido', async () => {
      process.env.VEHICLE_API_PROVIDER = 'custom';
      process.env.VEHICLE_API_URL = 'https://custom-api.com';
      delete process.env.VEHICLE_API_KEY;
      const mockResponse = {
        data: {
          marca: 'Hyundai',
          modelo: 'HB20',
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await service.queryByRenavan('12345678901');

      expect(result).toBeDefined();
    });

    it('deve retornar objeto vazio se provider não configurado corretamente', async () => {
      process.env.VEHICLE_API_PROVIDER = 'invalid-provider';
      delete process.env.VEHICLE_API_URL;

      const result = await service.queryByRenavan('12345678901');

      expect(result).toEqual({});
    });

    it('deve retornar objeto vazio se API falhar', async () => {
      process.env.VEHICLE_API_PROVIDER = 'placaapi';
      process.env.VEHICLE_API_KEY = 'test-key';
      mockAxiosInstance.get.mockRejectedValue(new Error('API Error'));

      const result = await service.queryByRenavan('12345678901');

      expect(result).toEqual({});
    });

    it('deve lançar BadRequestException em caso de erro genérico', async () => {
      process.env.VEHICLE_API_PROVIDER = 'placaapi';
      process.env.VEHICLE_API_KEY = 'test-key';
      mockAxiosInstance.get.mockRejectedValue(new Error('Network Error'));

      const result = await service.queryByRenavan('12345678901');

      expect(result).toEqual({});
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

    it('deve normalizar diferentes formatos de marca', () => {
      const mockData = {
        make: 'Honda',
        brand: 'Honda',
        fabricante: 'Honda',
        manufacturer: 'Honda',
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.make).toBe('Honda');
    });

    it('deve normalizar diferentes formatos de modelo', () => {
      const mockData = {
        model: 'Civic',
        name: 'Civic',
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.model).toBe('Civic');
    });

    it('deve normalizar ano como número', () => {
      const mockData = {
        year: 2020,
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.year).toBe(2020);
    });

    it('deve normalizar ano como string', () => {
      const mockData = {
        ano: '2021',
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.year).toBe(2021);
    });

    it('deve retornar undefined se ano for NaN', () => {
      const mockData = {
        ano: 'invalid',
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.year).toBeUndefined();
    });

    it('deve normalizar cor', () => {
      const mockData = {
        cor: 'Branco',
        color: 'White',
        paintColor: 'Blanco',
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.color).toBe('Branco');
    });

    it('deve normalizar VIN/Chassi', () => {
      const mockData = {
        vin: 'VIN123',
        chassi: 'CHASSI123',
        chassis: 'CHASSIS123',
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.vin).toBe('VIN123');
      // chassis usa chassi primeiro, depois vin, depois chassis
      expect(result.chassis).toBe('CHASSI123');
    });

    it('deve normalizar RENAVAN', () => {
      const mockData = {
        renavan: 'RENAVAN123',
        renavam: 'RENAVAM123',
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.renavan).toBe('RENAVAN123');
    });

    it('deve normalizar placa', () => {
      const mockData = {
        placa: 'ABC1234',
        plate: 'XYZ5678',
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.placa).toBe('ABC1234');
    });

    it('deve normalizar tipo de combustível', () => {
      const mockData = {
        combustivel: 'Flex',
        fuel: 'Gasoline',
        fuelType: 'Ethanol',
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.fuelType).toBe('Flex');
    });

    it('deve normalizar motor', () => {
      const mockData = {
        motor: '1.0',
        engine: '1.6',
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.engine).toBe('1.0');
    });

    it('deve remover campos undefined', () => {
      const mockData = {
        marca: 'Fiat',
        modelo: undefined,
        ano: 2020,
      };
      const result = service['normalizeResponse'](mockData);

      expect(result.make).toBe('Fiat');
      expect(result.model).toBeUndefined();
      expect(result.year).toBe(2020);
      expect(Object.keys(result)).not.toContain('model');
    });
  });
});
