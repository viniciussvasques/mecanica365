import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { TenantId } from '@common/decorators/tenant.decorator';
import { UserId, CurrentUser } from '@common/decorators/user.decorator';
import { KnowledgeService } from './knowledge.service';
import {
  CreateKnowledgeDto,
  UpdateKnowledgeDto,
  KnowledgeResponseDto,
  KnowledgeSummaryDto,
  KnowledgeFiltersDto,
  RateKnowledgeDto,
} from './dto';

@ApiTags('Knowledge Base')
@ApiBearerAuth()
@Controller('knowledge')
@UseGuards(JwtAuthGuard, TenantGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  @ApiOperation({
    summary: 'Criar entrada na base de conhecimento',
    description:
      'Adiciona uma nova solução à base de conhecimento colaborativa',
  })
  @ApiResponse({
    status: 201,
    description: 'Entrada criada com sucesso',
    type: KnowledgeResponseDto,
  })
  async create(
    @TenantId() tenantId: string,
    @UserId() userId: string,
    @CurrentUser() user: { name?: string; email?: string },
    @Body() createKnowledgeDto: CreateKnowledgeDto,
  ): Promise<KnowledgeResponseDto> {
    const userName = user.name || user.email || 'Usuário';
    return this.knowledgeService.create(
      tenantId,
      userId,
      userName,
      createKnowledgeDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Listar entradas da base de conhecimento',
    description: 'Retorna lista de soluções com filtros opcionais',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de entradas',
    type: [KnowledgeSummaryDto],
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Buscar por texto',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filtrar por categoria',
  })
  @ApiQuery({
    name: 'vehicleMake',
    required: false,
    description: 'Filtrar por marca',
  })
  @ApiQuery({
    name: 'vehicleModel',
    required: false,
    description: 'Filtrar por modelo',
  })
  @ApiQuery({
    name: 'isVerified',
    required: false,
    description: 'Apenas verificadas',
  })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Ordenar por' })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Direção da ordenação',
  })
  async findMany(
    @TenantId() tenantId: string,
    @Query() filters: KnowledgeFiltersDto,
  ): Promise<KnowledgeSummaryDto[]> {
    return this.knowledgeService.findMany(tenantId, filters);
  }

  @Get('similar')
  @ApiOperation({
    summary: 'Buscar soluções similares',
    description: 'Encontra soluções similares baseadas em sintomas',
  })
  @ApiResponse({
    status: 200,
    description: 'Soluções similares encontradas',
    type: [KnowledgeSummaryDto],
  })
  @ApiQuery({
    name: 'symptoms',
    required: true,
    description: 'Sintomas separados por vírgula',
  })
  async findSimilar(
    @TenantId() tenantId: string,
    @Query('symptoms') symptomsQuery: string,
  ): Promise<KnowledgeSummaryDto[]> {
    const symptoms = symptomsQuery
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return this.knowledgeService.findSimilarSolutions(tenantId, symptoms);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Buscar entrada específica',
    description:
      'Retorna detalhes completos de uma entrada da base de conhecimento',
  })
  @ApiResponse({
    status: 200,
    description: 'Entrada encontrada',
    type: KnowledgeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Entrada não encontrada',
  })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<KnowledgeResponseDto> {
    return this.knowledgeService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar entrada',
    description: 'Atualiza uma entrada da base de conhecimento',
  })
  @ApiResponse({
    status: 200,
    description: 'Entrada atualizada',
    type: KnowledgeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Entrada não encontrada',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateKnowledgeDto: UpdateKnowledgeDto,
  ): Promise<KnowledgeResponseDto> {
    return this.knowledgeService.update(tenantId, id, updateKnowledgeDto);
  }

  @Post(':id/rate')
  @ApiOperation({
    summary: 'Avaliar solução',
    description: 'Avalia se uma solução funcionou ou não',
  })
  @ApiResponse({
    status: 200,
    description: 'Avaliação registrada',
    type: KnowledgeResponseDto,
  })
  async rate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() rateKnowledgeDto: RateKnowledgeDto,
  ): Promise<KnowledgeResponseDto> {
    return this.knowledgeService.rate(tenantId, id, rateKnowledgeDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Remover entrada',
    description: 'Remove uma entrada da base de conhecimento (soft delete)',
  })
  @ApiResponse({
    status: 200,
    description: 'Entrada removida',
  })
  @ApiResponse({
    status: 404,
    description: 'Entrada não encontrada',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.knowledgeService.remove(tenantId, id);
  }
}
