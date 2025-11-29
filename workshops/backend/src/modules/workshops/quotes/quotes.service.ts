import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  QuoteResponseDto,
  QuoteFiltersDto,
  ApproveQuoteDto,
  QuoteStatus,
  QuoteItemDto,
  QuoteItemType,
} from './dto';
import { Prisma } from '@prisma/client';
import { getErrorMessage } from '@common/utils/error.utils';
import { ElevatorsService } from '../elevators/elevators.service';
import { ServiceOrdersService } from '../service-orders/service-orders.service';
import { ServiceOrderStatus } from '../service-orders/dto/service-order-status.enum';
import { QuotePdfService } from './pdf/quote-pdf.service';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly elevatorsService: ElevatorsService,
    private readonly serviceOrdersService: ServiceOrdersService,
    private readonly quotePdfService: QuotePdfService,
  ) {}

  /**
   * Gera número único de orçamento para o tenant
   */
  private async generateQuoteNumber(tenantId: string): Promise<string> {
    const lastQuote = await this.prisma.quote.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastQuote) {
      return 'ORC-001';
    }

    const lastNumber = parseInt(lastQuote.number.replace('ORC-', ''), 10);
    const nextNumber = lastNumber + 1;
    return `ORC-${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Calcula o custo total do orçamento
   */
  private calculateTotalCost(
    items: QuoteItemDto[],
    laborCost?: number,
    partsCost?: number,
    discount: number = 0,
    taxAmount: number = 0,
  ): number {
    const itemsTotal = items.reduce(
      (sum, item) => sum + item.unitCost * item.quantity,
      0,
    );
    const labor = laborCost || 0;
    const parts = partsCost || 0;
    const subtotal = itemsTotal + labor + parts;
    const total = subtotal - discount + taxAmount;
    return Math.max(0, total);
  }

  /**
   * Cria um novo orçamento
   */
  async create(
    tenantId: string,
    createQuoteDto: CreateQuoteDto,
  ): Promise<QuoteResponseDto> {
    try {
      // Validar cliente se fornecido
      if (createQuoteDto.customerId) {
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: createQuoteDto.customerId,
            tenantId,
          },
        });

        if (!customer) {
          throw new NotFoundException('Cliente não encontrado');
        }
      }

      // Validar veículo se fornecido
      if (createQuoteDto.vehicleId) {
        const vehicle = await this.prisma.customerVehicle.findFirst({
          where: {
            id: createQuoteDto.vehicleId,
            customer: { tenantId },
          },
        });

        if (!vehicle) {
          throw new NotFoundException('Veículo não encontrado');
        }
      }

      // Validar elevador se fornecido
      if (createQuoteDto.elevatorId) {
        const elevator = await this.prisma.elevator.findFirst({
          where: {
            id: createQuoteDto.elevatorId,
            tenantId,
          },
        });

        if (!elevator) {
          throw new NotFoundException('Elevador não encontrado');
        }
      }

      // Validar itens
      if (!createQuoteDto.items || createQuoteDto.items.length === 0) {
        throw new BadRequestException('Orçamento deve ter pelo menos um item');
      }

      // Calcular custos (itemsTotal calculado inline abaixo)

      const laborCost = createQuoteDto.laborCost || 0;
      const partsCost = createQuoteDto.partsCost || 0;
      const discount = createQuoteDto.discount || 0;
      const taxAmount = createQuoteDto.taxAmount || 0;

      const totalCost = this.calculateTotalCost(
        createQuoteDto.items,
        laborCost,
        partsCost,
        discount,
        taxAmount,
      );

      // Gerar número único
      const number = await this.generateQuoteNumber(tenantId);

      // Criar orçamento com itens
      const quote = await this.prisma.quote.create({
        data: {
          tenantId,
          number,
          customerId: createQuoteDto.customerId,
          vehicleId: createQuoteDto.vehicleId,
          elevatorId: createQuoteDto.elevatorId,
          status: createQuoteDto.status || QuoteStatus.DRAFT,
          laborCost: laborCost > 0 ? laborCost : null,
          partsCost: partsCost > 0 ? partsCost : null,
          totalCost,
          discount,
          taxAmount,
          validUntil: createQuoteDto.validUntil
            ? new Date(createQuoteDto.validUntil)
            : null,
          // Problema relatado pelo cliente
          reportedProblemCategory:
            createQuoteDto.reportedProblemCategory || null,
          reportedProblemDescription:
            createQuoteDto.reportedProblemDescription || null,
          reportedProblemSymptoms: createQuoteDto.reportedProblemSymptoms || [],
          // Problema identificado pelo mecânico
          identifiedProblemCategory:
            createQuoteDto.identifiedProblemCategory || null,
          identifiedProblemDescription:
            createQuoteDto.identifiedProblemDescription || null,
          identifiedProblemId: createQuoteDto.identifiedProblemId || null,
          // Diagnóstico e observações
          diagnosticNotes: createQuoteDto.diagnosticNotes || null,
          inspectionNotes: createQuoteDto.inspectionNotes || null,
          inspectionPhotos: createQuoteDto.inspectionPhotos || [],
          // Recomendações
          recommendations: createQuoteDto.recommendations || null,
          items: {
            create: createQuoteDto.items.map((item) => ({
              type: item.type,
              serviceId: item.serviceId || null,
              partId: item.partId || null,
              name: item.name,
              description: item.description || null,
              quantity: item.quantity,
              unitCost: item.unitCost,
              totalCost: item.unitCost * item.quantity,
              hours: item.hours || null,
            })),
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              placa: true,
              make: true,
              model: true,
              year: true,
            },
          },
          elevator: {
            select: {
              id: true,
              name: true,
              number: true,
              status: true,
            },
          },
          items: true,
        },
      });

      this.logger.log(`Orçamento criado: ${number}`);

      return this.toResponseDto(quote);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Erro ao criar orçamento: ${getErrorMessage(error)}`);
      throw new BadRequestException('Erro ao criar orçamento');
    }
  }

  /**
   * Lista orçamentos com filtros e paginação
   */
  async findAll(
    tenantId: string,
    filters: QuoteFiltersDto,
  ): Promise<{
    data: QuoteResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      number,
      status,
      customerId,
      vehicleId,
      elevatorId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.QuoteWhereInput = {
      tenantId,
      ...(number && { number: { contains: number, mode: 'insensitive' } }),
      ...(status && { status }),
      ...(customerId && { customerId }),
      ...(vehicleId && { vehicleId }),
      ...(elevatorId && { elevatorId }),
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
      ...(startDate &&
        !endDate && {
          createdAt: { gte: new Date(startDate) },
        }),
      ...(!startDate &&
        endDate && {
          createdAt: { lte: new Date(endDate) },
        }),
    };

    const [quotes, total] = await this.prisma.$transaction([
      this.prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              placa: true,
              make: true,
              model: true,
              year: true,
            },
          },
          elevator: {
            select: {
              id: true,
              name: true,
              number: true,
              status: true,
            },
          },
          items: true,
        },
      }),
      this.prisma.quote.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: quotes.map((quote) => this.toResponseDto(quote)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Busca um orçamento por ID
   */
  async findOne(tenantId: string, id: string): Promise<QuoteResponseDto> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            placa: true,
            make: true,
            model: true,
            year: true,
          },
        },
        elevator: {
          select: {
            id: true,
            name: true,
            number: true,
            status: true,
          },
        },
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    return this.toResponseDto(quote);
  }

  /**
   * Atualiza um orçamento
   */
  async update(
    tenantId: string,
    id: string,
    updateQuoteDto: UpdateQuoteDto,
  ): Promise<QuoteResponseDto> {
    try {
      const existingQuote = await this.prisma.quote.findFirst({
        where: {
          id,
          tenantId,
        },
        include: { items: true },
      });

      if (!existingQuote) {
        throw new NotFoundException('Orçamento não encontrado');
      }

      // Não permitir atualizar orçamento já convertido
      if (existingQuote.status === (QuoteStatus.CONVERTED as string)) {
        throw new BadRequestException(
          'Não é possível atualizar um orçamento já convertido em OS',
        );
      }

      // Preparar dados de atualização
      const updateData: Prisma.QuoteUpdateInput = {};

      if (updateQuoteDto.customerId !== undefined) {
        if (updateQuoteDto.customerId) {
          updateData.customer = { connect: { id: updateQuoteDto.customerId } };
        } else {
          updateData.customer = { disconnect: true };
        }
      }

      if (updateQuoteDto.vehicleId !== undefined) {
        if (updateQuoteDto.vehicleId) {
          updateData.vehicle = { connect: { id: updateQuoteDto.vehicleId } };
        } else {
          updateData.vehicle = { disconnect: true };
        }
      }

      if (updateQuoteDto.elevatorId !== undefined) {
        if (updateQuoteDto.elevatorId) {
          updateData.elevator = { connect: { id: updateQuoteDto.elevatorId } };
        } else {
          updateData.elevator = { disconnect: true };
        }
      }

      if (updateQuoteDto.status !== undefined) {
        updateData.status = updateQuoteDto.status;
      }

      if (updateQuoteDto.laborCost !== undefined) {
        updateData.laborCost = updateQuoteDto.laborCost || null;
      }

      if (updateQuoteDto.partsCost !== undefined) {
        updateData.partsCost = updateQuoteDto.partsCost || null;
      }

      if (updateQuoteDto.discount !== undefined) {
        updateData.discount = updateQuoteDto.discount;
      }

      if (updateQuoteDto.taxAmount !== undefined) {
        updateData.taxAmount = updateQuoteDto.taxAmount;
      }

      if (updateQuoteDto.validUntil !== undefined) {
        updateData.validUntil = updateQuoteDto.validUntil
          ? new Date(updateQuoteDto.validUntil)
          : null;
      }

      // Problema relatado pelo cliente
      if (updateQuoteDto.reportedProblemCategory !== undefined) {
        updateData.reportedProblemCategory =
          updateQuoteDto.reportedProblemCategory || null;
      }
      if (updateQuoteDto.reportedProblemDescription !== undefined) {
        updateData.reportedProblemDescription =
          updateQuoteDto.reportedProblemDescription?.trim() || null;
      }
      if (updateQuoteDto.reportedProblemSymptoms !== undefined) {
        updateData.reportedProblemSymptoms =
          updateQuoteDto.reportedProblemSymptoms || [];
      }

      // Problema identificado pelo mecânico
      if (updateQuoteDto.identifiedProblemCategory !== undefined) {
        updateData.identifiedProblemCategory =
          updateQuoteDto.identifiedProblemCategory || null;
      }
      if (updateQuoteDto.identifiedProblemDescription !== undefined) {
        updateData.identifiedProblemDescription =
          updateQuoteDto.identifiedProblemDescription?.trim() || null;
      }
      if (updateQuoteDto.identifiedProblemId !== undefined) {
        updateData.identifiedProblemId =
          updateQuoteDto.identifiedProblemId || null;
      }

      // Diagnóstico e observações
      if (updateQuoteDto.diagnosticNotes !== undefined) {
        updateData.diagnosticNotes =
          updateQuoteDto.diagnosticNotes?.trim() || null;
      }
      if (updateQuoteDto.inspectionNotes !== undefined) {
        updateData.inspectionNotes =
          updateQuoteDto.inspectionNotes?.trim() || null;
      }
      if (updateQuoteDto.inspectionPhotos !== undefined) {
        updateData.inspectionPhotos = updateQuoteDto.inspectionPhotos || [];
      }

      // Recomendações
      if (updateQuoteDto.recommendations !== undefined) {
        updateData.recommendations =
          updateQuoteDto.recommendations?.trim() || null;
      }

      if (updateQuoteDto.inspectionPhotos !== undefined) {
        updateData.inspectionPhotos = updateQuoteDto.inspectionPhotos;
      }

      // Atualizar itens se fornecido
      if (updateQuoteDto.items && updateQuoteDto.items.length > 0) {
        // Deletar itens antigos
        await this.prisma.quoteItem.deleteMany({
          where: { quoteId: id },
        });

        // Criar novos itens
        updateData.items = {
          create: updateQuoteDto.items.map((item) => ({
            type: item.type,
            serviceId: item.serviceId || null,
            partId: item.partId || null,
            name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            unitCost: item.unitCost,
            totalCost: item.unitCost * item.quantity,
            hours: item.hours || null,
          })),
        };

        // Recalcular total
        const itemsTotal = updateQuoteDto.items.reduce(
          (sum, item) => sum + item.unitCost * item.quantity,
          0,
        );
        const laborCost =
          updateQuoteDto.laborCost ?? existingQuote.laborCost?.toNumber() ?? 0;
        const partsCost =
          updateQuoteDto.partsCost ?? existingQuote.partsCost?.toNumber() ?? 0;
        const discount =
          updateQuoteDto.discount ?? existingQuote.discount?.toNumber() ?? 0;
        const taxAmount =
          updateQuoteDto.taxAmount ?? existingQuote.taxAmount?.toNumber() ?? 0;

        updateData.totalCost =
          itemsTotal + laborCost + partsCost - discount + taxAmount;
      } else {
        // Recalcular total apenas se custos mudaram
        const laborCost =
          updateQuoteDto.laborCost ?? existingQuote.laborCost?.toNumber() ?? 0;
        const partsCost =
          updateQuoteDto.partsCost ?? existingQuote.partsCost?.toNumber() ?? 0;
        const discount =
          updateQuoteDto.discount ?? existingQuote.discount?.toNumber() ?? 0;
        const taxAmount =
          updateQuoteDto.taxAmount ?? existingQuote.taxAmount?.toNumber() ?? 0;
        const itemsTotal = existingQuote.items.reduce(
          (sum, item) => sum + item.totalCost.toNumber(),
          0,
        );

        updateData.totalCost =
          itemsTotal + laborCost + partsCost - discount + taxAmount;
      }

      // Atualizar orçamento
      const updatedQuote = await this.prisma.quote.update({
        where: { id },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              placa: true,
              make: true,
              model: true,
              year: true,
            },
          },
          elevator: {
            select: {
              id: true,
              name: true,
              number: true,
              status: true,
            },
          },
          items: true,
        },
      });

      this.logger.log(`Orçamento atualizado: ${updatedQuote.number}`);

      return this.toResponseDto(updatedQuote);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao atualizar orçamento: ${getErrorMessage(error)}`,
      );
      throw new BadRequestException('Erro ao atualizar orçamento');
    }
  }

  /**
   * Aprova um orçamento e converte em Service Order
   */
  async approve(
    tenantId: string,
    id: string,
    approveQuoteDto: ApproveQuoteDto,
  ): Promise<{ quote: QuoteResponseDto; serviceOrder: unknown }> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        customer: true,
        vehicle: true,
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (quote.status === (QuoteStatus.CONVERTED as string)) {
      throw new BadRequestException('Orçamento já foi convertido em OS');
    }

    if (quote.status === (QuoteStatus.REJECTED as string)) {
      throw new BadRequestException(
        'Não é possível aprovar um orçamento rejeitado',
      );
    }

    if (quote.status === (QuoteStatus.EXPIRED as string)) {
      throw new BadRequestException(
        'Não é possível aprovar um orçamento expirado',
      );
    }

    // Usar elevador do approveDto ou do quote
    const elevatorId = approveQuoteDto.elevatorId || quote.elevatorId;

    // Criar Service Order a partir do orçamento
    const serviceOrder = await this.serviceOrdersService.create(tenantId, {
      customerId: quote.customerId || undefined,
      vehicleVin: quote.vehicle?.vin ? quote.vehicle.vin : undefined,
      vehiclePlaca: quote.vehicle?.placa ? quote.vehicle.placa : undefined,
      vehicleMake: quote.vehicle?.make ? quote.vehicle.make : undefined,
      vehicleModel: quote.vehicle?.model ? quote.vehicle.model : undefined,
      vehicleYear: quote.vehicle?.year ? quote.vehicle.year : undefined,
      vehicleMileage: quote.vehicle?.mileage
        ? quote.vehicle.mileage
        : undefined,
      status: ServiceOrderStatus.SCHEDULED,
      elevatorId: elevatorId || undefined,
      estimatedHours:
        quote.items
          .filter((item) => item.hours)
          .reduce((sum, item) => sum + (item.hours?.toNumber() || 0), 0) ||
        undefined,
      laborCost: quote.laborCost?.toNumber() || undefined,
      partsCost: quote.partsCost?.toNumber() || undefined,
      discount: quote.discount?.toNumber() || undefined,
      notes: quote.inspectionNotes || undefined,
    });

    // Atualizar orçamento como aprovado e convertido
    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
        customerSignature: approveQuoteDto.customerSignature || null,
        convertedAt: new Date(),
        convertedToServiceOrderId: serviceOrder.id,
        serviceOrder: { connect: { id: serviceOrder.id } },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            placa: true,
            make: true,
            model: true,
            year: true,
          },
        },
        elevator: {
          select: {
            id: true,
            name: true,
            number: true,
            status: true,
          },
        },
        items: true,
      },
    });

    // Se elevador foi especificado, reservar
    if (elevatorId) {
      try {
        await this.elevatorsService.reserve(tenantId, elevatorId, {
          serviceOrderId: serviceOrder.id,
          vehicleId: quote.vehicleId || undefined,
          notes: `Reservado para ${quote.number} (aprovado)`,
        });
      } catch (error) {
        this.logger.warn(
          `Não foi possível reservar elevador: ${getErrorMessage(error)}`,
        );
      }
    }

    this.logger.log(
      `Orçamento ${quote.number} aprovado e convertido em OS ${serviceOrder.number}`,
    );

    return {
      quote: this.toResponseDto(updatedQuote),
      serviceOrder,
    };
  }

  /**
   * Remove um orçamento
   */
  async remove(tenantId: string, id: string): Promise<void> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Não permitir remover orçamento convertido
    if (quote.status === (QuoteStatus.CONVERTED as string)) {
      throw new BadRequestException(
        'Não é possível remover um orçamento já convertido em OS',
      );
    }

    await this.prisma.quote.delete({
      where: { id },
    });

    this.logger.log(`Orçamento removido: ${quote.number}`);
  }

  /**
   * Gera PDF do orçamento
   */
  async generatePdf(tenantId: string, id: string): Promise<Buffer> {
    const quote = await this.findOne(tenantId, id);
    return this.quotePdfService.generatePdf(quote);
  }

  /**
   * Converte Prisma Quote para QuoteResponseDto
   */
  private toResponseDto(
    quote: Prisma.QuoteGetPayload<{
      include: {
        customer: {
          select: {
            id: true;
            name: true;
            phone: true;
            email: true;
          };
        };
        vehicle: {
          select: {
            id: true;
            placa: true;
            make: true;
            model: true;
            year: true;
          };
        };
        elevator: {
          select: {
            id: true;
            name: true;
            number: true;
            status: true;
          };
        };
        items: true;
      };
    }>,
  ): QuoteResponseDto {
    return {
      id: quote.id,
      tenantId: quote.tenantId,
      number: quote.number,
      customerId: quote.customerId || undefined,
      customer: quote.customer
        ? {
            id: quote.customer.id,
            name: quote.customer.name,
            phone: quote.customer.phone,
            email: quote.customer.email || undefined,
          }
        : undefined,
      vehicleId: quote.vehicleId || undefined,
      vehicle: quote.vehicle
        ? {
            id: quote.vehicle.id,
            placa: quote.vehicle.placa || undefined,
            make: quote.vehicle.make || undefined,
            model: quote.vehicle.model || undefined,
            year: quote.vehicle.year || undefined,
          }
        : undefined,
      elevatorId: quote.elevatorId || undefined,
      elevator: quote.elevator
        ? {
            id: quote.elevator.id,
            name: quote.elevator.name,
            number: quote.elevator.number,
            status: quote.elevator.status,
          }
        : undefined,
      serviceOrderId: quote.serviceOrderId || undefined,
      status: quote.status as QuoteStatus,
      version: quote.version,
      parentQuoteId: quote.parentQuoteId || undefined,
      laborCost: quote.laborCost?.toNumber() || undefined,
      partsCost: quote.partsCost?.toNumber() || undefined,
      totalCost: quote.totalCost.toNumber(),
      discount: quote.discount.toNumber(),
      taxAmount: quote.taxAmount.toNumber(),
      expiresAt: quote.expiresAt || undefined,
      validUntil: quote.validUntil || undefined,
      sentAt: quote.sentAt || undefined,
      viewedAt: quote.viewedAt || undefined,
      acceptedAt: quote.acceptedAt || undefined,
      rejectedAt: quote.rejectedAt || undefined,
      rejectedReason: quote.rejectedReason || undefined,
      customerSignature: quote.customerSignature || undefined,
      convertedAt: quote.convertedAt || undefined,
      convertedToServiceOrderId: quote.convertedToServiceOrderId || undefined,
      // Problema relatado pelo cliente
      reportedProblemCategory: quote.reportedProblemCategory || undefined,
      reportedProblemDescription: quote.reportedProblemDescription || undefined,
      reportedProblemSymptoms: quote.reportedProblemSymptoms || [],
      // Problema identificado pelo mecânico
      identifiedProblemCategory: quote.identifiedProblemCategory || undefined,
      identifiedProblemDescription:
        quote.identifiedProblemDescription || undefined,
      identifiedProblemId: quote.identifiedProblemId || undefined,
      // Diagnóstico e observações
      diagnosticNotes: quote.diagnosticNotes || undefined,
      inspectionNotes: quote.inspectionNotes || undefined,
      inspectionPhotos: quote.inspectionPhotos || [],
      // Recomendações
      recommendations: quote.recommendations || undefined,
      items: quote.items.map((item) => ({
        id: item.id,
        type: item.type as QuoteItemType,
        serviceId: item.serviceId || undefined,
        partId: item.partId || undefined,
        name: item.name,
        description: item.description || undefined,
        quantity: item.quantity,
        unitCost: item.unitCost.toNumber(),
        totalCost: item.totalCost.toNumber(),
        hours: item.hours?.toNumber() || undefined,
      })),
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
  }
}
