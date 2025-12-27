import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminIntegrationsService } from './admin-integrations.service';

@ApiTags('Admin - Integrations')
@ApiBearerAuth()
@Controller('admin/integrations')
@UseGuards(AdminGuard)
export class AdminIntegrationsController {
    constructor(private readonly integrationsService: AdminIntegrationsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar integrações globais' })
    findAll() {
        return this.integrationsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar integração global' })
    findOne(@Param('id') id: string) {
        return this.integrationsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Criar integração global' })
    create(@Body() createDto: any) {
        return this.integrationsService.create(createDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Atualizar integração global' })
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.integrationsService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Deletar integração global' })
    remove(@Param('id') id: string) {
        return this.integrationsService.remove(id);
    }

    @Post(':id/test')
    @ApiOperation({ summary: 'Testar integração global' })
    test(@Param('id') id: string) {
        return this.integrationsService.test(id);
    }
}
