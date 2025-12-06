import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PlansService } from './plans.service';
import { CreatePlanDto, UpdatePlanDto, PlanResponseDto } from './dto';
import { JwtAuthGuard } from '@modules/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/core/auth/guards/roles.guard';
import { Roles } from '@modules/core/auth/decorators/roles.decorator';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo plano (superadmin only)' })
  @ApiResponse({ status: 201, description: 'Plano criado com sucesso', type: PlanResponseDto })
  @ApiResponse({ status: 409, description: 'Plano com código já existe' })
  async create(@Body() createPlanDto: CreatePlanDto): Promise<PlanResponseDto> {
    return this.plansService.create(createPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os planos' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de planos', type: [PlanResponseDto] })
  async findAll(
    @Query('includeInactive', new DefaultValuePipe(false), ParseBoolPipe)
    includeInactive: boolean,
  ): Promise<PlanResponseDto[]> {
    return this.plansService.findAll(includeInactive);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estatísticas de planos (superadmin only)' })
  @ApiResponse({ status: 200, description: 'Estatísticas de planos' })
  async getStats() {
    return this.plansService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar plano por ID' })
  @ApiResponse({ status: 200, description: 'Plano encontrado', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  async findOne(@Param('id') id: string): Promise<PlanResponseDto> {
    return this.plansService.findOne(id);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Buscar plano por código' })
  @ApiResponse({ status: 200, description: 'Plano encontrado', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  async findByCode(@Param('code') code: string): Promise<PlanResponseDto> {
    return this.plansService.findByCode(code);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar plano (superadmin only)' })
  @ApiResponse({ status: 200, description: 'Plano atualizado', type: PlanResponseDto })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updatePlanDto: UpdatePlanDto,
  ): Promise<PlanResponseDto> {
    return this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Excluir plano (superadmin only)' })
  @ApiResponse({ status: 200, description: 'Plano excluído' })
  @ApiResponse({ status: 404, description: 'Plano não encontrado' })
  @ApiResponse({ status: 400, description: 'Plano possui assinaturas ativas' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.plansService.remove(id);
  }
}

