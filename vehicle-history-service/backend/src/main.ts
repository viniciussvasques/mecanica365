import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as morgan from 'morgan';
import { Logger } from 'winston';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { json, urlencoded } from 'express';

async function bootstrap() {
  // Criar aplicação NestJS
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    cors: true,
  });

  // Obter serviços de configuração e logger
  const configService = app.get(ConfigService);
  const logger = app.get<Logger>(WINSTON_MODULE_NEST_PROVIDER);

  // Configuração global de prefixo de API
  app.setGlobalPrefix('api');

  // Configuração de versionamento da API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Configuração de pipes globais
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Middlewares
  app.use(compression());
  app.use(helmet());
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  
  // Configuração de logs HTTP
  app.use(
    morgan('combined', {
      stream: {
        write: (message: string) => {
          logger.log(message.trim(), 'HTTP');
        },
      },
    }),
  );

  // Configuração do Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Carvex API')
      .setDescription('API para consulta de histórico de veículos no Brasil')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Insira o token JWT',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'method',
      },
    });
  }

  // Iniciar servidor
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);

  // Log de inicialização
  logger.log(`🚀 Aplicação rodando na porta ${port}`, 'Bootstrap');
  logger.log(`📄 Documentação disponível em: http://localhost:${port}/api/docs`, 'Bootstrap');
}

// Inicializar aplicação
bootstrap().catch((error) => {
  console.error('Falha ao iniciar a aplicação:', error);
  process.exit(1);
});
