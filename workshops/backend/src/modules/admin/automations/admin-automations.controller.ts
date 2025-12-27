import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminAutomationsService } from './admin-automations.service';

@ApiTags('Admin - Automations')
@ApiBearerAuth()
@Controller('admin/automations')
@UseGuards(AdminGuard)
export class AdminAutomationsController {
    constructor(private readonly automationsService: AdminAutomationsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar automações globais' })
    findAll() {
        return this.automationsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Buscar automação global' })
    findOne(@Param('id') id: string) {
        return this.automationsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Criar automação global' })
    create(@Body() createDto: any) {
        return this.automationsService.create(createDto);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Atualizar automação global' })
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.automationsService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Deletar automação global' })
    remove(@Param('id') id: string) {
        return this.automationsService.remove(id);
    }

    @Post(':id/execute')
    @ApiOperation({ summary: 'Executar automação global' })
    execute(@Param('id') id: string) {
        return this.automationsService.execute(id);
    }
}
