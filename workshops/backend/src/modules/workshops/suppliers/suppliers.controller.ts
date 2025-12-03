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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import {
  CreateSupplierDto,
  UpdateSupplierDto,
  SupplierResponseDto,
  SupplierFiltersDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Fornecedores')
@ApiBearerAuth()
@Controller('suppliers')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('admin', 'manager')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo fornecedor' })
  @ApiResponse({
    status: 201,
    description: 'Fornecedor criado com sucesso',
    type: SupplierResponseDto,
  })
  create(
    @TenantId() tenantId: string,
    @Body() createSupplierDto: CreateSupplierDto,
  ): Promise<SupplierResponseDto> {
    return this.suppliersService.create(tenantId, createSupplierDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar fornecedores' })
  @ApiResponse({
    status: 200,
    description: 'Lista de fornecedores',
    type: [SupplierResponseDto],
  })
  findAll(
    @TenantId() tenantId: string,
    @Query() filters: SupplierFiltersDto,
  ) {
    return this.suppliersService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar fornecedor por ID' })
  @ApiResponse({
    status: 200,
    description: 'Fornecedor encontrado',
    type: SupplierResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<SupplierResponseDto> {
    return this.suppliersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar fornecedor' })
  @ApiResponse({
    status: 200,
    description: 'Fornecedor atualizado com sucesso',
    type: SupplierResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ): Promise<SupplierResponseDto> {
    return this.suppliersService.update(tenantId, id, updateSupplierDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover fornecedor' })
  @ApiResponse({ status: 204, description: 'Fornecedor removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Fornecedor não encontrado' })
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.suppliersService.remove(tenantId, id);
  }
}

