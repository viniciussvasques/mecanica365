import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import type { File } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { AttachmentsService } from './attachments.service';
import {
  CreateAttachmentDto,
  UpdateAttachmentDto,
  AttachmentResponseDto,
  AttachmentFiltersDto,
  AttachmentType,
} from './dto';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { Roles } from '@core/auth/decorators/roles.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';

@ApiTags('Attachments')
@Controller('attachments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @Roles('admin', 'manager', 'receptionist', 'mechanic')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: undefined, // Usar memoryStorage (padrão) para ter acesso ao buffer
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload de anexo (foto ou documento)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo a ser enviado',
        },
        type: {
          type: 'string',
          enum: ['photo_before', 'photo_during', 'photo_after', 'document'],
          description: 'Tipo do anexo',
        },
        quoteId: {
          type: 'string',
          format: 'uuid',
          description: 'ID do orçamento (opcional)',
        },
        serviceOrderId: {
          type: 'string',
          format: 'uuid',
          description: 'ID da ordem de serviço (opcional)',
        },
        customerId: {
          type: 'string',
          format: 'uuid',
          description: 'ID do cliente (opcional)',
        },
        vehicleId: {
          type: 'string',
          format: 'uuid',
          description: 'ID do veículo (opcional)',
        },
        description: {
          type: 'string',
          description: 'Descrição do anexo (opcional)',
        },
      },
      required: ['file', 'type'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Anexo criado com sucesso',
    type: AttachmentResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async create(
    @TenantId() tenantId: string,
    @Req() req: Request,
    @UploadedFile() file: File,
  ): Promise<AttachmentResponseDto> {
    if (!file) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    // Extrair campos do form-data (multipart/form-data não parseia automaticamente para DTO)
    const createAttachmentDto: CreateAttachmentDto = {
      type: (req.body as { type?: string }).type as AttachmentType,
      quoteId: (req.body as { quoteId?: string }).quoteId || undefined,
      serviceOrderId:
        (req.body as { serviceOrderId?: string }).serviceOrderId || undefined,
      customerId: (req.body as { customerId?: string }).customerId || undefined,
      vehicleId: (req.body as { vehicleId?: string }).vehicleId || undefined,
      description:
        (req.body as { description?: string }).description || undefined,
    };

    return this.attachmentsService.create(tenantId, createAttachmentDto, file);
  }

  @Get()
  @Roles('admin', 'manager', 'receptionist', 'mechanic')
  @ApiOperation({ summary: 'Lista anexos com filtros e paginação' })
  @ApiResponse({
    status: 200,
    description: 'Lista de anexos',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/AttachmentResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: AttachmentFiltersDto,
  ): Promise<{
    data: AttachmentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.attachmentsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @Roles('admin', 'manager', 'receptionist', 'mechanic')
  @ApiOperation({ summary: 'Busca um anexo por ID' })
  @ApiResponse({
    status: 200,
    description: 'Anexo encontrado',
    type: AttachmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Anexo não encontrado' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<AttachmentResponseDto> {
    return this.attachmentsService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Roles('admin', 'manager', 'receptionist')
  @ApiOperation({ summary: 'Atualiza um anexo' })
  @ApiResponse({
    status: 200,
    description: 'Anexo atualizado com sucesso',
    type: AttachmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Anexo não encontrado' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateAttachmentDto: UpdateAttachmentDto,
  ): Promise<AttachmentResponseDto> {
    return this.attachmentsService.update(tenantId, id, updateAttachmentDto);
  }

  @Delete(':id')
  @Roles('admin', 'manager')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um anexo' })
  @ApiResponse({
    status: 204,
    description: 'Anexo removido com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Anexo não encontrado' })
  async remove(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.attachmentsService.remove(tenantId, id);
  }
}
