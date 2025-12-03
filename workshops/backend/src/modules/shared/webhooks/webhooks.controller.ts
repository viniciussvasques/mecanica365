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
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto, UpdateWebhookDto, WebhookResponseDto } from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@common/guards/tenant.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Webhooks')
@ApiBearerAuth()
@Controller('webhooks')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
@Roles('admin', 'manager')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo webhook' })
  @ApiResponse({
    status: 201,
    description: 'Webhook criado com sucesso',
    type: WebhookResponseDto,
  })
  create(
    @TenantId() tenantId: string,
    @Body() createWebhookDto: CreateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.create(tenantId, createWebhookDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar webhooks' })
  @ApiResponse({
    status: 200,
    description: 'Lista de webhooks',
    type: [WebhookResponseDto],
  })
  findAll(@TenantId() tenantId: string): Promise<WebhookResponseDto[]> {
    return this.webhooksService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar webhook por ID' })
  @ApiResponse({
    status: 200,
    description: 'Webhook encontrado',
    type: WebhookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Webhook não encontrado' })
  findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar webhook' })
  @ApiResponse({
    status: 200,
    description: 'Webhook atualizado com sucesso',
    type: WebhookResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Webhook não encontrado' })
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateWebhookDto: UpdateWebhookDto,
  ): Promise<WebhookResponseDto> {
    return this.webhooksService.update(tenantId, id, updateWebhookDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover webhook' })
  @ApiResponse({ status: 204, description: 'Webhook removido com sucesso' })
  @ApiResponse({ status: 404, description: 'Webhook não encontrado' })
  remove(@TenantId() tenantId: string, @Param('id') id: string): Promise<void> {
    return this.webhooksService.remove(tenantId, id);
  }
}
