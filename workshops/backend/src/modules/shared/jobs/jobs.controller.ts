import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
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
import { Roles } from '@core/auth/decorators/roles.decorator';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

@ApiTags('Jobs')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'manager', 'superadmin')
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
  findAll(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Query() filters: JobFiltersDto,
  ) {
    // Superadmin pode ver jobs de todos os tenants
    const effectiveTenantId = user.role === 'superadmin' ? undefined : tenantId;
    return this.jobsService.findAll(effectiveTenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar job por ID' })
  @ApiResponse({
    status: 200,
    description: 'Job encontrado',
    type: JobResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job não encontrado' })
  findOne(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<JobResponseDto> {
    // Superadmin pode ver qualquer job
    const effectiveTenantId = user.role === 'superadmin' ? undefined : tenantId;
    return this.jobsService.findOne(effectiveTenantId, id);
  }
}
