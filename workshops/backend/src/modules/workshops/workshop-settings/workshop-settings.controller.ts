import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'node:path';
import { WorkshopSettingsService } from './workshop-settings.service';
import {
  CreateWorkshopSettingsDto,
  UpdateWorkshopSettingsDto,
  WorkshopSettingsResponseDto,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Workshop Settings')
@Controller('workshop-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkshopSettingsController {
  constructor(
    private readonly workshopSettingsService: WorkshopSettingsService,
  ) {}

  @Get()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Buscar configurações da oficina' })
  @ApiResponse({
    status: 200,
    description: 'Configurações encontradas',
    type: WorkshopSettingsResponseDto,
  })
  async findOne(
    @TenantId() tenantId: string,
  ): Promise<WorkshopSettingsResponseDto> {
    return this.workshopSettingsService.findOne(tenantId);
  }

  @Post()
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar ou atualizar configurações da oficina' })
  @ApiResponse({
    status: 201,
    description: 'Configurações criadas/atualizadas com sucesso',
    type: WorkshopSettingsResponseDto,
  })
  async upsert(
    @TenantId() tenantId: string,
    @Body() createDto: CreateWorkshopSettingsDto,
  ): Promise<WorkshopSettingsResponseDto> {
    return this.workshopSettingsService.upsert(tenantId, createDto);
  }

  @Patch()
  @Roles('admin', 'manager')
  @ApiOperation({ summary: 'Atualizar configurações da oficina' })
  @ApiResponse({
    status: 200,
    description: 'Configurações atualizadas com sucesso',
    type: WorkshopSettingsResponseDto,
  })
  async update(
    @TenantId() tenantId: string,
    @Body() updateDto: UpdateWorkshopSettingsDto,
  ): Promise<WorkshopSettingsResponseDto> {
    return this.workshopSettingsService.update(tenantId, updateDto);
  }

  @Post('upload-logo')
  @Roles('admin', 'manager')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (req, file, cb) => {
          // tenantId será injetado via decorator, usar timestamp único
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `logo-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg)$/)) {
          return cb(
            new BadRequestException('Apenas imagens são permitidas'),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de logo da oficina' })
  @ApiResponse({
    status: 201,
    description: 'Logo enviado com sucesso',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: '/uploads/logos/tenant-1234567890-123456789.png',
        },
      },
    },
  })
  async uploadLogo(
    @UploadedFile() file: { filename: string; path: string; mimetype: string },
    @TenantId() tenantId: string,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    // URL relativa que será servida estaticamente
    const url = `/uploads/logos/${file.filename}`;

    // Atualizar logoUrl nas configurações
    await this.workshopSettingsService.update(tenantId, {
      logoUrl: url,
    });

    return { url };
  }
}
