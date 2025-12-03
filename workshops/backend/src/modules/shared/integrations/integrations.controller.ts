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
import { IntegrationsService } from './integrations.service';
import {
  CreateIntegrationDto,
  UpdateIntegrationDto,
  IntegrationResponseDto,
  TestIntegrationDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Integrações')
@ApiBearerAuth()
@Controller('integrations')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('admin')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar nova integração (configuração via admin)' })
  @ApiResponse({
    status: 201,
    description: 'Integração criada com sucesso',
    type: IntegrationResponseDto,
  })
  create(
    @TenantId() tenantId: string,
    @Body() createIntegrationDto: CreateIntegrationDto,
  ): Promise<IntegrationResponseDto> {
    return this.integrationsService.create(tenantId, createIntegrationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar integrações configuradas' })
  @ApiResponse({
    status: 200,
    description: 'Lista de integrações',
    type: [IntegrationResponseDto],
  })
  findAll(@TenantId() tenantId: string): Promise<IntegrationResponseDto[]> {
    return this.integrationsService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar integração por ID' })
  @ApiResponse({
    status: 200,
    description: 'Integração encontrada',
    type: IntegrationResponseDto,
  })
  findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<IntegrationResponseDto> {
    return this.integrationsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar integração' })
  @ApiResponse({
    status: 200,
    description: 'Integração atualizada com sucesso',
    type: IntegrationResponseDto,
  })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateIntegrationDto: UpdateIntegrationDto,
  ): Promise<IntegrationResponseDto> {
    return this.integrationsService.update(tenantId, id, updateIntegrationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover integração' })
  @ApiResponse({ status: 204, description: 'Integração removida com sucesso' })
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.integrationsService.remove(tenantId, id);
  }

  @Post(':id/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Testar integração' })
  @ApiResponse({
    status: 200,
    description: 'Resultado do teste',
  })
  test(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() testData: TestIntegrationDto,
  ) {
    return this.integrationsService.test(tenantId, id, testData);
  }
}
