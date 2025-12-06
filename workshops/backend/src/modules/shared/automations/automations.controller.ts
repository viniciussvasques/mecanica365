import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { AutomationsService } from './automations.service';
import {
  CreateAutomationDto,
  UpdateAutomationDto,
  AutomationResponseDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Automações')
@ApiBearerAuth()
@Controller('automations')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('admin', 'superadmin')
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova automação (configuração via admin)' })
  @ApiResponse({
    status: 201,
    description: 'Automação criada com sucesso',
    type: AutomationResponseDto,
  })
  create(
    @TenantId() tenantId: string,
    @Body() createAutomationDto: CreateAutomationDto,
  ): Promise<AutomationResponseDto> {
    return this.automationsService.create(tenantId, createAutomationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar automações configuradas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de automações',
    type: [AutomationResponseDto],
  })
  findAll(@TenantId() tenantId: string): Promise<AutomationResponseDto[]> {
    return this.automationsService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar automação por ID' })
  @ApiResponse({
    status: 200,
    description: 'Automação encontrada',
    type: AutomationResponseDto,
  })
  findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<AutomationResponseDto> {
    return this.automationsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar automação' })
  @ApiResponse({
    status: 200,
    description: 'Automação atualizada com sucesso',
    type: AutomationResponseDto,
  })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateAutomationDto: UpdateAutomationDto,
  ): Promise<AutomationResponseDto> {
    return this.automationsService.update(tenantId, id, updateAutomationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover automação' })
  @ApiResponse({ status: 204, description: 'Automação removida com sucesso' })
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.automationsService.remove(tenantId, id);
  }

  @Post(':id/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar automação manualmente (para testes)' })
  @ApiResponse({
    status: 200,
    description: 'Resultado da execução',
  })
  execute(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: Record<string, unknown>,
  ) {
    return this.automationsService.execute(tenantId, id, data);
  }
}
