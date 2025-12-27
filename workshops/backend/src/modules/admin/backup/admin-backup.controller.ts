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
import { AdminGuard } from '../auth/guards/admin.guard';
import { BackupService } from '../../shared/backup/backup.service';
import {
    BackupConfigDto,
    BackupResponseDto,
    BackupFiltersDto,
    RestoreRequestDto,
} from '../../shared/backup/dto';

@ApiTags('Admin - Backups')
@Controller('admin/backup')
@UseGuards(AdminGuard)
@ApiBearerAuth()
export class AdminBackupController {
    constructor(private readonly backupService: BackupService) { }

    @Post()
    @ApiOperation({ summary: 'Criar backup manual (Global)' })
    @ApiResponse({ status: 201, type: BackupResponseDto })
    async createBackup(
        @Body() config: BackupConfigDto,
    ): Promise<BackupResponseDto> {
        return this.backupService.createBackup(config);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os backups' })
    @ApiResponse({ status: 200, type: [BackupResponseDto] })
    async listBackups(
        @Query() filters: BackupFiltersDto,
    ) {
        return this.backupService.listBackups(filters);
    }

    @Get('status')
    @ApiOperation({ summary: 'Status geral dos backups' })
    async getStatus() {
        return this.backupService.getBackupStatus();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obter backup por ID' })
    @ApiResponse({ status: 200, type: BackupResponseDto })
    async getBackup(
        @Param('id') id: string,
    ): Promise<BackupResponseDto> {
        return this.backupService.getBackup(id);
    }

    @Post(':id/restore')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Restaurar backup' })
    async restoreBackup(
        @Param('id') id: string,
        @Body() request: RestoreRequestDto,
    ) {
        return this.backupService.restoreBackup(
            { ...request, backupId: id }
        );
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Deletar backup' })
    async deleteBackup(
        @Param('id') id: string,
    ): Promise<void> {
        return this.backupService.deleteBackup(id);
    }
}
