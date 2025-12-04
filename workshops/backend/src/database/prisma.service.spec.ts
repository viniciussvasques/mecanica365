import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;
  let mockConnect: jest.SpyInstance;
  let mockDisconnect: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Criar spies nos métodos do PrismaClient
    mockConnect = jest.spyOn(service, '$connect');
    mockDisconnect = jest.spyOn(service, '$disconnect');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('deve conectar ao banco de dados com sucesso', async () => {
      mockConnect.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('deve ignorar erros de conexão durante inicialização', async () => {
      const error = new Error('Connection failed');
      mockConnect.mockRejectedValue(error);

      // Não deve lançar erro
      await expect(service.onModuleInit()).resolves.toBeUndefined();

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it('deve ignorar diferentes tipos de erros', async () => {
      mockConnect.mockRejectedValue('String error');

      await expect(service.onModuleInit()).resolves.toBeUndefined();

      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('deve desconectar do banco de dados com sucesso', async () => {
      mockDisconnect.mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('deve ignorar erros de desconexão', async () => {
      const error = new Error('Disconnection failed');
      mockDisconnect.mockRejectedValue(error);

      // Não deve lançar erro
      await expect(service.onModuleDestroy()).resolves.toBeUndefined();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it('deve ignorar diferentes tipos de erros na desconexão', async () => {
      mockDisconnect.mockRejectedValue('String error');

      await expect(service.onModuleDestroy()).resolves.toBeUndefined();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
