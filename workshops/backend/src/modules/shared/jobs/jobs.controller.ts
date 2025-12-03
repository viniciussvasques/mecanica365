import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { CreateJobDto, JobResponseDto, JobFiltersDto } from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('admin', 'manager')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo job' })
  @ApiResponse({
    status: 201,
    description: 'Job criado com sucesso',
    type: JobResponseDto,
  })
  create(
    @TenantId() tenantId: string,
    @Body() createJobDto: CreateJobDto,
  ): Promise<JobResponseDto> {
    return this.jobsService.create(tenantId, createJobDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar jobs' })
  @ApiResponse({
    status: 200,
    description: 'Lista de jobs',
    type: [JobResponseDto],
  })
  findAll(@TenantId() tenantId: string, @Query() filters: JobFiltersDto) {
    return this.jobsService.findAll(tenantId, filters);
  }
}
