import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * RateLimitingService - Serviço para rate limiting
 *
 * Integrado com @nestjs/throttler para proteção contra abuso de API
 */
@Injectable()
export class RateLimitingService {
  private readonly logger = new Logger(RateLimitingService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Obtém configuração de rate limiting
   */
  getConfig(): {
    ttl: number;
    limit: number;
  } {
    return {
      ttl: this.configService.get<number>('RATE_LIMIT_TTL', 60000), // 1 minuto padrão
      limit: this.configService.get<number>('RATE_LIMIT_MAX', 100), // 100 requisições padrão
    };
  }

  /**
   * Verifica se uma requisição deve ser bloqueada
   * (Normalmente feito automaticamente pelo ThrottlerGuard)
   */
  shouldBlock(identifier: string): boolean {
    // Lógica adicional de rate limiting pode ser implementada aqui
    // Por enquanto, o ThrottlerGuard faz o trabalho principal
    return false;
  }
}



