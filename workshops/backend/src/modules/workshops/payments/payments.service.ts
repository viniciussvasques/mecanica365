import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreatePaymentDto,
  UpdatePaymentDto,
  PaymentResponseDto,
  PaymentFiltersDto,
  PaymentStatus,
  PaymentMethod,
} from './dto';
import { Prisma } from '@prisma/client';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo pagamento
   */
  async create(
    tenantId: string,
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    try {
      // Validar fatura se fornecido
      if (createPaymentDto.invoiceId) {
        const invoice = await this.prisma.invoice.findFirst({
          where: {
            id: createPaymentDto.invoiceId,
            tenantId,
          },
        });

        if (!invoice) {
          throw new NotFoundException('Fatura não encontrada');
        }

        // Verificar se o valor do pagamento não excede o valor da fatura
        const invoiceTotal = Number(invoice.total);
        const existingPayments = await this.prisma.payment.findMany({
          where: {
            invoiceId: createPaymentDto.invoiceId,
            status: { not: PaymentStatus.REFUNDED },
          },
        });

        const totalPaid = existingPayments.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0,
        );

        if (totalPaid + createPaymentDto.amount > invoiceTotal) {
          throw new BadRequestException(
            'O valor do pagamento excede o valor da fatura',
          );
        }
      }

      // Criar pagamento
      const payment = await this.prisma.payment.create({
        data: {
          tenantId,
          invoiceId: createPaymentDto.invoiceId || null,
          amount: new Decimal(createPaymentDto.amount),
          method: createPaymentDto.method,
          status: createPaymentDto.status || PaymentStatus.PENDING,
          transactionId: createPaymentDto.transactionId || null,
          installments: createPaymentDto.installments || 1,
          notes: createPaymentDto.notes || null,
          paidAt:
            createPaymentDto.status &&
            String(createPaymentDto.status) === PaymentStatus.COMPLETED
              ? new Date()
              : null,
        },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              status: true,
            },
          },
        },
      });

      // Se o pagamento foi completado e há fatura, atualizar status da fatura
      if (
        payment.invoiceId &&
        String(payment.status) === PaymentStatus.COMPLETED
      ) {
        await this.updateInvoicePaymentStatus(tenantId, payment.invoiceId);
      }

      this.logger.log(`Pagamento criado: ${payment.id} (tenant: ${tenantId})`);

      return this.toResponseDto(payment);
    } catch (error) {
      this.logger.error(
        `Erro ao criar pagamento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Erro ao criar pagamento');
    }
  }

  /**
   * Atualiza o status de pagamento da fatura baseado nos pagamentos
   */
  private async updateInvoicePaymentStatus(
    tenantId: string,
    invoiceId: string,
  ): Promise<void> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        tenantId,
      },
      include: {
        payments: {
          where: {
            status: { not: PaymentStatus.REFUNDED },
          },
        },
      },
    });

    if (!invoice) {
      return;
    }

    const invoiceTotal = Number(invoice.total);
    const totalPaid = invoice.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0,
    );

    let paymentStatus: string;
    if (totalPaid >= invoiceTotal) {
      paymentStatus = 'paid';
    } else if (totalPaid > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        paymentStatus,
        paidAt: paymentStatus === 'paid' ? new Date() : invoice.paidAt,
      },
    });
  }

  /**
   * Lista pagamentos com filtros e paginação
   */
  async findAll(
    tenantId: string,
    filters: PaymentFiltersDto,
  ): Promise<{
    data: PaymentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        invoiceId,
        method,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = filters;

      const skip = (page - 1) * limit;

      const where: Prisma.PaymentWhereInput = {
        tenantId,
        ...(invoiceId && { invoiceId }),
        ...(method && { method }),
        ...(status && { status }),
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

      const [payments, total] = await this.prisma.$transaction([
        this.prisma.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                total: true,
                status: true,
              },
            },
          },
        }),
        this.prisma.payment.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: payments.map((payment) => this.toResponseDto(payment)),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao listar pagamentos: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao listar pagamentos');
    }
  }

  /**
   * Busca um pagamento por ID
   */
  async findOne(tenantId: string, id: string): Promise<PaymentResponseDto> {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              status: true,
            },
          },
        },
      });

      if (!payment) {
        throw new NotFoundException('Pagamento não encontrado');
      }

      return this.toResponseDto(payment);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar pagamento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException('Erro ao buscar pagamento');
    }
  }

  /**
   * Atualiza um pagamento
   */
  async update(
    tenantId: string,
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<PaymentResponseDto> {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!payment) {
        throw new NotFoundException('Pagamento não encontrado');
      }

      // Não permitir atualizar pagamento reembolsado
      if (String(payment.status) === PaymentStatus.REFUNDED) {
        throw new BadRequestException(
          'Não é possível atualizar um pagamento reembolsado',
        );
      }

      // Preparar dados de atualização
      const updateData: Prisma.PaymentUpdateInput = {};

      if (updatePaymentDto.amount !== undefined) {
        updateData.amount = new Decimal(updatePaymentDto.amount);
      }

      if (updatePaymentDto.method) {
        updateData.method = updatePaymentDto.method;
      }

      if (updatePaymentDto.status) {
        updateData.status = updatePaymentDto.status;
        if (String(updatePaymentDto.status) === PaymentStatus.COMPLETED) {
          updateData.paidAt = new Date();
        } else {
          updateData.paidAt = null;
        }
      }

      if (updatePaymentDto.transactionId !== undefined) {
        updateData.transactionId = updatePaymentDto.transactionId || null;
      }

      if (updatePaymentDto.installments !== undefined) {
        updateData.installments = updatePaymentDto.installments;
      }

      if (updatePaymentDto.notes !== undefined) {
        updateData.notes = updatePaymentDto.notes || null;
      }

      // Atualizar pagamento
      const updatedPayment = await this.prisma.payment.update({
        where: { id },
        data: updateData,
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
              total: true,
              status: true,
            },
          },
        },
      });

      // Se o pagamento foi completado e há fatura, atualizar status da fatura
      if (
        updatedPayment.invoiceId &&
        String(updatedPayment.status) === PaymentStatus.COMPLETED
      ) {
        await this.updateInvoicePaymentStatus(
          tenantId,
          updatedPayment.invoiceId,
        );
      }

      this.logger.log(`Pagamento atualizado: ${id} (tenant: ${tenantId})`);

      return this.toResponseDto(updatedPayment);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar pagamento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Erro ao atualizar pagamento');
    }
  }

  /**
   * Remove um pagamento
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!payment) {
        throw new NotFoundException('Pagamento não encontrado');
      }

      // Não permitir remover pagamento completo ou reembolsado
      if (
        String(payment.status) === PaymentStatus.COMPLETED ||
        String(payment.status) === PaymentStatus.REFUNDED
      ) {
        throw new BadRequestException(
          'Não é possível remover um pagamento completo ou reembolsado',
        );
      }

      await this.prisma.payment.delete({
        where: { id },
      });

      // Se havia fatura, atualizar status
      if (payment.invoiceId) {
        await this.updateInvoicePaymentStatus(tenantId, payment.invoiceId);
      }

      this.logger.log(`Pagamento removido: ${id} (tenant: ${tenantId})`);
    } catch (error) {
      this.logger.error(
        `Erro ao remover pagamento: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new BadRequestException('Erro ao remover pagamento');
    }
  }

  /**
   * Converte Payment do Prisma para PaymentResponseDto
   */
  private toResponseDto(payment: {
    id: string;
    tenantId: string;
    invoiceId?: string | null;
    amount: Decimal | number;
    method: string;
    status: string;
    paidAt?: Date | null;
    transactionId?: string | null;
    installments: number;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
    invoice?: {
      id: string;
      invoiceNumber: string;
      total: Decimal | number;
      status: string;
    } | null;
  }): PaymentResponseDto {
    return {
      id: payment.id,
      tenantId: payment.tenantId,
      invoiceId: payment.invoiceId || undefined,
      invoice: payment.invoice
        ? {
            id: payment.invoice.id,
            invoiceNumber: payment.invoice.invoiceNumber,
            total:
              typeof payment.invoice.total === 'object' &&
              'toNumber' in payment.invoice.total
                ? payment.invoice.total.toNumber()
                : Number(payment.invoice.total),
            status: payment.invoice.status,
          }
        : undefined,
      amount:
        typeof payment.amount === 'object' && 'toNumber' in payment.amount
          ? payment.amount.toNumber()
          : Number(payment.amount),
      method: payment.method as PaymentMethod,
      status: payment.status as PaymentStatus,
      paidAt: payment.paidAt || undefined,
      transactionId: payment.transactionId || undefined,
      installments: payment.installments,
      notes: payment.notes || undefined,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
