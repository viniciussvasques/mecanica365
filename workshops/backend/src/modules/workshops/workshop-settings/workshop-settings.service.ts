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
    // Verificar se o tenant existe
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado');
    }

    // Verificar se já existe configuração
    const existing = await this.prisma.workshopSettings.findUnique({
      where: { tenantId },
    });

    if (existing) {
      // Atualizar - tratar campos vazios como null para limpar valores anteriores
      const updated = await this.prisma.workshopSettings.update({
        where: { tenantId },
        data: {
          displayName:
            createDto.displayName !== undefined
              ? createDto.displayName || null
              : undefined,
          logoUrl:
            createDto.logoUrl !== undefined
              ? createDto.logoUrl || null
              : undefined,
          primaryColor:
            createDto.primaryColor !== undefined
              ? createDto.primaryColor || null
              : undefined,
          secondaryColor:
            createDto.secondaryColor !== undefined
              ? createDto.secondaryColor || null
              : undefined,
          accentColor:
            createDto.accentColor !== undefined
              ? createDto.accentColor || null
              : undefined,
          phone:
            createDto.phone !== undefined ? createDto.phone || null : undefined,
          email:
            createDto.email !== undefined ? createDto.email || null : undefined,
          whatsapp:
            createDto.whatsapp !== undefined
              ? createDto.whatsapp || null
              : undefined,
          address:
            createDto.address !== undefined
              ? createDto.address || null
              : undefined,
          city:
            createDto.city !== undefined ? createDto.city || null : undefined,
          state:
            createDto.state !== undefined ? createDto.state || null : undefined,
          zipCode:
            createDto.zipCode !== undefined
              ? createDto.zipCode || null
              : undefined,
          country:
            createDto.country !== undefined
              ? createDto.country || 'BR'
              : undefined,
          website:
            createDto.website !== undefined
              ? createDto.website || null
              : undefined,
          facebook:
            createDto.facebook !== undefined
              ? createDto.facebook || null
              : undefined,
          instagram:
            createDto.instagram !== undefined
              ? createDto.instagram || null
              : undefined,
          linkedin:
            createDto.linkedin !== undefined
              ? createDto.linkedin || null
              : undefined,
          showLogoOnQuotes:
            createDto.showLogoOnQuotes !== undefined
              ? createDto.showLogoOnQuotes
              : undefined,
          showAddressOnQuotes:
            createDto.showAddressOnQuotes !== undefined
              ? createDto.showAddressOnQuotes
              : undefined,
          showContactOnQuotes:
            createDto.showContactOnQuotes !== undefined
              ? createDto.showContactOnQuotes
              : undefined,
          quoteFooterText:
            createDto.quoteFooterText !== undefined
              ? createDto.quoteFooterText || null
              : undefined,
          invoiceFooterText:
            createDto.invoiceFooterText !== undefined
              ? createDto.invoiceFooterText || null
              : undefined,
        },
      });

      this.logger.log(`Configurações atualizadas para tenant ${tenantId}`);
      return this.toResponseDto(updated);
    } else {
      // Criar
      const created = await this.prisma.workshopSettings.create({
        data: {
          tenantId,
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
        },
      });

      this.logger.log(`Configurações criadas para tenant ${tenantId}`);
      return this.toResponseDto(created);
    }
  }

  /**
   * Atualiza as configurações do tenant
   */
  async update(
    tenantId: string,
    updateDto: UpdateWorkshopSettingsDto,
  ): Promise<WorkshopSettingsResponseDto> {
    const existing = await this.prisma.workshopSettings.findUnique({
      where: { tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Configurações não encontradas');
    }

    const updated = await this.prisma.workshopSettings.update({
      where: { tenantId },
      data: {
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
        ...(updateDto.phone !== undefined && { phone: updateDto.phone }),
        ...(updateDto.email !== undefined && { email: updateDto.email }),
        ...(updateDto.whatsapp !== undefined && {
          whatsapp: updateDto.whatsapp,
        }),
        ...(updateDto.address !== undefined && { address: updateDto.address }),
        ...(updateDto.city !== undefined && { city: updateDto.city }),
        ...(updateDto.state !== undefined && { state: updateDto.state }),
        ...(updateDto.zipCode !== undefined && {
          zipCode: updateDto.zipCode,
        }),
        ...(updateDto.country !== undefined && {
          country: updateDto.country,
        }),
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
      },
    });

    this.logger.log(`Configurações atualizadas para tenant ${tenantId}`);
    return this.toResponseDto(updated);
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
