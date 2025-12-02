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
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Audit')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Listar logs de auditoria' })
  @ApiResponse({
    status: 200,
    description: 'Lista de logs de auditoria',
    type: [AuditLogResponseDto],
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: AuditLogFiltersDto,
  ) {
    return this.auditService.findAll(tenantId, filters);
  }

  @Get(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Buscar log de auditoria por ID' })
  @ApiResponse({
    status: 200,
    description: 'Log de auditoria encontrado',
    type: AuditLogResponseDto,
  })
  async findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.auditService.findOne(tenantId, id);
  }
}
