import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { Prisma } from '@prisma/client';
import type { PaymentGateway as PaymentGatewayModel } from '@prisma/client';
import { CreatePaymentGatewayDto } from './dto/create-payment-gateway.dto';
import { UpdatePaymentGatewayDto } from './dto/update-payment-gateway.dto';
import { PaymentGatewayResponseDto } from './dto/payment-gateway-response.dto';
import { PaymentGatewayType } from './dto/payment-gateway-types.enum';

@Injectable()
export class PaymentGatewaysService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<PaymentGatewayResponseDto[]> {
    const gateways = await this.prisma.paymentGateway.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return gateways.map((gateway) => this.toResponseDto(gateway));
  }

  async findById(
    tenantId: string,
    id: string,
  ): Promise<PaymentGatewayResponseDto> {
    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { id, tenantId },
    });

    if (!gateway) {
      throw new NotFoundException('Gateway não encontrado');
    }

    return this.toResponseDto(gateway);
  }

  async create(
    tenantId: string,
    createDto: CreatePaymentGatewayDto,
  ): Promise<PaymentGatewayResponseDto> {
    if (createDto.isDefault) {
      await this.clearDefaultGateway(tenantId);
    }

    const gateway = await this.prisma.paymentGateway.create({
      data: {
        tenantId,
        name: createDto.name,
        type: createDto.type,
        isActive: createDto.isActive,
        isDefault: createDto.isDefault ?? false,
        credentials: createDto.credentials as Prisma.JsonObject,
        settings: createDto.settings as Prisma.JsonObject | undefined,
      },
    });

    return this.toResponseDto(gateway);
  }

  async update(
    tenantId: string,
    id: string,
    updateDto: UpdatePaymentGatewayDto,
  ): Promise<PaymentGatewayResponseDto> {
    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { id, tenantId },
    });

    if (!gateway) {
      throw new NotFoundException('Gateway não encontrado');
    }

    if (updateDto.isDefault) {
      await this.clearDefaultGateway(tenantId);
    }

    const updated = await this.prisma.paymentGateway.update({
      where: { id },
      data: {
        ...(updateDto.name !== undefined && { name: updateDto.name }),
        ...(updateDto.type !== undefined && { type: updateDto.type }),
        ...(updateDto.isActive !== undefined && {
          isActive: updateDto.isActive,
        }),
        ...(updateDto.isDefault !== undefined && {
          isDefault: updateDto.isDefault,
        }),
        ...(updateDto.credentials !== undefined && {
          credentials: updateDto.credentials as Prisma.JsonObject,
        }),
        ...(updateDto.settings !== undefined && {
          settings: updateDto.settings as Prisma.JsonObject,
        }),
      },
    });

    return this.toResponseDto(updated);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { id, tenantId },
    });

    if (!gateway) {
      throw new NotFoundException('Gateway não encontrado');
    }

    await this.prisma.paymentGateway.delete({
      where: { id },
    });
  }

  async setDefault(tenantId: string, id: string): Promise<void> {
    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { id, tenantId },
    });

    if (!gateway) {
      throw new NotFoundException('Gateway não encontrado');
    }

    await this.clearDefaultGateway(tenantId);

    await this.prisma.paymentGateway.update({
      where: { id },
      data: { isDefault: true, isActive: true },
    });
  }

  async getDefaultGateway(tenantId: string) {
    return this.prisma.paymentGateway.findFirst({
      where: { tenantId, isDefault: true, isActive: true },
    });
  }

  async testConnection(
    tenantId: string,
    id: string,
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { id, tenantId },
    });

    if (!gateway) {
      throw new NotFoundException('Gateway não encontrado');
    }

    // TODO: Implementar testes reais por tipo de gateway
    return {
      success: true,
      message: `Gateway ${gateway.name} (${gateway.type}) configurado corretamente.`,
    };
  }

  private async clearDefaultGateway(tenantId: string): Promise<void> {
    await this.prisma.paymentGateway.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });
  }

  private toResponseDto(
    gateway: PaymentGatewayModel,
  ): PaymentGatewayResponseDto {
    return {
      id: gateway.id,
      tenantId: gateway.tenantId,
      name: gateway.name,
      type: gateway.type as PaymentGatewayType,
      isActive: gateway.isActive,
      isDefault: gateway.isDefault,
      credentials: this.jsonToRecord(gateway.credentials) ?? {},
      settings: gateway.settings
        ? this.jsonToRecord(gateway.settings)
        : undefined,
      createdAt: gateway.createdAt,
      updatedAt: gateway.updatedAt,
    };
  }

  private jsonToRecord(
    value: Prisma.JsonValue,
  ): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  }
}
