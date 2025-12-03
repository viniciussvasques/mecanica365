import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateWorkshopSettingsDto,
  UpdateWorkshopSettingsDto,
  WorkshopSettingsResponseDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class WorkshopSettingsService {
  private readonly logger = new Logger(WorkshopSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Busca as configurações do tenant
   */
  async findOne(tenantId: string): Promise<WorkshopSettingsResponseDto> {
    const settings = await this.prisma.workshopSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      // Retornar configurações padrão se não existir
      return this.getDefaultSettings(tenantId);
    }

    return this.toResponseDto(settings);
  }

  /**
   * Cria ou atualiza as configurações do tenant
   */
  async upsert(
    tenantId: string,
    createDto: CreateWorkshopSettingsDto,
  ): Promise<WorkshopSettingsResponseDto> {
    await this.validateTenantExists(tenantId);

    const existing = await this.prisma.workshopSettings.findUnique({
      where: { tenantId },
    });

    if (existing) {
      return this.updateExistingSettings(tenantId, createDto);
    } else {
      return this.createNewSettings(tenantId, createDto);
    }
  }

  private async validateTenantExists(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }
  }

  private async updateExistingSettings(
    tenantId: string,
    createDto: CreateWorkshopSettingsDto,
  ): Promise<WorkshopSettingsResponseDto> {
    const updateData = this.prepareUpdateData(createDto);
    const updated = await this.prisma.workshopSettings.update({
      where: { tenantId },
      data: updateData,
    });

    this.logger.log(`Configurações atualizadas para tenant ${tenantId}`);
    return this.toResponseDto(updated);
  }

  private async createNewSettings(
    tenantId: string,
    createDto: CreateWorkshopSettingsDto,
  ): Promise<WorkshopSettingsResponseDto> {
    const createData = this.prepareCreateData(tenantId, createDto);
    const created = await this.prisma.workshopSettings.create({
      data: createData,
    });

    this.logger.log(`Configurações criadas para tenant ${tenantId}`);
    return this.toResponseDto(created);
  }

  private prepareUpdateData(
    createDto: CreateWorkshopSettingsDto,
  ): Prisma.WorkshopSettingsUpdateInput {
    return {
      displayName: this.normalizeField(createDto.displayName),
      logoUrl: this.normalizeField(createDto.logoUrl),
      primaryColor: this.normalizeField(createDto.primaryColor),
      secondaryColor: this.normalizeField(createDto.secondaryColor),
      accentColor: this.normalizeField(createDto.accentColor),
      phone: this.normalizeField(createDto.phone),
      email: this.normalizeField(createDto.email),
      whatsapp: this.normalizeField(createDto.whatsapp),
      address: this.normalizeField(createDto.address),
      city: this.normalizeField(createDto.city),
      state: this.normalizeField(createDto.state),
      zipCode: this.normalizeField(createDto.zipCode),
      country: createDto.country ?? 'BR',
      website: this.normalizeField(createDto.website),
      facebook: this.normalizeField(createDto.facebook),
      instagram: this.normalizeField(createDto.instagram),
      linkedin: this.normalizeField(createDto.linkedin),
      showLogoOnQuotes: createDto.showLogoOnQuotes ?? undefined,
      showAddressOnQuotes: createDto.showAddressOnQuotes ?? undefined,
      showContactOnQuotes: createDto.showContactOnQuotes ?? undefined,
      quoteFooterText: this.normalizeField(createDto.quoteFooterText),
      invoiceFooterText: this.normalizeField(createDto.invoiceFooterText),
    };
  }

  private prepareCreateData(
    tenantId: string,
    createDto: CreateWorkshopSettingsDto,
  ): Prisma.WorkshopSettingsCreateInput {
    return {
      tenant: {
        connect: { id: tenantId },
      },
      displayName: createDto.displayName,
      logoUrl: createDto.logoUrl,
      primaryColor: createDto.primaryColor,
      secondaryColor: createDto.secondaryColor,
      accentColor: createDto.accentColor,
      phone: createDto.phone,
      email: createDto.email,
      whatsapp: createDto.whatsapp,
      address: createDto.address,
      city: createDto.city,
      state: createDto.state,
      zipCode: createDto.zipCode,
      country: createDto.country || 'BR',
      website: createDto.website,
      facebook: createDto.facebook,
      instagram: createDto.instagram,
      linkedin: createDto.linkedin,
      showLogoOnQuotes: createDto.showLogoOnQuotes ?? true,
      showAddressOnQuotes: createDto.showAddressOnQuotes ?? true,
      showContactOnQuotes: createDto.showContactOnQuotes ?? true,
      quoteFooterText: createDto.quoteFooterText,
      invoiceFooterText: createDto.invoiceFooterText,
    };
  }

  private normalizeField(
    value: string | null | undefined,
  ): string | null | undefined {
    return value === undefined ? undefined : value || null;
  }

  /**
   * Atualiza as configurações do tenant
   */
  async update(
    tenantId: string,
    updateDto: UpdateWorkshopSettingsDto,
  ): Promise<WorkshopSettingsResponseDto> {
    await this.validateSettingsExist(tenantId);

    const updateData = this.preparePartialUpdateData(updateDto);
    const updated = await this.prisma.workshopSettings.update({
      where: { tenantId },
      data: updateData,
    });

    this.logger.log(`Configurações atualizadas para tenant ${tenantId}`);
    return this.toResponseDto(updated);
  }

  private async validateSettingsExist(tenantId: string): Promise<void> {
    const existing = await this.prisma.workshopSettings.findUnique({
      where: { tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Configurações não encontradas');
    }
  }

  private preparePartialUpdateData(
    updateDto: UpdateWorkshopSettingsDto,
  ): Prisma.WorkshopSettingsUpdateInput {
    return {
      ...this.prepareBrandingFields(updateDto),
      ...this.prepareContactFields(updateDto),
      ...this.prepareAddressFields(updateDto),
      ...this.prepareSocialMediaFields(updateDto),
      ...this.prepareQuoteSettingsFields(updateDto),
    };
  }

  private prepareBrandingFields(
    updateDto: UpdateWorkshopSettingsDto,
  ): Partial<Prisma.WorkshopSettingsUpdateInput> {
    return {
      ...(updateDto.displayName !== undefined && {
        displayName: updateDto.displayName,
      }),
      ...(updateDto.logoUrl !== undefined && { logoUrl: updateDto.logoUrl }),
      ...(updateDto.primaryColor !== undefined && {
        primaryColor: updateDto.primaryColor,
      }),
      ...(updateDto.secondaryColor !== undefined && {
        secondaryColor: updateDto.secondaryColor,
      }),
      ...(updateDto.accentColor !== undefined && {
        accentColor: updateDto.accentColor,
      }),
    };
  }

  private prepareContactFields(
    updateDto: UpdateWorkshopSettingsDto,
  ): Partial<Prisma.WorkshopSettingsUpdateInput> {
    return {
      ...(updateDto.phone !== undefined && { phone: updateDto.phone }),
      ...(updateDto.email !== undefined && { email: updateDto.email }),
      ...(updateDto.whatsapp !== undefined && {
        whatsapp: updateDto.whatsapp,
      }),
    };
  }

  private prepareAddressFields(
    updateDto: UpdateWorkshopSettingsDto,
  ): Partial<Prisma.WorkshopSettingsUpdateInput> {
    return {
      ...(updateDto.address !== undefined && { address: updateDto.address }),
      ...(updateDto.city !== undefined && { city: updateDto.city }),
      ...(updateDto.state !== undefined && { state: updateDto.state }),
      ...(updateDto.zipCode !== undefined && {
        zipCode: updateDto.zipCode,
      }),
      ...(updateDto.country !== undefined && {
        country: updateDto.country,
      }),
    };
  }

  private prepareSocialMediaFields(
    updateDto: UpdateWorkshopSettingsDto,
  ): Partial<Prisma.WorkshopSettingsUpdateInput> {
    return {
      ...(updateDto.website !== undefined && {
        website: updateDto.website,
      }),
      ...(updateDto.facebook !== undefined && {
        facebook: updateDto.facebook,
      }),
      ...(updateDto.instagram !== undefined && {
        instagram: updateDto.instagram,
      }),
      ...(updateDto.linkedin !== undefined && {
        linkedin: updateDto.linkedin,
      }),
    };
  }

  private prepareQuoteSettingsFields(
    updateDto: UpdateWorkshopSettingsDto,
  ): Partial<Prisma.WorkshopSettingsUpdateInput> {
    return {
      ...(updateDto.showLogoOnQuotes !== undefined && {
        showLogoOnQuotes: updateDto.showLogoOnQuotes,
      }),
      ...(updateDto.showAddressOnQuotes !== undefined && {
        showAddressOnQuotes: updateDto.showAddressOnQuotes,
      }),
      ...(updateDto.showContactOnQuotes !== undefined && {
        showContactOnQuotes: updateDto.showContactOnQuotes,
      }),
      ...(updateDto.quoteFooterText !== undefined && {
        quoteFooterText: updateDto.quoteFooterText,
      }),
      ...(updateDto.invoiceFooterText !== undefined && {
        invoiceFooterText: updateDto.invoiceFooterText,
      }),
    };
  }

  /**
   * Retorna configurações padrão
   */
  private getDefaultSettings(tenantId: string): WorkshopSettingsResponseDto {
    return {
      id: '',
      tenantId,
      country: 'BR',
      showLogoOnQuotes: true,
      showAddressOnQuotes: true,
      showContactOnQuotes: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Converte Prisma para DTO
   */
  private toResponseDto(
    settings: Prisma.WorkshopSettingsGetPayload<Record<string, never>>,
  ): WorkshopSettingsResponseDto {
    return {
      id: settings.id,
      tenantId: settings.tenantId,
      displayName: settings.displayName ?? undefined,
      logoUrl: settings.logoUrl ?? undefined,
      primaryColor: settings.primaryColor ?? undefined,
      secondaryColor: settings.secondaryColor ?? undefined,
      accentColor: settings.accentColor ?? undefined,
      phone: settings.phone ?? undefined,
      email: settings.email ?? undefined,
      whatsapp: settings.whatsapp ?? undefined,
      address: settings.address ?? undefined,
      city: settings.city ?? undefined,
      state: settings.state ?? undefined,
      zipCode: settings.zipCode ?? undefined,
      country: settings.country ?? 'BR',
      website: settings.website ?? undefined,
      facebook: settings.facebook ?? undefined,
      instagram: settings.instagram ?? undefined,
      linkedin: settings.linkedin ?? undefined,
      showLogoOnQuotes: settings.showLogoOnQuotes ?? true,
      showAddressOnQuotes: settings.showAddressOnQuotes ?? true,
      showContactOnQuotes: settings.showContactOnQuotes ?? true,
      quoteFooterText: settings.quoteFooterText ?? undefined,
      invoiceFooterText: settings.invoiceFooterText ?? undefined,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }
}
