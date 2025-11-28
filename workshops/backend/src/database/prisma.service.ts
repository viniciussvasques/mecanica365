import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect().catch(() => {
      // Ignore connection errors during initialization
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect().catch(() => {
      // Ignore disconnection errors
    });
  }
}
