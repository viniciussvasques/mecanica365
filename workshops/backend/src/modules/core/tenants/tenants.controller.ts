import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto, TenantResponseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantGuard } from '../../../common/guards/tenant.guard';
import { TenantId } from '../../../common/decorators/tenant.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar um novo tenant (provisionamento)' })
  @ApiResponse({
    status: 201,
    description: 'Tenant criado com sucesso',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos (CNPJ, subdomain)',
  })
  @ApiResponse({ status: 409, description: 'CNPJ ou subdomain já cadastrado' })
  async create(
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os tenants (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tenants',
    type: [TenantResponseDto],
  })
  async findAll(): Promise<TenantResponseDto[]> {
    return this.tenantsService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, TenantGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter informações do tenant atual' })
  @ApiResponse({
    status: 200,
    description: 'Tenant atual',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async getCurrentTenant(
    @TenantId() tenantId: string | undefined,
  ): Promise<TenantResponseDto> {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }
    return this.tenantsService.findOne(tenantId);
  }

  @Get('subdomain/:subdomain')
  @Public()
  @ApiOperation({ summary: 'Buscar tenant por subdomain' })
  @ApiResponse({
    status: 200,
    description: 'Tenant encontrado',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async findBySubdomain(
    @Param('subdomain') subdomain: string,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.findBySubdomain(subdomain);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Buscar tenant por ID (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Tenant encontrado',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async findOne(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar tenant (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Tenant atualizado com sucesso',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Post(':id/activate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ativar tenant (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Tenant ativado com sucesso',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async activate(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.tenantsService.activate(id);
  }

  @Post(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspender tenant (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Tenant suspenso com sucesso',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async suspend(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.tenantsService.suspend(id);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar tenant (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Tenant cancelado com sucesso',
    type: TenantResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  async cancel(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.tenantsService.cancel(id);
  }
}
