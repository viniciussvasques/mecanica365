import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EncryptionService } from '../../shared/encryption/encryption.service';
import { CreateSystemPaymentDto } from './dto/create-system-payment.dto';
import { UpdateSystemPaymentDto } from './dto/update-system-payment.dto';

@Injectable()
export class SystemPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
  ) {}

  async findAll() {
    const gateways = await this.prisma.systemPaymentGateway.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return gateways.map((gateway) => this.sanitize(gateway));
  }

  async findOne(id: string) {
    const gateway = await this.prisma.systemPaymentGateway.findUnique({
      where: { id },
    });

    if (!gateway) {
      throw new NotFoundException('Gateway de pagamento não encontrado');
    }

    return this.sanitize(gateway);
  }

  async create(dto: CreateSystemPaymentDto) {
    if (dto.isDefault) {
      await this.resetDefaultGateway();
    }

    const created = await this.prisma.systemPaymentGateway.create({
      data: {
        name: dto.name,
        type: dto.type,
        publicKey: dto.credentials.publicKey,
        secretKey: this.encryptionService.encrypt(dto.credentials.secretKey),
        webhookSecret: dto.credentials.webhookSecret
          ? this.encryptionService.encrypt(dto.credentials.webhookSecret)
          : null,
        isActive: dto.isActive ?? true,
        isDefault: dto.isDefault ?? false,
      },
    });

    return this.sanitize(created);
  }

  async update(id: string, dto: UpdateSystemPaymentDto) {
    const existing = await this.prisma.systemPaymentGateway.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Gateway de pagamento não encontrado');
    }

    if (dto.isDefault) {
      await this.resetDefaultGateway(id);
    }

    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.type !== undefined) updateData.type = dto.type;
    
    if (dto.credentials) {
      if (dto.credentials.publicKey !== undefined) {
        updateData.publicKey = dto.credentials.publicKey;
      }
      if (dto.credentials.secretKey !== undefined) {
        updateData.secretKey = this.encryptionService.encrypt(dto.credentials.secretKey);
      }
      if (dto.credentials.webhookSecret !== undefined) {
        updateData.webhookSecret = dto.credentials.webhookSecret
          ? this.encryptionService.encrypt(dto.credentials.webhookSecret)
          : null;
      }
    }
    
    if (dto.isActive !== undefined) updateData.isActive = dto.isActive;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;

    const updated = await this.prisma.systemPaymentGateway.update({
      where: { id },
      data: updateData,
    });

    return this.sanitize(updated);
  }

  async remove(id: string) {
    const existing = await this.prisma.systemPaymentGateway.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Gateway de pagamento não encontrado');
    }

    if (existing.isDefault) {
      throw new BadRequestException(
        'Não é possível remover o gateway padrão',
      );
    }

    await this.prisma.systemPaymentGateway.delete({ where: { id } });

    return { message: 'Gateway removido com sucesso' };
  }

  async setDefault(id: string) {
    const existing = await this.prisma.systemPaymentGateway.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Gateway de pagamento não encontrado');
    }

    await this.resetDefaultGateway(id);

    const updated = await this.prisma.systemPaymentGateway.update({
      where: { id },
      data: { isDefault: true, isActive: true },
    });

    return this.sanitize(updated);
  }

  async testConnection(id: string) {
    const existing = await this.prisma.systemPaymentGateway.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Gateway de pagamento não encontrado');
    }

    // TODO: Implementar testes reais por tipo (Stripe, MercadoPago, etc.)
    return {
      success: true,
      message: 'Teste de conexão não implementado. Configure manualmente.',
    };
  }

  private async resetDefaultGateway(excludeId?: string) {
    await this.prisma.systemPaymentGateway.updateMany({
      where: excludeId ? { id: { not: excludeId } } : undefined,
      data: { isDefault: false },
    });
  }

  private sanitize(gateway: {
    id: string;
    name: string;
    type: string;
    publicKey: string;
    secretKey: string;
    webhookSecret: string | null;
    isActive: boolean;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: gateway.id,
      name: gateway.name,
      type: gateway.type,
      publicKey: gateway.publicKey,
      isActive: gateway.isActive,
      isDefault: gateway.isDefault,
      createdAt: gateway.createdAt,
      updatedAt: gateway.updatedAt,
      hasSecret: Boolean(gateway.secretKey),
      hasWebhookSecret: Boolean(gateway.webhookSecret),
    };
  }
}
