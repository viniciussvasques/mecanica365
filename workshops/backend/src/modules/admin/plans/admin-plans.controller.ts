import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminPlansService } from './admin-plans.service';
import { CreateAdminPlanDto } from './dto/create-admin-plan.dto';
import { UpdateAdminPlanDto } from './dto/update-admin-plan.dto';

@ApiTags('Admin - Plans')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/plans')
export class AdminPlansController {
  constructor(private readonly adminPlansService: AdminPlansService) {}

  @Get()
  @ApiOperation({ summary: 'Listar planos de assinatura' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    const include = includeInactive === 'true';
    return this.adminPlansService.findAll(include);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas dos planos' })
  getStats() {
    return this.adminPlansService.getStats();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Buscar plano pelo código' })
  findByCode(@Param('code') code: string) {
    return this.adminPlansService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar plano pelo ID' })
  findOne(@Param('id') id: string) {
    return this.adminPlansService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar novo plano' })
  create(@Body() createDto: CreateAdminPlanDto) {
    return this.adminPlansService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar plano existente' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAdminPlanDto) {
    return this.adminPlansService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover plano' })
  remove(@Param('id') id: string) {
    return this.adminPlansService.remove(id);
  }
}
