import { Controller, Get, Post, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminJobsService } from './admin-jobs.service';

@ApiTags('Admin - Jobs')
@ApiBearerAuth()
@Controller('admin/jobs')
@UseGuards(AdminGuard)
export class AdminJobsController {
  constructor(private readonly jobsService: AdminJobsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar jobs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.jobsService.findAll({
      page: Number(page),
      limit: Number(limit),
      type,
      status,
      tenantId,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de jobs' })
  getStats() {
    return this.jobsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar job específico' })
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retentar job falhado' })
  retry(@Param('id') id: string) {
    return this.jobsService.retry(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar job' })
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }
}
