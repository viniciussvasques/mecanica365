import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceResponseDto,
  InvoiceFiltersDto,
  InvoiceStatus,
  PaymentStatus,
  InvoiceType,
} from './dto';
import { Prisma } from '@prisma/client';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Gera número único de fatura para o tenant
   */
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const lastInvoice = await this.prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastInvoice) {
      return 'FAT-001';
    }

    const lastNumber = parseInt(
      lastInvoice.invoiceNumber.replace('FAT-', ''),
      10,
    );
    const nextNumber = lastNumber + 1;
    return `FAT-${nextNumber.toString().padStart(3, '0')}`;
  }

  /**
   * Calcula o total dos itens
   */
  private calculateTotal(items: CreateInvoiceDto['items']): number {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  /**
   * Cria uma nova fatura
   */
  async create(
    tenantId: string,
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    try {
      // Validar cliente se fornecido
      if (createInvoiceDto.customerId) {
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: createInvoiceDto.customerId,
            tenantId,
          },
        });

        if (!customer) {
          throw new NotFoundException('Cliente não encontrado');
        }
      }

      // Validar ordem de serviço se fornecido
      if (createInvoiceDto.serviceOrderId) {
        const serviceOrder = await this.prisma.serviceOrder.findFirst({
          where: {
            id: createInvoiceDto.serviceOrderId,
            tenantId,
          },
        });

        if (!serviceOrder) {
          throw new NotFoundException('Ordem de serviço não encontrada');
        }

        // Verificar se já existe fatura para esta OS
        const existingInvoice = await this.prisma.invoice.findFirst({
          where: {
            tenantId,
            serviceOrderId: createInvoiceDto.serviceOrderId,
          },
        });

        if (existingInvoice) {
          throw new BadRequestException(
            'Já existe uma fatura para esta ordem de serviço',
          );
        }
      }

      // Validar itens
      if (!createInvoiceDto.items || createInvoiceDto.items.length === 0) {
        throw new BadRequestException('A fatura deve ter pelo menos um item');
      }

      // Calcular total se não fornecido
      const calculatedTotal = this.calculateTotal(createInvoiceDto.items);
      const total = createInvoiceDto.total || calculatedTotal;
      const discount = createInvoiceDto.discount || 0;
      const taxAmount = createInvoiceDto.taxAmount || 0;
      const finalTotal = total - discount + taxAmount;

      if (finalTotal < 0) {
        throw new BadRequestException('O valor total não pode ser negativo');
      }

      // Gerar número único se não fornecido
      const invoiceNumber =
        createInvoiceDto.invoiceNumber ||
        (await this.generateInvoiceNumber(tenantId));

      // Verificar se número já existe
      const existingNumber = await this.prisma.invoice.findUnique({
        where: { invoiceNumber },
      });

      if (existingNumber) {
        throw new BadRequestException('Já existe uma fatura com este número');
      }

      // Criar fatura
      const invoice = await this.prisma.invoice.create({
        data: {
          tenantId,
          invoiceNumber,
          serviceOrderId: createInvoiceDto.serviceOrderId || null,
          customerId: createInvoiceDto.customerId || null,
          type: createInvoiceDto.type,
          total: new Decimal(finalTotal),
          discount: new Decimal(discount),
          taxAmount: new Decimal(taxAmount),
          paymentMethod: createInvoiceDto.paymentMethod || null,
          paymentStatus:
            createInvoiceDto.paymentStatus || PaymentStatus.PENDING,
          status: createInvoiceDto.status || InvoiceStatus.DRAFT,
          dueDate: createInvoiceDto.dueDate
            ? new Date(createInvoiceDto.dueDate)
            : null,
          nfeKey: createInvoiceDto.nfeKey || null,
          nfeXmlUrl: createInvoiceDto.nfeXmlUrl || null,
          nfePdfUrl: createInvoiceDto.nfePdfUrl || null,
          nfeStatus: createInvoiceDto.nfeStatus || null,
          items: {
            create: createInvoiceDto.items.map((item) => ({
              type: item.type,
              name: item.name,
              description: item.description || null,
              quantity: item.quantity,
              unitPrice: new Decimal(item.unitPrice),
              totalPrice: new Decimal(item.totalPrice),
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
          serviceOrder: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
          items: true,
        },
      });

      this.logger.log(`Fatura criada: ${invoice.id} (tenant: ${tenantId})`);

      return this.toResponseDto(invoice);
    } catch (error) {
      this.logger.error(
        `Erro ao criar fatura: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Erro ao criar fatura');
    }
  }

  /**
   * Lista faturas com filtros e paginação
   */
  async findAll(
    tenantId: string,
    filters: InvoiceFiltersDto,
  ): Promise<{
    data: InvoiceResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        invoiceNumber,
        customerId,
        serviceOrderId,
        type,
        status,
        paymentStatus,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = filters;

      const skip = (page - 1) * limit;

      const where: Prisma.InvoiceWhereInput = {
        tenantId,
        ...(invoiceNumber && {
          invoiceNumber: { contains: invoiceNumber, mode: 'insensitive' },
        }),
        ...(customerId && { customerId }),
        ...(serviceOrderId && { serviceOrderId }),
        ...(type && { type }),
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
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

      const [invoices, total] = await this.prisma.$transaction([
        this.prisma.invoice.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
            serviceOrder: {
              select: {
                id: true,
                number: true,
                status: true,
              },
            },
            items: true,
          },
        }),
        this.prisma.invoice.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: invoices.map((invoice) => this.toResponseDto(invoice)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao listar faturas: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao listar faturas');
    }
  }

  /**
   * Busca uma fatura por ID
   */
  async findOne(tenantId: string, id: string): Promise<InvoiceResponseDto> {
    try {
      const invoice = await this.prisma.invoice.findFirst({
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
          serviceOrder: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
          items: true,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      return this.toResponseDto(invoice);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar fatura: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Erro ao buscar fatura');
    }
  }

  /**
   * Atualiza uma fatura
   */
  async update(
    tenantId: string,
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      // Não permitir atualizar fatura emitida ou paga
      const invoiceStatus = invoice.status as InvoiceStatus;
      if (
        invoiceStatus === InvoiceStatus.ISSUED ||
        invoiceStatus === InvoiceStatus.PAID
      ) {
        throw new BadRequestException(
          'Não é possível atualizar uma fatura emitida ou paga',
        );
      }

      // Validar cliente se fornecido
      if (updateInvoiceDto.customerId) {
        const customer = await this.prisma.customer.findFirst({
          where: {
            id: updateInvoiceDto.customerId,
            tenantId,
          },
        });

        if (!customer) {
          throw new NotFoundException('Cliente não encontrado');
        }
      }

      // Preparar dados de atualização
      const updateData: Prisma.InvoiceUpdateInput = {};

      if (updateInvoiceDto.customerId !== undefined) {
        if (updateInvoiceDto.customerId) {
          updateData.customer = {
            connect: { id: updateInvoiceDto.customerId },
          };
        } else {
          updateData.customer = { disconnect: true };
        }
      }

      if (updateInvoiceDto.type) {
        updateData.type = updateInvoiceDto.type;
      }

      if (updateInvoiceDto.items) {
        // Deletar itens antigos e criar novos
        await this.prisma.invoiceItem.deleteMany({
          where: { invoiceId: id },
        });

        updateData.items = {
          create: updateInvoiceDto.items.map((item) => ({
            type: item.type,
            name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            totalPrice: new Decimal(item.totalPrice),
          })),
        };

        // Recalcular total
        const calculatedTotal = this.calculateTotal(updateInvoiceDto.items);
        updateData.total = new Decimal(calculatedTotal);
      }

      if (updateInvoiceDto.total !== undefined) {
        updateData.total = new Decimal(updateInvoiceDto.total);
      }

      if (updateInvoiceDto.discount !== undefined) {
        updateData.discount = new Decimal(updateInvoiceDto.discount);
      }

      if (updateInvoiceDto.taxAmount !== undefined) {
        updateData.taxAmount = new Decimal(updateInvoiceDto.taxAmount);
      }

      if (updateInvoiceDto.paymentMethod !== undefined) {
        updateData.paymentMethod = updateInvoiceDto.paymentMethod || null;
      }

      if (updateInvoiceDto.paymentStatus) {
        updateData.paymentStatus = updateInvoiceDto.paymentStatus;
        if (updateInvoiceDto.paymentStatus === PaymentStatus.PAID) {
          updateData.paidAt = new Date();
        }
      }

      if (updateInvoiceDto.status) {
        updateData.status = updateInvoiceDto.status;
        if (updateInvoiceDto.status === InvoiceStatus.ISSUED) {
          updateData.issuedAt = new Date();
        }
      }

      if (updateInvoiceDto.dueDate !== undefined) {
        updateData.dueDate = updateInvoiceDto.dueDate
          ? new Date(updateInvoiceDto.dueDate)
          : null;
      }

      if (updateInvoiceDto.nfeKey !== undefined) {
        updateData.nfeKey = updateInvoiceDto.nfeKey || null;
      }

      if (updateInvoiceDto.nfeXmlUrl !== undefined) {
        updateData.nfeXmlUrl = updateInvoiceDto.nfeXmlUrl || null;
      }

      if (updateInvoiceDto.nfePdfUrl !== undefined) {
        updateData.nfePdfUrl = updateInvoiceDto.nfePdfUrl || null;
      }

      if (updateInvoiceDto.nfeStatus !== undefined) {
        updateData.nfeStatus = updateInvoiceDto.nfeStatus || null;
      }

      // Atualizar fatura
      const updatedInvoice = await this.prisma.invoice.update({
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
          serviceOrder: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
          items: true,
        },
      });

      this.logger.log(`Fatura atualizada: ${id} (tenant: ${tenantId})`);

      return this.toResponseDto(updatedInvoice);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar fatura: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Erro ao atualizar fatura');
    }
  }

  /**
   * Remove uma fatura
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      // Não permitir remover fatura emitida ou paga
      const invoiceStatus = invoice.status as InvoiceStatus;
      if (
        invoiceStatus === InvoiceStatus.ISSUED ||
        invoiceStatus === InvoiceStatus.PAID
      ) {
        throw new BadRequestException(
          'Não é possível remover uma fatura emitida ou paga',
        );
      }

      await this.prisma.invoice.delete({
        where: { id },
      });

      this.logger.log(`Fatura removida: ${id} (tenant: ${tenantId})`);
    } catch (error) {
      this.logger.error(
        `Erro ao remover fatura: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Erro ao remover fatura');
    }
  }

  /**
   * Emite uma fatura (muda status para ISSUED)
   */
  async issue(tenantId: string, id: string): Promise<InvoiceResponseDto> {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      const invoiceStatus = invoice.status as InvoiceStatus;
      if (invoiceStatus === InvoiceStatus.ISSUED) {
        throw new BadRequestException('Fatura já foi emitida');
      }

      if (invoiceStatus === InvoiceStatus.CANCELLED) {
        throw new BadRequestException(
          'Não é possível emitir uma fatura cancelada',
        );
      }

      const updatedInvoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.ISSUED,
          issuedAt: new Date(),
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
          serviceOrder: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
          items: true,
        },
      });

      this.logger.log(`Fatura emitida: ${id} (tenant: ${tenantId})`);

      return this.toResponseDto(updatedInvoice);
    } catch (error) {
      this.logger.error(
        `Erro ao emitir fatura: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Erro ao emitir fatura');
    }
  }

  /**
   * Cancela uma fatura
   */
  async cancel(tenantId: string, id: string): Promise<InvoiceResponseDto> {
    try {
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!invoice) {
        throw new NotFoundException('Fatura não encontrada');
      }

      const invoiceStatus = invoice.status as InvoiceStatus;
      if (invoiceStatus === InvoiceStatus.CANCELLED) {
        throw new BadRequestException('Fatura já está cancelada');
      }

      const paymentStatus = invoice.paymentStatus as PaymentStatus;
      if (paymentStatus === PaymentStatus.PAID) {
        throw new BadRequestException(
          'Não é possível cancelar uma fatura já paga',
        );
      }

      const updatedInvoice = await this.prisma.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.CANCELLED,
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
          serviceOrder: {
            select: {
              id: true,
              number: true,
              status: true,
            },
          },
          items: true,
        },
      });

      this.logger.log(`Fatura cancelada: ${id} (tenant: ${tenantId})`);

      return this.toResponseDto(updatedInvoice);
    } catch (error) {
      this.logger.error(
        `Erro ao cancelar fatura: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Erro ao cancelar fatura');
    }
  }

  /**
   * Converte Invoice do Prisma para InvoiceResponseDto
   */
  private toResponseDto(invoice: {
    id: string;
    tenantId: string;
    invoiceNumber: string;
    serviceOrderId?: string | null;
    customerId?: string | null;
    type: string;
    total: Decimal | number;
    discount: Decimal | number;
    taxAmount: Decimal | number;
    nfeKey?: string | null;
    nfeXmlUrl?: string | null;
    nfePdfUrl?: string | null;
    nfeStatus?: string | null;
    paymentMethod?: string | null;
    paymentStatus: string;
    paidAt?: Date | null;
    status: string;
    issuedAt?: Date | null;
    dueDate?: Date | null;
    createdAt: Date;
    updatedAt: Date;
    customer?: {
      id: string;
      name: string;
      phone: string;
      email?: string | null;
    } | null;
    serviceOrder?: {
      id: string;
      number: string;
      status: string;
    } | null;
    items: Array<{
      id: string;
      type: string;
      name: string;
      description?: string | null;
      quantity: number;
      unitPrice: Decimal | number;
      totalPrice: Decimal | number;
    }>;
  }): InvoiceResponseDto {
    return {
      id: invoice.id,
      tenantId: invoice.tenantId,
      invoiceNumber: invoice.invoiceNumber,
      serviceOrderId: invoice.serviceOrderId || undefined,
      customerId: invoice.customerId || undefined,
      customer: invoice.customer
        ? {
            id: invoice.customer.id,
            name: invoice.customer.name,
            phone: invoice.customer.phone,
            email: invoice.customer.email || undefined,
          }
        : undefined,
      serviceOrder: invoice.serviceOrder
        ? {
            id: invoice.serviceOrder.id,
            number: invoice.serviceOrder.number,
            status: invoice.serviceOrder.status,
          }
        : undefined,
      type: invoice.type as InvoiceType,
      total:
        typeof invoice.total === 'object' && 'toNumber' in invoice.total
          ? invoice.total.toNumber()
          : Number(invoice.total),
      discount:
        typeof invoice.discount === 'object' && 'toNumber' in invoice.discount
          ? invoice.discount.toNumber()
          : Number(invoice.discount),
      taxAmount:
        typeof invoice.taxAmount === 'object' && 'toNumber' in invoice.taxAmount
          ? invoice.taxAmount.toNumber()
          : Number(invoice.taxAmount),
      nfeKey: invoice.nfeKey || undefined,
      nfeXmlUrl: invoice.nfeXmlUrl || undefined,
      nfePdfUrl: invoice.nfePdfUrl || undefined,
      nfeStatus: invoice.nfeStatus || undefined,
      paymentMethod: invoice.paymentMethod || undefined,
      paymentStatus: invoice.paymentStatus as PaymentStatus,
      paidAt: invoice.paidAt || undefined,
      status: invoice.status as InvoiceStatus,
      issuedAt: invoice.issuedAt || undefined,
      dueDate: invoice.dueDate || undefined,
      items: invoice.items.map((item) => ({
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description || undefined,
        quantity: item.quantity,
        unitPrice:
          typeof item.unitPrice === 'object' && 'toNumber' in item.unitPrice
            ? item.unitPrice.toNumber()
            : Number(item.unitPrice),
        totalPrice:
          typeof item.totalPrice === 'object' && 'toNumber' in item.totalPrice
            ? item.totalPrice.toNumber()
            : Number(item.totalPrice),
      })),
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }
}
