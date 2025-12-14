import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { CurrentUser } from '@core/auth/decorators/current-user.decorator';
import { BackupService } from './backup.service';
import {
  BackupConfigDto,
  BackupResponseDto,
  BackupFiltersDto,
  RestoreRequestDto,
} from './dto';

@ApiTags('Backups')
@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Criar backup manual' })
  @ApiResponse({ status: 201, type: BackupResponseDto })
  async createBackup(
    @Body() config: BackupConfigDto,
    @CurrentUser() user: { id: string; tenantId?: string },
  ): Promise<BackupResponseDto> {
    return this.backupService.createBackup(config, user.tenantId);
  }

  @Get()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Listar backups' })
  @ApiResponse({ status: 200, type: [BackupResponseDto] })
  async listBackups(
    @Query() filters: BackupFiltersDto,
    @CurrentUser() user: { id: string; tenantId?: string },
  ) {
    return this.backupService.listBackups(filters, user.tenantId);
  }

  @Get('status')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Status dos backups' })
  async getStatus() {
    return this.backupService.getBackupStatus();
  }

  @Get(':id')
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Obter backup por ID' })
  @ApiResponse({ status: 200, type: BackupResponseDto })
  async getBackup(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; tenantId?: string },
  ): Promise<BackupResponseDto> {
    return this.backupService.getBackup(id, user.tenantId);
  }

  @Post(':id/restore')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restaurar backup' })
  async restoreBackup(
    @Param('id') id: string,
    @Body() request: RestoreRequestDto,
    @CurrentUser() user: { id: string; tenantId?: string },
  ) {
    return this.backupService.restoreBackup(
      { ...request, backupId: id },
      user.tenantId,
    );
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar backup' })
  async deleteBackup(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; tenantId?: string },
  ): Promise<void> {
    return this.backupService.deleteBackup(id, user.tenantId);
  }
}
