import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RateLimitingService } from './rate-limiting.service';

/**
 * RateLimitingModule - Módulo para rate limiting
 *
 * Integrado com @nestjs/throttler para proteção contra abuso de API
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('RATE_LIMIT_TTL', 60000), // 1 minuto
            limit: configService.get<number>('RATE_LIMIT_MAX', 100), // 100 requisições
          },
        ],
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    RateLimitingService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [RateLimitingService],
})
export class RateLimitingModule {}
