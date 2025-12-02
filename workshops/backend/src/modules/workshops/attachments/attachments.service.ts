import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateAttachmentDto,
  UpdateAttachmentDto,
  AttachmentResponseDto,
  AttachmentFiltersDto,
} from './dto';
import { Prisma } from '@prisma/client';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);
  private readonly uploadsDir = join(process.cwd(), 'uploads', 'attachments');

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo anexo
   */
  async create(
    tenantId: string,
    createAttachmentDto: CreateAttachmentDto,
    file: Express.Multer.File,
  ): Promise<AttachmentResponseDto> {
    try {
      // Validar que pelo menos um relacionamento foi fornecido
      if (
        !createAttachmentDto.quoteId &&
        !createAttachmentDto.serviceOrderId &&
        !createAttachmentDto.customerId &&
        !createAttachmentDto.vehicleId
      ) {
        throw new BadRequestException(
          'É necessário fornecer pelo menos um relacionamento (quoteId, serviceOrderId, customerId ou vehicleId)',
        );
      }

      // Validar arquivo
      if (!file) {
        throw new BadRequestException('Arquivo é obrigatório');
      }

      // Validar tipo de arquivo baseado no tipo de anexo
      this.validateFileType(createAttachmentDto.type, file.mimetype);

      // Criar diretório do tenant se não existir
      const tenantDir = join(this.uploadsDir, tenantId);
      if (!existsSync(tenantDir)) {
        const fs = await import('fs/promises');
        await fs.mkdir(tenantDir, { recursive: true });
      }

      // Gerar nome único para o arquivo
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = file.originalname.split('.').pop();
      const fileName = `attachment-${uniqueSuffix}.${ext}`;
      const filePath = join(tenantDir, fileName);

      // Salvar arquivo
      const fs = await import('fs/promises');
      // file.buffer está disponível quando usamos memoryStorage (padrão)
      const fileBuffer = file.buffer || Buffer.from([]);
      await fs.writeFile(filePath, fileBuffer);

      // URL pública
      const url = `/uploads/attachments/${tenantId}/${fileName}`;

      // Criar registro no banco
      const attachment = await this.prisma.attachment.create({
        data: {
          tenant: { connect: { id: tenantId } },
          type: createAttachmentDto.type,
          fileName,
          originalName: file.originalname,
          mimeType: file.mimetype,
          fileSize: file.size,
          filePath: `attachments/${tenantId}/${fileName}`,
          url,
          quote: createAttachmentDto.quoteId
            ? { connect: { id: createAttachmentDto.quoteId } }
            : undefined,
          serviceOrder: createAttachmentDto.serviceOrderId
            ? { connect: { id: createAttachmentDto.serviceOrderId } }
            : undefined,
          customer: createAttachmentDto.customerId
            ? { connect: { id: createAttachmentDto.customerId } }
            : undefined,
          vehicle: createAttachmentDto.vehicleId
            ? { connect: { id: createAttachmentDto.vehicleId } }
            : undefined,
          description: createAttachmentDto.description || undefined,
        },
        include: {
          quote: {
            select: {
              id: true,
              number: true,
            },
          },
          serviceOrder: {
            select: {
              id: true,
              number: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              placa: true,
              make: true,
              model: true,
            },
          },
        },
      });

      this.logger.log(
        `Anexo criado: ${attachment.id} (${attachment.type}) - ${attachment.fileName}`,
      );

      return this.toResponseDto(
        attachment as Parameters<typeof this.toResponseDto>[0],
      );
    } catch (error) {
      this.logger.error(
        `Erro ao criar anexo: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Lista anexos com filtros e paginação
   */
  async findAll(
    tenantId: string,
    filters: AttachmentFiltersDto,
  ): Promise<{
    data: AttachmentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const where: Prisma.AttachmentWhereInput = {
        tenantId,
        ...(filters.type && { type: filters.type }),
        ...(filters.quoteId && { quoteId: filters.quoteId }),
        ...(filters.serviceOrderId && {
          serviceOrderId: filters.serviceOrderId,
        }),
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.vehicleId && { vehicleId: filters.vehicleId }),
        ...(filters.startDate &&
          filters.endDate && {
            createdAt: {
              gte: new Date(filters.startDate),
              lte: new Date(filters.endDate),
            },
          }),
      };

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      const [attachments, total] = await Promise.all([
        this.prisma.attachment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            quote: {
              select: {
                id: true,
                number: true,
              },
            },
            serviceOrder: {
              select: {
                id: true,
                number: true,
              },
            },
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
            vehicle: {
              select: {
                id: true,
                placa: true,
                make: true,
                model: true,
              },
            },
          },
        }),
        this.prisma.attachment.count({ where }),
      ]);

      return {
        data: attachments.map((attachment) =>
          this.toResponseDto(
            attachment as Parameters<typeof this.toResponseDto>[0],
          ),
        ),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(
        `Erro ao listar anexos: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Busca um anexo por ID
   */
  async findOne(tenantId: string, id: string): Promise<AttachmentResponseDto> {
    try {
      const attachment = await this.prisma.attachment.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          quote: {
            select: {
              id: true,
              number: true,
            },
          },
          serviceOrder: {
            select: {
              id: true,
              number: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              placa: true,
              make: true,
              model: true,
            },
          },
        },
      });

      if (!attachment) {
        throw new NotFoundException('Anexo não encontrado');
      }

      return this.toResponseDto(
        attachment as Parameters<typeof this.toResponseDto>[0],
      );
    } catch (error) {
      this.logger.error(
        `Erro ao buscar anexo: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Atualiza um anexo
   */
  async update(
    tenantId: string,
    id: string,
    updateAttachmentDto: UpdateAttachmentDto,
  ): Promise<AttachmentResponseDto> {
    try {
      const attachment = await this.prisma.attachment.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!attachment) {
        throw new NotFoundException('Anexo não encontrado');
      }

      const updatedAttachment = await this.prisma.attachment.update({
        where: { id },
        data: {
          ...(updateAttachmentDto.type && { type: updateAttachmentDto.type }),
          ...(updateAttachmentDto.quoteId && {
            quote: { connect: { id: updateAttachmentDto.quoteId } },
          }),
          ...(updateAttachmentDto.serviceOrderId && {
            serviceOrder: {
              connect: { id: updateAttachmentDto.serviceOrderId },
            },
          }),
          ...(updateAttachmentDto.customerId && {
            customer: { connect: { id: updateAttachmentDto.customerId } },
          }),
          ...(updateAttachmentDto.vehicleId && {
            vehicle: { connect: { id: updateAttachmentDto.vehicleId } },
          }),
          ...(updateAttachmentDto.description !== undefined && {
            description: updateAttachmentDto.description || null,
          }),
        },
        include: {
          quote: {
            select: {
              id: true,
              number: true,
            },
          },
          serviceOrder: {
            select: {
              id: true,
              number: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              placa: true,
              make: true,
              model: true,
            },
          },
        },
      });

      this.logger.log(`Anexo atualizado: ${id}`);

      return this.toResponseDto(
        updatedAttachment as unknown as Parameters<
          typeof this.toResponseDto
        >[0],
      );
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar anexo: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Remove um anexo
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      const attachment = await this.prisma.attachment.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!attachment) {
        throw new NotFoundException('Anexo não encontrado');
      }

      // Remover arquivo físico
      const filePath = join(this.uploadsDir, tenantId, attachment.fileName);
      if (existsSync(filePath)) {
        try {
          unlinkSync(filePath);
          this.logger.log(`Arquivo físico removido: ${filePath}`);
        } catch (fileError) {
          this.logger.warn(
            `Erro ao remover arquivo físico: ${getErrorMessage(fileError)}`,
          );
          // Não falha se não conseguir remover o arquivo físico
        }
      }

      // Remover registro do banco
      await this.prisma.attachment.delete({
        where: { id },
      });

      this.logger.log(`Anexo removido: ${id}`);
    } catch (error) {
      this.logger.error(
        `Erro ao remover anexo: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  /**
   * Converte Prisma Attachment para DTO de resposta
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toResponseDto(attachment: any): AttachmentResponseDto {
    return {
      id: attachment.id,
      type: attachment.type as AttachmentResponseDto['type'],
      fileName: attachment.fileName,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      fileSize: attachment.fileSize,
      filePath: attachment.filePath,
      url: attachment.url,
      quoteId: attachment.quoteId || undefined,
      serviceOrderId: attachment.serviceOrderId || undefined,
      customerId: attachment.customerId || undefined,
      vehicleId: attachment.vehicleId || undefined,
      description: attachment.description || undefined,
      uploadedById: attachment.uploadedById || undefined,
      createdAt: attachment.createdAt,
      updatedAt: attachment.updatedAt,
    };
  }

  /**
   * Valida o tipo de arquivo baseado no tipo de anexo
   */
  private validateFileType(attachmentType: string, mimeType: string): void {
    const imageMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const documentMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (
      attachmentType === 'photo_before' ||
      attachmentType === 'photo_during' ||
      attachmentType === 'photo_after'
    ) {
      if (!imageMimeTypes.includes(mimeType)) {
        throw new BadRequestException(
          'Tipo de anexo de foto requer uma imagem (JPEG, PNG, GIF ou WebP)',
        );
      }
    } else if (attachmentType === 'document') {
      if (!documentMimeTypes.includes(mimeType)) {
        throw new BadRequestException(
          'Tipo de anexo de documento requer um documento (PDF ou DOC/DOCX)',
        );
      }
    }
  }
}
