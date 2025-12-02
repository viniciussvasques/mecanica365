import { Test, TestingModule } from '@nestjs/testing';
import { AttachmentsService } from './attachments.service';
import { PrismaService } from '@database/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateAttachmentDto, AttachmentType } from './dto';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';

describe('AttachmentsService', () => {
  let service: AttachmentsService;

  const mockTenantId = 'tenant-123';
  const mockAttachmentId = 'attachment-123';
  const mockQuoteId = 'quote-123';

  const mockFile = {
    originalname: 'test-image.jpg',
    mimetype: 'image/jpeg',
    size: 1024000,
    buffer: Buffer.from('test-image-data'),
  } as unknown;

  const mockAttachment = {
    id: mockAttachmentId,
    tenantId: mockTenantId,
    type: AttachmentType.PHOTO_BEFORE,
    fileName: 'attachment-1234567890-123456789.jpg',
    originalName: 'test-image.jpg',
    mimeType: 'image/jpeg',
    fileSize: 1024000,
    filePath: 'attachments/tenant-123/attachment-1234567890-123456789.jpg',
    url: '/uploads/attachments/tenant-123/attachment-1234567890-123456789.jpg',
    quoteId: mockQuoteId,
    serviceOrderId: null,
    customerId: null,
    vehicleId: null,
    description: null,
    uploadedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaService = {
    attachment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateAttachmentDto = {
      type: AttachmentType.PHOTO_BEFORE,
      quoteId: mockQuoteId,
    };

    it('deve criar um anexo com sucesso', async () => {
      mockPrismaService.attachment.create.mockResolvedValue(mockAttachment);

      // Mock fs/promises
      const fsMock = {
        mkdir: jest.fn().mockResolvedValue(undefined),
        writeFile: jest.fn().mockResolvedValue(undefined),
      };
      jest.spyOn(fsPromises, 'mkdir').mockImplementation(fsMock.mkdir);
      jest.spyOn(fsPromises, 'writeFile').mockImplementation(fsMock.writeFile);
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = await service.create(mockTenantId, createDto, mockFile);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAttachmentId);
      expect(mockPrismaService.attachment.create).toHaveBeenCalled();
    });

    it('deve lançar BadRequestException se nenhum relacionamento for fornecido', async () => {
      const createDtoWithoutRelations: CreateAttachmentDto = {
        type: AttachmentType.PHOTO_BEFORE,
      };

      await expect(
        service.create(mockTenantId, createDtoWithoutRelations, mockFile),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se arquivo não for fornecido', async () => {
      await expect(
        service.create(mockTenantId, createDto, null as unknown),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se tipo de arquivo for inválido para foto', async () => {
      const invalidFile = {
        ...(mockFile as Record<string, unknown>),
        mimetype: 'application/pdf',
      };

      await expect(
        service.create(mockTenantId, createDto, invalidFile),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve lançar BadRequestException se tipo de arquivo for inválido para documento', async () => {
      const documentDto: CreateAttachmentDto = {
        type: AttachmentType.DOCUMENT,
        quoteId: mockQuoteId,
      };
      const invalidFile = {
        ...(mockFile as Record<string, unknown>),
        mimetype: 'image/jpeg',
      };

      await expect(
        service.create(mockTenantId, documentDto, invalidFile),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('deve listar anexos com paginação', async () => {
      const mockAttachments = [mockAttachment];
      mockPrismaService.attachment.findMany.mockResolvedValue(mockAttachments);
      mockPrismaService.attachment.count.mockResolvedValue(1);

      const filters = {
        page: 1,
        limit: 20,
      };

      const result = await service.findAll(mockTenantId, filters);

      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockPrismaService.attachment.findMany).toHaveBeenCalled();
      expect(mockPrismaService.attachment.count).toHaveBeenCalled();
    });

    it('deve filtrar anexos por tipo', async () => {
      mockPrismaService.attachment.findMany.mockResolvedValue([]);
      mockPrismaService.attachment.count.mockResolvedValue(0);

      const filters = {
        type: AttachmentType.PHOTO_BEFORE,
        page: 1,
        limit: 20,
      };

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.attachment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: AttachmentType.PHOTO_BEFORE,
          }),
        }),
      );
    });

    it('deve filtrar anexos por quoteId', async () => {
      mockPrismaService.attachment.findMany.mockResolvedValue([]);
      mockPrismaService.attachment.count.mockResolvedValue(0);

      const filters = {
        quoteId: mockQuoteId,
        page: 1,
        limit: 20,
      };

      await service.findAll(mockTenantId, filters);

      expect(mockPrismaService.attachment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            quoteId: mockQuoteId,
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('deve buscar um anexo por ID', async () => {
      mockPrismaService.attachment.findFirst.mockResolvedValue(mockAttachment);

      const result = await service.findOne(mockTenantId, mockAttachmentId);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockAttachmentId);
      expect(mockPrismaService.attachment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            id: mockAttachmentId,
            tenantId: mockTenantId,
          },
        }),
      );
    });

    it('deve lançar NotFoundException se anexo não for encontrado', async () => {
      mockPrismaService.attachment.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockTenantId, mockAttachmentId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      description: 'Nova descrição',
    };

    it('deve atualizar um anexo com sucesso', async () => {
      const updatedAttachment = {
        ...mockAttachment,
        description: 'Nova descrição',
      };
      mockPrismaService.attachment.findFirst.mockResolvedValue(mockAttachment);
      mockPrismaService.attachment.update.mockResolvedValue(updatedAttachment);

      const result = await service.update(
        mockTenantId,
        mockAttachmentId,
        updateDto,
      );

      expect(result).toBeDefined();
      expect(result.description).toBe('Nova descrição');
      expect(mockPrismaService.attachment.update).toHaveBeenCalled();
    });

    it('deve lançar NotFoundException se anexo não for encontrado', async () => {
      mockPrismaService.attachment.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockTenantId, mockAttachmentId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deve remover um anexo com sucesso', async () => {
      mockPrismaService.attachment.findFirst.mockResolvedValue(mockAttachment);
      mockPrismaService.attachment.delete.mockResolvedValue(mockAttachment);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      await service.remove(mockTenantId, mockAttachmentId);

      expect(mockPrismaService.attachment.delete).toHaveBeenCalledWith({
        where: { id: mockAttachmentId },
      });
    });

    it('deve lançar NotFoundException se anexo não for encontrado', async () => {
      mockPrismaService.attachment.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(mockTenantId, mockAttachmentId),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve remover arquivo físico se existir', async () => {
      mockPrismaService.attachment.findFirst.mockResolvedValue(mockAttachment);
      mockPrismaService.attachment.delete.mockResolvedValue(mockAttachment);
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      const unlinkSyncSpy = jest
        .spyOn(fs, 'unlinkSync')
        .mockImplementation(() => {});

      await service.remove(mockTenantId, mockAttachmentId);

      expect(unlinkSyncSpy).toHaveBeenCalled();
    });

    it('não deve falhar se arquivo físico não existir', async () => {
      mockPrismaService.attachment.findFirst.mockResolvedValue(mockAttachment);
      mockPrismaService.attachment.delete.mockResolvedValue(mockAttachment);
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      await expect(
        service.remove(mockTenantId, mockAttachmentId),
      ).resolves.not.toThrow();
    });
  });
});
