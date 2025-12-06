import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditLogResponseDto, AuditLogFiltersDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
}

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('admin', 'manager', 'superadmin')
  @ApiOperation({ summary: 'Listar logs de auditoria' })
  @ApiResponse({
    status: 200,
    description: 'Lista de logs de auditoria',
    type: [AuditLogResponseDto],
  })
  async findAll(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Query() filters: AuditLogFiltersDto,
  ) {
    // Superadmin pode ver logs de todos os tenants
    const effectiveTenantId = user.role === 'superadmin' ? undefined : tenantId;
    return this.auditService.findAll(effectiveTenantId, filters);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'superadmin')
  @ApiOperation({ summary: 'Buscar log de auditoria por ID' })
  @ApiResponse({
    status: 200,
    description: 'Log de auditoria encontrado',
    type: AuditLogResponseDto,
  })
  async findOne(
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    // Superadmin pode ver qualquer log
    const effectiveTenantId = user.role === 'superadmin' ? undefined : tenantId;
    return this.auditService.findOne(effectiveTenantId, id);
  }
}
