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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PartsService } from './parts.service';
import {
  CreatePartDto,
  UpdatePartDto,
  PartResponseDto,
  PartFiltersDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Parts')
@Controller('parts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PartsController {
  constructor(private readonly partsService: PartsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Criar uma nova peça' })
  @ApiResponse({
    status: 201,
    description: 'Peça criada com sucesso',
    type: PartResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou número de peça já existe',
  })
  async create(
    @TenantId() tenantId: string,
    @Body() createPartDto: CreatePartDto,
  ): Promise<PartResponseDto> {
    return this.partsService.create(tenantId, createPartDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Listar peças com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de peças',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PartResponseDto' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: PartFiltersDto,
  ): Promise<{
    data: PartResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.partsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager', 'mechanic', 'receptionist')
  @ApiOperation({ summary: 'Buscar peça por ID' })
  @ApiParam({ name: 'id', description: 'ID da peça', type: String })
  @ApiResponse({
    status: 200,
    description: 'Peça encontrada',
    type: PartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Peça não encontrada' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<PartResponseDto> {
    return this.partsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Atualizar peça' })
  @ApiParam({ name: 'id', description: 'ID da peça', type: String })
  @ApiResponse({
    status: 200,
    description: 'Peça atualizada com sucesso',
    type: PartResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Peça não encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Número de peça já existe',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updatePartDto: UpdatePartDto,
  ): Promise<PartResponseDto> {
    return this.partsService.update(tenantId, id, updatePartDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Remover peça' })
  @ApiParam({ name: 'id', description: 'ID da peça', type: String })
  @ApiResponse({
    status: 204,
    description: 'Peça removida com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Peça não encontrada' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.partsService.remove(tenantId, id);
  }
}
