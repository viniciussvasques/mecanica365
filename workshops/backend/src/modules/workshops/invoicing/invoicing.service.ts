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
  PaymentPreference,
} from './dto';
import { PaymentGatewayType } from '../payment-gateways/dto/payment-gateway-types.enum';
import { Prisma } from '@prisma/client';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly invoiceInclude: Prisma.InvoiceInclude = {
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
    paymentGateway: {
      select: {
        id: true,
        name: true,
        type: true,
      },
    },
    items: true,
  };

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

    const lastNumber = Number.parseInt(
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

  private getPreferenceForGateway(
    gateway: { type: string } | null,
  ): PaymentPreference {
    if (!gateway) {
      return PaymentPreference.MANUAL;
    }

    const gatewayType = gateway.type as PaymentGatewayType;

    return gatewayType === PaymentGatewayType.PHYSICAL_TERMINAL
      ? PaymentPreference.POS_TERMINAL
      : PaymentPreference.ONLINE_GATEWAY;
  }

  private resolvePaymentPreference(
    requested: PaymentPreference | undefined,
    gateway: { type: string } | null,
  ): PaymentPreference {
    if (requested === PaymentPreference.MANUAL) {
      return PaymentPreference.MANUAL;
    }

    if (requested && !gateway) {
      throw new BadRequestException(
        'Selecione um gateway para esta preferência de pagamento',
      );
    }

    if (requested && gateway) {
      const inferred = this.getPreferenceForGateway(gateway);
      if (requested !== inferred) {
        throw new BadRequestException(
          'O gateway selecionado não suporta esta preferência',
        );
      }
      return requested;
    }

    if (gateway) {
      return this.getPreferenceForGateway(gateway);
    }

    return PaymentPreference.MANUAL;
  }

  private async validateGatewayOwnership(tenantId: string, gatewayId?: string) {
    if (!gatewayId) {
      return null;
    }

    const gateway = await this.prisma.paymentGateway.findFirst({
      where: { id: gatewayId, tenantId, isActive: true },
    });

    if (!gateway) {
      throw new NotFoundException('Gateway de pagamento não encontrado');
    }

    return gateway;
  }

  /**
   * Valida se a fatura pode ser atualizada
   */
  private validateInvoiceCanBeUpdated(invoice: { status: string }): void {
    const invoiceStatus = invoice.status as InvoiceStatus;
    if (
      invoiceStatus === InvoiceStatus.ISSUED ||
      invoiceStatus === InvoiceStatus.PAID
    ) {
      throw new BadRequestException(
        'Não é possível atualizar uma fatura emitida ou paga',
      );
    }
  }

  /**
   * Valida cliente se fornecido
   */
  private async validateCustomerIfProvided(
    tenantId: string,
    customerId?: string,
  ): Promise<void> {
    if (!customerId) {
      return;
    }

    const customer = await this.prisma.customer.findFirst({
      where: {
        id: customerId,
        tenantId,
      },
    });

    if (!customer) {
      throw new NotFoundException('Cliente não encontrado');
    }
  }

  /**
   * Prepara dados de atualização de itens da fatura
   */
  private async prepareInvoiceItemsUpdate(
    invoiceId: string,
    items?: UpdateInvoiceDto['items'],
  ): Promise<Prisma.InvoiceUpdateInput['items'] | undefined> {
    if (!items) {
      return undefined;
    }

    // Deletar itens antigos e criar novos
    await this.prisma.invoiceItem.deleteMany({
      where: { invoiceId },
    });

    return {
      create: items.map((item) => ({
        type: item.type,
        name: item.name,
        description: item.description || null,
        quantity: item.quantity,
        unitPrice: new Decimal(item.unitPrice),
        totalPrice: new Decimal(item.totalPrice),
      })),
    };
  }

  /**
   * Prepara dados de atualização de valores monetários
   */
  private prepareMonetaryUpdateData(
    updateInvoiceDto: UpdateInvoiceDto,
  ): Partial<Prisma.InvoiceUpdateInput> {
    const updateData: Partial<Prisma.InvoiceUpdateInput> = {};

    if (updateInvoiceDto.total !== undefined) {
      updateData.total = new Decimal(updateInvoiceDto.total);
    }

    if (updateInvoiceDto.discount !== undefined) {
      updateData.discount = new Decimal(updateInvoiceDto.discount);
    }

    if (updateInvoiceDto.taxAmount !== undefined) {
      updateData.taxAmount = new Decimal(updateInvoiceDto.taxAmount);
    }

    return updateData;
  }

  /**
   * Prepara dados de atualização de status e pagamento
   */
  private prepareStatusAndPaymentUpdateData(
    updateInvoiceDto: UpdateInvoiceDto,
  ): Partial<Prisma.InvoiceUpdateInput> {
    const updateData: Partial<Prisma.InvoiceUpdateInput> = {};

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

    return updateData;
  }

  /**
   * Prepara dados de atualização de NFE
   */
  private prepareNfeUpdateData(
    updateInvoiceDto: UpdateInvoiceDto,
  ): Partial<Prisma.InvoiceUpdateInput> {
    const updateData: Partial<Prisma.InvoiceUpdateInput> = {};

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

    return updateData;
  }

  /**
   * Prepara dados de atualização da fatura
   */
  private async prepareInvoiceUpdateData(
    invoiceId: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Prisma.InvoiceUpdateInput> {
    const updateData: Prisma.InvoiceUpdateInput = {};

    // Cliente
    if (updateInvoiceDto.customerId !== undefined) {
      if (updateInvoiceDto.customerId) {
        updateData.customer = {
          connect: { id: updateInvoiceDto.customerId },
        };
      } else {
        updateData.customer = { disconnect: true };
      }
    }

    // Tipo
    if (updateInvoiceDto.type) {
      updateData.type = updateInvoiceDto.type;
    }

    // Itens
    if (updateInvoiceDto.items) {
      const itemsUpdate = await this.prepareInvoiceItemsUpdate(
        invoiceId,
        updateInvoiceDto.items,
      );
      if (itemsUpdate) {
        updateData.items = itemsUpdate;
        const calculatedTotal = this.calculateTotal(updateInvoiceDto.items);
        updateData.total = new Decimal(calculatedTotal);
      }
    }

    // Valores monetários
    Object.assign(updateData, this.prepareMonetaryUpdateData(updateInvoiceDto));

    // Status e pagamento
    Object.assign(
      updateData,
      this.prepareStatusAndPaymentUpdateData(updateInvoiceDto),
    );

    // NFE
    Object.assign(updateData, this.prepareNfeUpdateData(updateInvoiceDto));

    return updateData;
  }

  /**
   * Cria uma nova fatura
   */
  async create(
    tenantId: string,
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<InvoiceResponseDto> {
    try {
      await this.validateCreateInvoiceData(tenantId, createInvoiceDto);
      const invoiceNumber = await this.resolveInvoiceNumber(
        tenantId,
        createInvoiceDto.invoiceNumber,
      );
      const { finalTotal, discount, taxAmount } =
        this.calculateInvoiceTotals(createInvoiceDto);
      const { gateway, paymentPreference } =
        await this.resolvePaymentConfiguration(
          tenantId,
          createInvoiceDto,
        );

      const invoice = await this.createInvoiceRecord(
        tenantId,
        createInvoiceDto,
        invoiceNumber,
        finalTotal,
        discount,
        taxAmount,
        gateway,
        paymentPreference,
      );

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

  private async validateCreateInvoiceData(
    tenantId: string,
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<void> {
    if (createInvoiceDto.customerId) {
      await this.validateCustomerIfProvided(
        tenantId,
        createInvoiceDto.customerId,
      );
    }

    if (createInvoiceDto.serviceOrderId) {
      await this.validateServiceOrder(tenantId, createInvoiceDto.serviceOrderId);
    }

    if (!createInvoiceDto.items || createInvoiceDto.items.length === 0) {
      throw new BadRequestException('A fatura deve ter pelo menos um item');
    }

    if (
      createInvoiceDto.paymentPreference === PaymentPreference.MANUAL &&
      createInvoiceDto.paymentGatewayId
    ) {
      throw new BadRequestException(
        'Selecione um gateway apenas para pagamentos online ou com maquininha',
      );
    }
  }

  private async validateServiceOrder(
    tenantId: string,
    serviceOrderId: string,
  ): Promise<void> {
    const serviceOrder = await this.prisma.serviceOrder.findFirst({
      where: {
        id: serviceOrderId,
        tenantId,
      },
    });

    if (!serviceOrder) {
      throw new NotFoundException('Ordem de serviço não encontrada');
    }

    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        tenantId,
        serviceOrderId,
      },
    });

    if (existingInvoice) {
      throw new BadRequestException(
        'Já existe uma fatura para esta ordem de serviço',
      );
    }
  }

  private calculateInvoiceTotals(createInvoiceDto: CreateInvoiceDto): {
    finalTotal: number;
    discount: number;
    taxAmount: number;
  } {
    const calculatedTotal = this.calculateTotal(createInvoiceDto.items);
    const total = createInvoiceDto.total || calculatedTotal;
    const discount = createInvoiceDto.discount || 0;
    const taxAmount = createInvoiceDto.taxAmount || 0;
    const finalTotal = total - discount + taxAmount;

    if (finalTotal < 0) {
      throw new BadRequestException('O valor total não pode ser negativo');
    }

    return { finalTotal, discount, taxAmount };
  }

  private async resolveInvoiceNumber(
    tenantId: string,
    providedNumber?: string,
  ): Promise<string> {
    const invoiceNumber =
      providedNumber || (await this.generateInvoiceNumber(tenantId));

    const existingNumber = await this.prisma.invoice.findUnique({
      where: { invoiceNumber },
    });

    if (existingNumber) {
      throw new BadRequestException('Já existe uma fatura com este número');
    }

    return invoiceNumber;
  }

  private async resolvePaymentConfiguration(
    tenantId: string,
    createInvoiceDto: CreateInvoiceDto,
  ): Promise<{
    gateway: { id: string; type: string } | null;
    paymentPreference: PaymentPreference;
  }> {
    const gateway = await this.validateGatewayOwnership(
      tenantId,
      createInvoiceDto.paymentGatewayId,
    );

    const paymentPreference = this.resolvePaymentPreference(
      createInvoiceDto.paymentPreference,
      gateway,
    );

    return { gateway, paymentPreference };
  }

  private async createInvoiceRecord(
    tenantId: string,
    createInvoiceDto: CreateInvoiceDto,
    invoiceNumber: string,
    finalTotal: number,
    discount: number,
    taxAmount: number,
    gateway: { id: string; type: string } | null,
    paymentPreference: PaymentPreference,
  ) {
    return this.prisma.invoice.create({
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
        paymentPreference,
        paymentGatewayId: gateway?.id || null,
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
      include: this.invoiceInclude,
    });
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
          include: this.invoiceInclude,
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
        include: this.invoiceInclude,
      });

      if (invoice === null) {
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
      const invoice = await this.findInvoiceForUpdate(tenantId, id);
      await this.validateCustomerIfProvided(
        tenantId,
        updateInvoiceDto.customerId,
      );

      const updateData = await this.prepareInvoiceUpdateData(
        id,
        updateInvoiceDto,
      );

      await this.resolvePaymentGatewayUpdate(
        tenantId,
        invoice,
        updateInvoiceDto,
        updateData,
      );

      const updatedInvoice = await this.prisma.invoice.update({
        where: { id },
        data: updateData,
        include: this.invoiceInclude,
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

  private async findInvoiceForUpdate(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Fatura não encontrada');
    }

    this.validateInvoiceCanBeUpdated(invoice);
    return invoice;
  }

  private async resolvePaymentGatewayUpdate(
    tenantId: string,
    invoice: { paymentGatewayId: string | null },
    updateInvoiceDto: UpdateInvoiceDto,
    updateData: Prisma.InvoiceUpdateInput,
  ): Promise<void> {
    this.validatePaymentPreferenceAndGateway(updateInvoiceDto);

    const gatewayConfig = this.determineGatewayConfiguration(
      invoice,
      updateInvoiceDto,
    );

    if (
      updateInvoiceDto.paymentPreference !== undefined ||
      gatewayConfig.shouldUpdate
    ) {
      const gatewayEntity = gatewayConfig.targetGatewayId
        ? await this.validateGatewayOwnership(
            tenantId,
            gatewayConfig.targetGatewayId,
          )
        : null;

      const resolvedPreference = this.resolvePaymentPreference(
        updateInvoiceDto.paymentPreference,
        gatewayEntity,
      );

      updateData.paymentPreference = resolvedPreference;

      if (resolvedPreference === PaymentPreference.MANUAL) {
        gatewayConfig.targetGatewayId = null;
      } else if (gatewayEntity) {
        gatewayConfig.targetGatewayId = gatewayEntity.id;
      }

      if (gatewayConfig.shouldUpdate) {
        updateData.paymentGateway = gatewayConfig.targetGatewayId
          ? { connect: { id: gatewayConfig.targetGatewayId } }
          : { disconnect: true };
      }
    }
  }

  private validatePaymentPreferenceAndGateway(
    updateInvoiceDto: UpdateInvoiceDto,
  ): void {
    if (
      updateInvoiceDto.paymentPreference === PaymentPreference.MANUAL &&
      updateInvoiceDto.paymentGatewayId
    ) {
      throw new BadRequestException(
        'Não selecione um gateway ao usar pagamento manual',
      );
    }
  }

  private determineGatewayConfiguration(
    invoice: { paymentGatewayId: string | null },
    updateInvoiceDto: UpdateInvoiceDto,
  ): {
    shouldUpdate: boolean;
    targetGatewayId: string | null;
  } {
    let targetGatewayId =
      invoice.paymentGatewayId !== null ? invoice.paymentGatewayId : null;
    let shouldUpdate = false;

    if (updateInvoiceDto.paymentGatewayId !== undefined) {
      shouldUpdate = true;
      targetGatewayId = updateInvoiceDto.paymentGatewayId || null;
    }

    if (updateInvoiceDto.paymentPreference === PaymentPreference.MANUAL) {
      shouldUpdate = true;
      targetGatewayId = null;
    }

    return { shouldUpdate, targetGatewayId };
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

      if (invoice === null) {
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

      if (invoice === null) {
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
        include: this.invoiceInclude,
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

      if (invoice === null) {
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
        include: this.invoiceInclude,
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
    paymentPreference?: string | null;
    paymentGatewayId?: string | null;
    paymentGateway?: {
      id: string;
      name: string;
      type: string;
    } | null;
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
      paymentPreference: invoice.paymentPreference
        ? (invoice.paymentPreference as PaymentPreference)
        : undefined,
      paymentGatewayId: invoice.paymentGatewayId || undefined,
      paymentGateway: invoice.paymentGateway
        ? {
            id: invoice.paymentGateway.id,
            name: invoice.paymentGateway.name,
            type: invoice.paymentGateway.type,
          }
        : undefined,
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
