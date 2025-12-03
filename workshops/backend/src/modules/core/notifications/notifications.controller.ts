import {
  Controller,
  Get,
  Post,
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
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../../../common/decorators/tenant.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar notificações do usuário' })
  @ApiQuery({
    name: 'unreadOnly',
    required: false,
    type: Boolean,
    description: 'Apenas notificações não lidas',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limite de resultados (padrão: 50)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificações',
  })
  async findAll(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
  ) {
    const unread = unreadOnly === 'true';
    const limitNum = limit ? Number.parseInt(limit, 10) : 50;
    return this.notificationsService.findByUser(
      tenantId,
      userId,
      limitNum,
      unread,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Obter contador de notificações não lidas' })
  @ApiResponse({
    status: 200,
    description: 'Contador de notificações não lidas',
    schema: {
      type: 'object',
      properties: {
        unreadCount: { type: 'number' },
      },
    },
  })
  async getUnreadCount(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string | undefined,
  ) {
    try {
      if (!userId) {
        return { unreadCount: 0 };
      }
      const result = await this.notificationsService.findByUser(
        tenantId,
        userId,
        1,
        true,
      );
      return { unreadCount: result?.unreadCount || 0 };
    } catch (error) {
      // Se houver erro, retornar 0 para não quebrar o frontend
      console.error('Erro ao buscar contador de notificações:', error);
      return { unreadCount: 0 };
    }
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar notificação como lida' })
  @ApiParam({ name: 'id', description: 'ID da notificação' })
  @ApiResponse({
    status: 204,
    description: 'Notificação marcada como lida',
  })
  @ApiResponse({ status: 404, description: 'Notificação não encontrada' })
  async markAsRead(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    await this.notificationsService.markAsRead(tenantId, userId, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Marcar todas as notificações como lidas' })
  @ApiResponse({
    status: 204,
    description: 'Todas as notificações marcadas como lidas',
  })
  async markAllAsRead(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
  ): Promise<void> {
    await this.notificationsService.markAllAsRead(tenantId, userId);
  }
}
