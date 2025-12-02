import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as Joi from 'joi';

// Módulos da aplicação
import { VeiculoModule } from './modules/veiculo/veiculo.module';
import { DocumentoModule } from './modules/documento/documento.module';
import { SinistroModule } from './modules/sinistro/sinistro.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuarioModule } from './modules/usuario/usuario.module';
import { IntegracaoModule } from './modules/integracao/integracao.module';
import { RelatorioModule } from './modules/relatorio/relatorio.module';

// Módulos compartilhados
import { DatabaseModule } from './shared/database/database.module';
import { CacheModule as CacheModuleCustom } from './shared/cache/cache.module';
import { LoggerModule } from './shared/logger/logger.module';
import { ExceptionModule } from './shared/exception/exception.module';

// Filtros e interceptadores
import { HttpExceptionFilter } from './shared/exception/http-exception.filter';
import { LoggingInterceptor } from './shared/interceptors/logging.interceptor';
import { TimeoutInterceptor } from './shared/interceptors/timeout.interceptor';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';

// Serviços
import { AppService } from './app.service';

// Controladores
import { AppController } from './app.controller';

@Module({
  imports: [
    // Configuração do ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('1d'),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().optional(),
        CACHE_TTL: Joi.number().default(86400),
        CORS_ORIGIN: Joi.string().default('*'),
      }),
    }),

    // Configuração do banco de dados
    DatabaseModule,
    
    // Módulos da aplicação
    VeiculoModule,
    DocumentoModule,
    SinistroModule,
    AuthModule,
    UsuarioModule,
    IntegracaoModule,
    RelatorioModule,
    
    // Módulos compartilhados
    LoggerModule,
    ExceptionModule,
    CacheModuleCustom,
    
    // Configuração de cache
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        ttl: configService.get<number>('CACHE_TTL', 86400),
        max: 1000, // máximo de itens em cache
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
    
    // Configuração de rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get('RATE_LIMIT_WINDOW_MS', 900000),
        limit: config.get('RATE_LIMIT_MAX', 100),
      }),
    }),
    
    // Agendamento de tarefas
    ScheduleModule.forRoot(),
    
    // Eventos
    EventEmitterModule.forRoot(),
    
    // Servir arquivos estáticos
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
