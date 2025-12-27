import { Module, Logger } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobsProcessor } from './jobs.processor';
import { PrismaModule } from '@database/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * JobsModule - Módulo para processamento assíncrono com Bull + Redis
 */
@Module({
  imports: [
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('redis.host') || configService.get<string>('REDIS_HOST') || 'localhost';
        const port = configService.get<number>('redis.port') || configService.get<number>('REDIS_PORT') || 6379;
        const password = configService.get<string>('redis.password') || configService.get<string>('REDIS_PASSWORD');

        const logger = new Logger('JobsModule');
        logger.log(`Redis Config: host=${host}, port=${port}, hasPassword=${!!password}`);

        return {
          redis: {
            host,
            port,
            password,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'jobs',
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsProcessor],
  exports: [JobsService],
})
export class JobsModule { }
