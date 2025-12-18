import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminCommunicationsService } from './admin-communications.service';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';

@ApiTags('Admin - Communications')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('admin/communications')
export class AdminCommunicationsController {
  constructor(
    private readonly communicationsService: AdminCommunicationsService,
  ) {}

  @Post('bulk-email')
  @ApiOperation({ summary: 'Enviar e-mail em massa para tenants' })
  sendBulkEmail(@Body() dto: SendBulkEmailDto) {
    return this.communicationsService.sendBulkEmail(dto);
  }
}
