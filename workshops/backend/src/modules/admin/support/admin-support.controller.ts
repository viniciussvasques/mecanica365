import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminSupportService } from './admin-support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { UpdateSupportTicketDto } from './dto/update-support-ticket.dto';
import { AddReplyDto } from './dto/add-reply.dto';

@ApiTags('Admin - Support')
@ApiBearerAuth()
@Controller('admin/support')
@UseGuards(AdminGuard)
export class AdminSupportController {
  constructor(private readonly supportService: AdminSupportService) {}

  @Get('tickets')
  @ApiOperation({ summary: 'Listar todos os tickets' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'category', required: false })
  findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('category') category?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.supportService.findAll({
      page: Number(page),
      limit: Number(limit),
      status,
      priority,
      category,
      tenantId,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estatísticas de suporte' })
  getStats() {
    return this.supportService.getStats();
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Buscar ticket específico' })
  findOne(@Param('id') id: string) {
    return this.supportService.findOne(id);
  }

  @Post('tickets')
  @ApiOperation({ summary: 'Criar novo ticket' })
  create(@Body() createDto: CreateSupportTicketDto) {
    return this.supportService.create(createDto);
  }

  @Patch('tickets/:id')
  @ApiOperation({ summary: 'Atualizar ticket' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSupportTicketDto) {
    return this.supportService.update(id, updateDto);
  }

  @Delete('tickets/:id')
  @ApiOperation({ summary: 'Deletar ticket' })
  remove(@Param('id') id: string) {
    return this.supportService.remove(id);
  }

  @Post('tickets/:id/replies')
  @ApiOperation({ summary: 'Adicionar resposta ao ticket' })
  addReply(@Param('id') id: string, @Body() replyDto: AddReplyDto) {
    return this.supportService.addReply(id, replyDto);
  }
}
