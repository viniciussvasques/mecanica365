import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SystemEmailService } from './system-email.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Admin - System Email')
@Controller('admin/system-email')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class SystemEmailController {
  constructor(private readonly systemEmailService: SystemEmailService) {}

  @Post()
  @ApiOperation({ summary: 'Criar configuração de email global' })
  create(@Body() createDto: any) {
    return this.systemEmailService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as configurações de email' })
  findAll() {
    return this.systemEmailService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter configuração de email por ID' })
  findOne(@Param('id') id: string) {
    return this.systemEmailService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar configuração de email' })
  update(@Param('id') id: string, @Body() updateDto: any) {
    return this.systemEmailService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover configuração de email' })
  remove(@Param('id') id: string) {
    return this.systemEmailService.remove(id);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Definir configuração como padrão' })
  setDefault(@Param('id') id: string) {
    return this.systemEmailService.setDefault(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Testar configuração de email' })
  async testEmail(@Param('id') id: string, @Body() body: { testEmail: string }) {
    return this.systemEmailService.testEmail(id, body.testEmail);
  }
}
