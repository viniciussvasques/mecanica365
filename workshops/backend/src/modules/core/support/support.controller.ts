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
  ApiQuery,
} from '@nestjs/swagger';
import { SupportService } from './support.service';
import {
  CreateSupportTicketDto,
  SupportPriority,
  SupportCategory,
} from './dto/create-support-ticket.dto';
import {
  SupportStatus,
  SupportTicketResponseDto,
} from './dto/support-ticket-response.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { CreateSupportReplyDto } from './dto/create-support-reply.dto';
import { SupportTicketFiltersDto } from './dto/support-ticket-filters.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../../../common/decorators/tenant.decorator';
import { CurrentUser } from '../../../common/decorators/user.decorator';

@ApiTags('Suporte')
@ApiBearerAuth()
@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  /**
   * Cria um novo ticket de suporte (público - usuários podem criar)
   */
  @Post('tickets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar novo ticket de suporte' })
  @ApiResponse({
    status: 201,
    description: 'Ticket criado com sucesso',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  create(
    @Body() createSupportTicketDto: CreateSupportTicketDto,
    @CurrentUser('id') userId?: string,
    @TenantId() tenantId?: string,
  ): Promise<SupportTicketResponseDto> {
    return this.supportService.create(createSupportTicketDto, userId, tenantId);
  }

  /**
   * Lista tickets de suporte (admin vê todos, usuário vê apenas os seus)
   */
  @Get('tickets')
  @Roles('admin', 'manager', 'superadmin')
  @ApiOperation({ summary: 'Listar tickets de suporte' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tickets',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SupportStatus })
  @ApiQuery({ name: 'priority', required: false, enum: SupportPriority })
  @ApiQuery({ name: 'category', required: false, enum: SupportCategory })
  @ApiQuery({ name: 'assignedToId', required: false, type: String })
  @ApiQuery({ name: 'tenantId', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query() filters: SupportTicketFiltersDto,
    @CurrentUser('id') userId?: string,
    @TenantId() tenantId?: string,
  ): Promise<{
    data: SupportTicketResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.supportService.findAll(filters, userId, tenantId);
  }

  /**
   * Busca ticket específico
   */
  @Get('tickets/:id')
  @ApiOperation({ summary: 'Buscar ticket por ID' })
  @ApiResponse({
    status: 200,
    description: 'Ticket encontrado',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket não encontrado' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
    @TenantId() tenantId?: string,
  ): Promise<SupportTicketResponseDto & { replies?: unknown[] }> {
    return this.supportService.findOne(id, userId, tenantId);
  }

  /**
   * Atualiza ticket
   */
  @Patch('tickets/:id')
  @Roles('admin', 'manager', 'superadmin')
  @ApiOperation({ summary: 'Atualizar ticket' })
  @ApiResponse({
    status: 200,
    description: 'Ticket atualizado com sucesso',
    type: SupportTicketResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket não encontrado' })
  update(
    @Param('id') id: string,
    @Body() updateSupportTicketDto: UpdateSupportTicketDto,
    @CurrentUser('id') userId?: string,
  ): Promise<SupportTicketResponseDto> {
    return this.supportService.update(id, updateSupportTicketDto, userId);
  }

  /**
   * Remove ticket
   */
  @Delete('tickets/:id')
  @Roles('admin', 'manager', 'superadmin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover ticket' })
  @ApiResponse({ status: 204, description: 'Ticket removido com sucesso' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId?: string,
  ): Promise<void> {
    return this.supportService.remove(id, userId);
  }

  /**
   * Adiciona resposta ao ticket
   */
  @Post('tickets/:id/replies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adicionar resposta ao ticket' })
  @ApiResponse({
    status: 201,
    description: 'Resposta adicionada com sucesso',
  })
  addReply(
    @Param('id') ticketId: string,
    @Body() createSupportReplyDto: CreateSupportReplyDto,
    @CurrentUser('id') userId: string,
  ): Promise<unknown> {
    return this.supportService.addReply(
      ticketId,
      createSupportReplyDto,
      userId,
    );
  }

  /**
   * Estatísticas de suporte
   */
  @Get('stats')
  @Roles('admin', 'manager', 'superadmin')
  @ApiOperation({ summary: 'Estatísticas de suporte' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas de tickets',
  })
  getStats(@TenantId() tenantId?: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    avgResponseTime: number;
  }> {
    return this.supportService.getStats(tenantId);
  }
}
