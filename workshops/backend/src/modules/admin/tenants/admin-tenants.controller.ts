import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminTenantsService } from './admin-tenants.service';
import { UpdateTenantPlanDto } from './dto/update-tenant-plan.dto';

@ApiTags('Admin - Tenants')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/tenants')
export class AdminTenantsController {
  constructor(private readonly adminTenantsService: AdminTenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar oficinas (tenants)' })
  findAll(
    @Query('status') status?: string,
    @Query('planId') planId?: string,
    @Query('search') search?: string,
  ) {
    return this.adminTenantsService.findAll({
      status: status || undefined,
      planId: planId || undefined,
      search: search || undefined,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas gerais de oficinas' })
  getStats() {
    return this.adminTenantsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes completos de uma oficina' })
  findOne(@Param('id') id: string) {
    return this.adminTenantsService.findOne(id);
  }

  @Get(':id/users')
  @ApiOperation({ summary: 'Listar usuários de uma oficina' })
  getTenantUsers(@Param('id') tenantId: string) {
    return this.adminTenantsService.getTenantUsers(tenantId);
  }

  @Post(':id/users/:userId/reset-password')
  @ApiOperation({ summary: 'Resetar senha de um usuário da oficina' })
  resetUserPassword(
    @Param('id') tenantId: string,
    @Param('userId') userId: string,
  ) {
    return this.adminTenantsService.resetUserPassword(tenantId, userId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Ativar uma oficina' })
  activate(@Param('id') id: string) {
    return this.adminTenantsService.activate(id);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspender uma oficina' })
  suspend(@Param('id') id: string) {
    return this.adminTenantsService.suspend(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar uma oficina' })
  cancel(@Param('id') id: string) {
    return this.adminTenantsService.cancel(id);
  }

  @Patch(':id/plan')
  @ApiOperation({ summary: 'Atualizar plano da oficina' })
  updatePlan(@Param('id') id: string, @Body() updateDto: UpdateTenantPlanDto) {
    return this.adminTenantsService.updatePlan(id, updateDto.planId);
  }
}
