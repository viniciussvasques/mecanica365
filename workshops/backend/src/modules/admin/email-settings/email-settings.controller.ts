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
import { EmailSettingsService } from './email-settings.service';
import { CreateEmailSettingsDto } from './dto/create-email-settings.dto';
import { UpdateEmailSettingsDto } from './dto/update-email-settings.dto';
import { TestEmailDto } from './dto/test-email.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Admin - Tenant Email Settings')
@ApiBearerAuth()
@Controller('admin/tenants/:tenantId/email-settings')
@UseGuards(AdminGuard)
export class EmailSettingsController {
  constructor(private readonly emailSettingsService: EmailSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar configurações de email do tenant' })
  findAll(@Param('tenantId') tenantId: string) {
    return this.emailSettingsService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar uma configuração específica' })
  findOne(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.emailSettingsService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova configuração de email' })
  create(
    @Param('tenantId') tenantId: string,
    @Body() createDto: CreateEmailSettingsDto,
  ) {
    return this.emailSettingsService.create(tenantId, createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar configuração de email' })
  update(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: UpdateEmailSettingsDto,
  ) {
    return this.emailSettingsService.update(id, tenantId, updateDto);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Definir como configuração padrão' })
  setDefault(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.emailSettingsService.setDefault(id, tenantId);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Testar configuração de email' })
  testConnection(
    @Param('tenantId') tenantId: string,
    @Param('id') id: string,
    @Body() testDto: TestEmailDto,
  ) {
    return this.emailSettingsService.testConnection(
      id,
      tenantId,
      testDto.testEmail,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover configuração de email' })
  remove(@Param('tenantId') tenantId: string, @Param('id') id: string) {
    return this.emailSettingsService.remove(id, tenantId);
  }
}
