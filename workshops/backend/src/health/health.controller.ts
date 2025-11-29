import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @Public()
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('db')
  @Public()
  async checkDatabase() {
    const isHealthy = await this.healthService.checkDatabase();
    return {
      database: isHealthy ? 'connected' : 'disconnected',
    };
  }
}

