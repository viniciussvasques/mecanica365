import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { getErrorMessage } from '@common/utils/error.utils';

export interface VehicleQueryResult {
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  vin?: string;
  renavan?: string;
  placa?: string;
  fuelType?: string;
  engine?: string;
  chassis?: string;
}

// Interface para tipar dados de resposta da API
interface ApiResponseData {
  marca?: string;
  make?: string;
  brand?: string;
  fabricante?: string;
  manufacturer?: string;
  modelo?: string;
  model?: string;
  name?: string;
  ano?: number | string;
  year?: number | string;
  anoFabricacao?: number | string;
  manufactureYear?: number | string;
  cor?: string;
  color?: string;
  paintColor?: string;
  vin?: string;
  chassi?: string;
  chassis?: string;
  chassiNumber?: string;
  renavan?: string;
  renavam?: string;
  renavamNumber?: string;
  placa?: string;
  plate?: string;
  placaNumber?: string;
  combustivel?: string;
  fuel?: string;
  fuelType?: string;
  combustivelType?: string;
  motor?: string;
  engine?: string;
  engineNumber?: string;
  [key: string]: unknown;
}

@Injectable()
export class VehicleQueryService {
  private readonly logger = new Logger(VehicleQueryService.name);
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Consulta dados do veículo por placa
   * Usa API pública (PlacaAPI.com ou similar)
   */
  async queryByPlaca(placa: string): Promise<VehicleQueryResult> {
    try {
      // Remover formatação da placa
      const cleanPlaca = placa.replace(/[^A-Z0-9]/g, '').toUpperCase();

      if (cleanPlaca.length < 7) {
        throw new BadRequestException('Placa inválida');
      }

      // TODO: Configurar API key em variável de ambiente
      // Por enquanto, usando API pública sem autenticação
      // Exemplo: https://api.placaapi.com/v1/placa/{placa}

      // Nota: A maioria das APIs públicas requerem autenticação/API key
      // Você precisará se registrar em uma das seguintes:
      // - PlacaAPI.com
      // - Placas.app.br
      // - Netrin
      // - API Integra

      // Por enquanto, retornamos um exemplo de estrutura
      // Substitua pela chamada real da API quando tiver a chave

      this.logger.log(`Consultando dados do veículo pela placa: ${cleanPlaca}`);

      const apiKey = process.env.VEHICLE_API_KEY;
      const apiProvider = process.env.VEHICLE_API_PROVIDER || 'placa-fipe'; // 'placa-fipe' | 'placaapi' | 'custom'
      const apiUrl = process.env.VEHICLE_API_URL;

      // APIs gratuitas não precisam de API key
      const freeProviders = ['placa-fipe', 'api-brasil'];
      const needsApiKey = !freeProviders.includes(apiProvider);

      // Se precisar de API key mas não tiver, retorna objeto vazio
      if (needsApiKey && !apiKey) {
        this.logger.warn(
          'VEHICLE_API_KEY não configurada. Sistema funcionará sem preenchimento automático.',
        );
        return {};
      }

      // Fazer chamada à API conforme o provedor
      try {
        let response;

        if (apiProvider === 'api-brasil') {
          // API Brasil - 7 consultas/dia grátis
          const baseUrl = apiUrl || 'https://apibrasil.com.br/api/v1';
          response = await this.httpClient.get(
            `${baseUrl}/veiculo/placa/${cleanPlaca}`,
            {
              headers: {
                Accept: 'application/json',
              },
            },
          );
        } else if (apiProvider === 'placa-fipe') {
          // API Gratuita do GitHub (50 consultas/mês)
          // Não requer API key
          response = await this.httpClient.get(
            `https://placa-fipe-api.vercel.app/api/${cleanPlaca}`,
            {
              headers: {
                Accept: 'application/json',
              },
            },
          );
        } else if (apiProvider === 'placaapi') {
          // PlacaAPI.com (paga, mas tem 10 consultas grátis)
          const baseUrl = apiUrl || 'https://api.placaapi.com/v1';
          response = await this.httpClient.get(
            `${baseUrl}/placa/${cleanPlaca}`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );
        } else if (apiProvider === 'custom' && apiUrl) {
          // API customizada configurada pelo usuário
          response = await this.httpClient.get(
            `${apiUrl}/placa/${cleanPlaca}`,
            {
              headers: {
                Authorization: apiKey ? `Bearer ${apiKey}` : undefined,
                'X-API-Key': apiKey || undefined,
              },
            },
          );
        } else {
          this.logger.warn('Provedor de API não configurado corretamente.');
          return {};
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return this.normalizeResponse(response.data as unknown);
      } catch (apiError: unknown) {
        // Se a API falhar, loga mas não bloqueia o sistema
        this.logger.warn(
          `Erro ao consultar API (${apiProvider}): ${getErrorMessage(apiError)}`,
        );
        return {}; // Retorna vazio para não bloquear o cadastro manual
      }
    } catch (error) {
      this.logger.error(
        `Erro ao consultar veículo por placa: ${getErrorMessage(error)}`,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erro ao consultar dados do veículo');
    }
  }

  /**
   * Consulta dados do veículo por RENAVAN
   */
  async queryByRenavan(renavan: string): Promise<VehicleQueryResult> {
    try {
      // Remover formatação do RENAVAN
      const cleanRenavan = renavan.replace(/\D/g, '');

      if (cleanRenavan.length !== 11) {
        throw new BadRequestException('RENAVAN deve ter 11 dígitos');
      }

      this.logger.log(
        `Consultando dados do veículo pelo RENAVAN: ${cleanRenavan}`,
      );

      const apiKey = process.env.VEHICLE_API_KEY;
      const apiProvider = process.env.VEHICLE_API_PROVIDER || 'placa-fipe';
      const apiUrl = process.env.VEHICLE_API_URL;

      // APIs gratuitas não suportam RENAVAN, apenas placa
      const freeProviders = ['placa-fipe', 'api-brasil'];
      const needsApiKey = !freeProviders.includes(apiProvider);

      // Se precisar de API key mas não tiver, retorna objeto vazio
      if (needsApiKey && !apiKey) {
        this.logger.warn(
          'VEHICLE_API_KEY não configurada. Sistema funcionará sem preenchimento automático.',
        );
        return {};
      }

      // APIs gratuitas não suportam RENAVAN
      if (freeProviders.includes(apiProvider)) {
        this.logger.warn(
          'Consulta por RENAVAN não suportada pela API gratuita. Use uma API paga.',
        );
        return {};
      }

      // Fazer chamada à API conforme o provedor
      try {
        let response;

        if (apiProvider === 'placaapi') {
          // PlacaAPI.com suporta RENAVAN
          const baseUrl = apiUrl || 'https://api.placaapi.com/v1';
          response = await this.httpClient.get(
            `${baseUrl}/renavan/${cleanRenavan}`,
            {
              headers: {
                Authorization: `Bearer ${apiKey}`,
              },
            },
          );
        } else if (apiProvider === 'custom' && apiUrl) {
          // API customizada
          response = await this.httpClient.get(
            `${apiUrl}/renavan/${cleanRenavan}`,
            {
              headers: {
                Authorization: apiKey ? `Bearer ${apiKey}` : undefined,
                'X-API-Key': apiKey || undefined,
              },
            },
          );
        } else {
          this.logger.warn(
            'Provedor de API não configurado corretamente para RENAVAN.',
          );
          return {};
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return this.normalizeResponse(response.data as unknown);
      } catch (apiError: unknown) {
        // Se a API falhar, loga mas não bloqueia o sistema
        this.logger.warn(
          `Erro ao consultar API (${apiProvider}): ${getErrorMessage(apiError)}`,
        );
        return {}; // Retorna vazio para não bloquear o cadastro manual
      }
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao consultar veículo por RENAVAN: ${getErrorMessage(error)}`,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erro ao consultar dados do veículo');
    }
  }

  /**
   * Normaliza resposta da API externa para formato padrão
   * Suporta diferentes formatos de resposta das APIs
   */
  private normalizeResponse(data: unknown): VehicleQueryResult {
    // Se data já estiver no formato correto ou for um objeto vazio
    if (!data || typeof data !== 'object') {
      return {};
    }

    // Cast para ApiResponseData para acessar propriedades com segurança
    const apiData = data as ApiResponseData;

    // Normalizar diferentes formatos de resposta
    const result: VehicleQueryResult = {};

    // Marca
    result.make =
      apiData.marca ||
      apiData.make ||
      apiData.brand ||
      apiData.fabricante ||
      apiData.manufacturer;

    // Modelo
    result.model = apiData.modelo || apiData.model || apiData.name;

    // Ano
    if (
      apiData.ano ||
      apiData.year ||
      apiData.anoFabricacao ||
      apiData.manufactureYear
    ) {
      const yearValue =
        apiData.ano ||
        apiData.year ||
        apiData.anoFabricacao ||
        apiData.manufactureYear;
      result.year =
        typeof yearValue === 'number'
          ? yearValue
          : Number.parseInt(String(yearValue), 10);
      if (Number.isNaN(result.year ?? 0)) {
        result.year = undefined;
      }
    }

    // Cor
    result.color = apiData.cor || apiData.color || apiData.paintColor;

    // VIN/Chassi
    result.vin =
      apiData.vin || apiData.chassi || apiData.chassis || apiData.chassiNumber;

    // RENAVAN
    result.renavan =
      apiData.renavan || apiData.renavam || apiData.renavamNumber;

    // Placa
    result.placa = apiData.placa || apiData.plate || apiData.placaNumber;

    // Combustível
    result.fuelType =
      apiData.combustivel ||
      apiData.fuel ||
      apiData.fuelType ||
      apiData.combustivelType;

    // Motor
    result.engine = apiData.motor || apiData.engine || apiData.engineNumber;

    // Chassi (separado do VIN)
    result.chassis = apiData.chassi || apiData.chassis || apiData.chassiNumber;

    // Remover campos undefined
    Object.keys(result).forEach((key) => {
      if (result[key as keyof VehicleQueryResult] === undefined) {
        delete result[key as keyof VehicleQueryResult];
      }
    });

    return result;
  }
}
