import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ChecklistsService } from './checklists.service';
import {
  CreateChecklistDto,
  UpdateChecklistDto,
  ChecklistResponseDto,
  ChecklistFiltersDto,
  CompleteChecklistDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';
import { CurrentUser } from '@core/auth/decorators/current-user.decorator';

@ApiTags('Checklists')
@ApiBearerAuth()
@Controller('checklists')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChecklistsController {
  private readonly logger = new Logger(ChecklistsController.name);

  constructor(private readonly checklistsService: ChecklistsService) {}

  @Post()
  @Roles('admin', 'manager', 'receptionist', 'mechanic')
  @ApiOperation({ summary: 'Criar um novo checklist' })
  @ApiResponse({
    status: 201,
    description: 'Checklist criado com sucesso',
    type: ChecklistResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(
    @TenantId() tenantId: string,
    @Body() createChecklistDto: CreateChecklistDto,
  ): Promise<ChecklistResponseDto> {
    return this.checklistsService.create(tenantId, createChecklistDto);
  }

  @Get()
  @Roles('admin', 'manager', 'receptionist', 'mechanic')
  @ApiOperation({ summary: 'Listar checklists com filtros' })
  @ApiQuery({ type: ChecklistFiltersDto })
  @ApiResponse({
    status: 200,
    description: 'Lista de checklists',
    type: [ChecklistResponseDto],
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: ChecklistFiltersDto,
  ): Promise<{
    data: ChecklistResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.checklistsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'receptionist', 'mechanic')
  @ApiOperation({ summary: 'Buscar um checklist por ID' })
  @ApiResponse({
    status: 200,
    description: 'Checklist encontrado',
    type: ChecklistResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Checklist não encontrado' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<ChecklistResponseDto> {
    return this.checklistsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'receptionist', 'mechanic')
  @ApiOperation({ summary: 'Atualizar um checklist' })
  @ApiResponse({
    status: 200,
    description: 'Checklist atualizado com sucesso',
    type: ChecklistResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Checklist não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Não é possível atualizar checklist completo',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateChecklistDto: UpdateChecklistDto,
  ): Promise<ChecklistResponseDto> {
    return this.checklistsService.update(tenantId, id, updateChecklistDto);
  }

  @Post(':id/complete')
  @Roles('admin', 'manager', 'receptionist', 'mechanic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Completar um checklist (marcar itens como completos)',
  })
  @ApiResponse({
    status: 200,
    description: 'Checklist atualizado com sucesso',
    type: ChecklistResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Checklist não encontrado' })
  @ApiResponse({
    status: 400,
    description: 'Checklist já está completo',
  })
  async complete(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() completeChecklistDto: CompleteChecklistDto,
    @CurrentUser('id') userId: string,
  ): Promise<ChecklistResponseDto> {
    // Log para debug
    this.logger.log(
      `Recebendo requisição para completar checklist: ${id} (tenant: ${tenantId}, user: ${userId}, items: ${completeChecklistDto.items?.length || 0})`,
    );

    try {
      const result = await this.checklistsService.complete(
        tenantId,
        id,
        completeChecklistDto,
        userId,
      );

      this.logger.log(`Checklist completado com sucesso: ${result.id}`);
      return result;
    } catch (error: unknown) {
      this.logger.error('Erro ao completar checklist:', error);
      throw error;
    }
  }

  @Get(':id/validate')
  @Roles('admin', 'manager', 'receptionist', 'mechanic')
  @ApiOperation({
    summary:
      'Validar se um checklist está completo (todos os itens obrigatórios)',
  })
  @ApiResponse({
    status: 200,
    description: 'Validação realizada',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Checklist não encontrado' })
  async validate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<{ isValid: boolean }> {
    const isValid = await this.checklistsService.validate(tenantId, id);
    return { isValid };
  }

  @Delete(':id')
  @Roles('admin', 'manager', 'receptionist')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover um checklist' })
  @ApiResponse({
    status: 204,
    description: 'Checklist removido com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Checklist não encontrado' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.checklistsService.remove(tenantId, id);
  }
}
