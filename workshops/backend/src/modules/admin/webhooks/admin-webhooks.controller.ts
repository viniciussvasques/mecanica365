import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminWebhooksService } from './admin-webhooks.service';

@ApiTags('Admin - Webhooks')
@ApiBearerAuth()
@Controller('admin/webhooks')
@UseGuards(AdminGuard)
export class AdminWebhooksController {
  constructor(private readonly webhooksService: AdminWebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'Listar webhooks' })
  findAll() {
    return this.webhooksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar webhook' })
  findOne(@Param('id') id: string) {
    return this.webhooksService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar webhook' })
  create(@Body() createDto: any) {
    return this.webhooksService.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar webhook' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.webhooksService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar webhook' })
  remove(@Param('id') id: string) {
    return this.webhooksService.remove(id);
  }
}
