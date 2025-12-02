import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { randomBytes } from 'crypto';
import {
  CreateQuoteDto,
  UpdateQuoteDto,
  QuoteResponseDto,
  QuoteFiltersDto,
  ApproveQuoteDto,
  CompleteDiagnosisDto,
  AssignMechanicDto,
  QuoteStatus,
  QuoteItemDto,
  QuoteItemType,
} from './dto';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';
import { ElevatorsService } from '../elevators/elevators.service';
import { ServiceOrdersService } from '../service-orders/service-orders.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { ServiceOrderStatus } from '../service-orders/dto/service-order-status.enum';
import { AppointmentStatus } from '../appointments/dto';
import { AttachmentsService } from '../attachments/attachments.service';
import { ChecklistsService } from '../checklists/checklists.service';
import { ChecklistType, ChecklistEntityType } from '../checklists/dto';
import { QuotePdfService } from './pdf/quote-pdf.service';
import {
  NotificationsService,
  NotificationType,
} from '@core/notifications/notifications.service';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly elevatorsService: ElevatorsService,
    private readonly serviceOrdersService: ServiceOrdersService,
    private readonly appointmentsService: AppointmentsService,
    private readonly attachmentsService: AttachmentsService,
    private readonly checklistsService: ChecklistsService,
    private readonly quotePdfService: QuotePdfService,
    private readonly notificationsService: NotificationsService,
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

      // Validar itens - só é obrigatório se não for rascunho
      const status: QuoteStatus = createQuoteDto.status || QuoteStatus.DRAFT;
      const isDraft = status === QuoteStatus.DRAFT;
      if (
        !isDraft &&
        (!createQuoteDto.items || createQuoteDto.items.length === 0)
      ) {
        throw new BadRequestException('Orçamento deve ter pelo menos um item');
      }

      // Calcular custos
      const items = createQuoteDto.items || [];
      const laborCost = createQuoteDto.laborCost || 0;
      const partsCost = createQuoteDto.partsCost || 0;
      const discount = createQuoteDto.discount || 0;
      const taxAmount = createQuoteDto.taxAmount || 0;

      const totalCost = this.calculateTotalCost(
        items,
        laborCost,
        partsCost,
        discount,
        taxAmount,
      );

      // Gerar número único
      const number = await this.generateQuoteNumber(tenantId);

      // Preparar dados de criação
      const createData: Prisma.QuoteCreateInput = {
        tenant: { connect: { id: tenantId } },
        number,
        customer: createQuoteDto.customerId
          ? { connect: { id: createQuoteDto.customerId } }
          : undefined,
        vehicle: createQuoteDto.vehicleId
          ? { connect: { id: createQuoteDto.vehicleId } }
          : undefined,
        elevator: createQuoteDto.elevatorId
          ? { connect: { id: createQuoteDto.elevatorId } }
          : undefined,
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
        reportedProblemCategory: createQuoteDto.reportedProblemCategory || null,
        reportedProblemDescription:
          createQuoteDto.reportedProblemDescription || null,
        reportedProblemSymptoms: createQuoteDto.reportedProblemSymptoms || [],
        // Problema identificado pelo mecânico
        identifiedProblemCategory:
          createQuoteDto.identifiedProblemCategory || null,
        identifiedProblemDescription:
          createQuoteDto.identifiedProblemDescription || null,
        identifiedProblem: createQuoteDto.identifiedProblemId
          ? { connect: { id: createQuoteDto.identifiedProblemId } }
          : undefined,
        // Diagnóstico e observações
        diagnosticNotes: createQuoteDto.diagnosticNotes || null,
        inspectionNotes: createQuoteDto.inspectionNotes || null,
        inspectionPhotos: createQuoteDto.inspectionPhotos || [],
        // Recomendações
        recommendations: createQuoteDto.recommendations || null,
        items:
          items.length > 0
            ? {
                create: items.map((item) => ({
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
              }
            : undefined,
      };

      // Criar orçamento com itens
      const quote = await this.prisma.quote.create({
        data: createData,
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
          assignedMechanic: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: true,
        },
      });

      this.logger.log(`Orçamento criado: ${number}`);

      // Criar checklist pré-diagnóstico automaticamente
      try {
        await this.checklistsService.create(tenantId, {
          entityType: ChecklistEntityType.QUOTE,
          entityId: quote.id,
          checklistType: ChecklistType.PRE_DIAGNOSIS,
          name: 'Checklist Pré-Diagnóstico',
          description: 'Checklist para verificação inicial do veículo',
          items: [
            {
              title: 'Verificar nível de óleo',
              description: 'Verificar se o nível está entre mínimo e máximo',
              isRequired: true,
              order: 0,
            },
            {
              title: 'Verificar nível de água/refrigerante',
              description: 'Verificar nível do reservatório',
              isRequired: true,
              order: 1,
            },
            {
              title: 'Verificar estado dos pneus',
              description: 'Verificar pressão e desgaste',
              isRequired: false,
              order: 2,
            },
            {
              title: 'Verificar sistema de freios',
              description: 'Verificar pastilhas e fluido de freio',
              isRequired: true,
              order: 3,
            },
            {
              title: 'Verificar bateria',
              description: 'Verificar carga e terminais',
              isRequired: false,
              order: 4,
            },
          ],
        });
        this.logger.log(
          `Checklist pré-diagnóstico criado automaticamente para orçamento ${number}`,
        );
      } catch (error) {
        this.logger.warn(
          `Não foi possível criar checklist pré-diagnóstico: ${getErrorMessage(error)}`,
        );
        // Não falha a criação do orçamento se o checklist não puder ser criado
      }

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

    try {
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
            assignedMechanic: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: true,
          },
        }),
        this.prisma.quote.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: quotes.map((quote) => {
          try {
            return this.toResponseDto(quote);
          } catch (error) {
            this.logger.error(
              `Erro ao converter orçamento ${quote.id} para DTO: ${getErrorMessage(error)}`,
              getErrorStack(error),
            );
            throw error;
          }
        }),
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar/processar orçamentos: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao processar orçamentos');
    }
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    const responseDto = this.toResponseDto(quote);

    // Enriquecer com attachments e checklists
    const relations = await this.enrichQuoteWithRelations(tenantId, quote.id);
    responseDto.attachments = relations.attachments;
    responseDto.checklists = relations.checklists;

    return responseDto;
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
      const existingQuoteStatus = existingQuote.status as QuoteStatus;
      if (existingQuoteStatus === QuoteStatus.CONVERTED) {
        throw new BadRequestException(
          'Não é possível atualizar um orçamento já convertido em OS',
        );
      }

      // Bloquear edição de itens/valores se status for DRAFT ou AWAITING_DIAGNOSIS
      const currentStatus = existingQuote.status as QuoteStatus;
      const isBlockedStatus =
        currentStatus === QuoteStatus.DRAFT ||
        currentStatus === QuoteStatus.AWAITING_DIAGNOSIS;

      if (isBlockedStatus) {
        // Não permitir adicionar/editar itens antes do diagnóstico
        if (updateQuoteDto.items && updateQuoteDto.items.length > 0) {
          throw new BadRequestException(
            'Não é possível adicionar itens antes do diagnóstico do mecânico. Envie o orçamento para diagnóstico primeiro.',
          );
        }

        // Não permitir editar custos antes do diagnóstico
        if (
          updateQuoteDto.laborCost !== undefined ||
          updateQuoteDto.partsCost !== undefined ||
          updateQuoteDto.discount !== undefined ||
          updateQuoteDto.taxAmount !== undefined
        ) {
          throw new BadRequestException(
            'Não é possível editar custos antes do diagnóstico do mecânico. Envie o orçamento para diagnóstico primeiro.',
          );
        }
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
        if (updateQuoteDto.identifiedProblemId) {
          updateData.identifiedProblem = {
            connect: { id: updateQuoteDto.identifiedProblemId },
          };
        } else {
          updateData.identifiedProblem = { disconnect: true };
        }
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
          assignedMechanic: {
            select: {
              id: true,
              name: true,
              email: true,
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
    try {
      const quote = await this.prisma.quote.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          customer: true,
          vehicle: true,
          assignedMechanic: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: true,
        },
      });

      if (!quote) {
        throw new NotFoundException('Orçamento não encontrado');
      }

      const quoteStatus = quote.status as QuoteStatus;
      if (quoteStatus === QuoteStatus.CONVERTED) {
        throw new BadRequestException('Orçamento já foi convertido em OS');
      }

      if (quoteStatus === QuoteStatus.REJECTED) {
        throw new BadRequestException(
          'Não é possível aprovar um orçamento rejeitado',
        );
      }

      if (quoteStatus === QuoteStatus.EXPIRED) {
        throw new BadRequestException(
          'Não é possível aprovar um orçamento expirado',
        );
      }

      // Buscar estimatedHours separadamente
      const quoteWithEstimatedHours = await this.prisma.quote.findUnique({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        select: { estimatedHours: true } as any, // Cast necessário pois Prisma não reconhece o campo no tipo
      });

      // Usar elevador do approveDto ou do quote
      const elevatorId = approveQuoteDto.elevatorId || quote.elevatorId;

      // Criar Service Order a partir do orçamento
      const createServiceOrderData: {
        customerId?: string;
        vehiclePlaca?: string;
        vehicleMake?: string;
        vehicleModel?: string;
        vehicleYear?: number;
        vehicleMileage?: number;
        status: ServiceOrderStatus;
        elevatorId?: string;
        estimatedHours?: number;
        laborCost?: number;
        partsCost?: number;
        discount?: number;
        notes?: string;
      } = {
        status: ServiceOrderStatus.SCHEDULED,
      };

      if (quote.customerId) {
        createServiceOrderData.customerId = quote.customerId;
      }

      if (quote.vehicle) {
        if (quote.vehicle.placa) {
          createServiceOrderData.vehiclePlaca = quote.vehicle.placa;
        }
        if (quote.vehicle.make) {
          createServiceOrderData.vehicleMake = quote.vehicle.make;
        }
        if (quote.vehicle.model) {
          createServiceOrderData.vehicleModel = quote.vehicle.model;
        }
        if (quote.vehicle.year) {
          createServiceOrderData.vehicleYear = quote.vehicle.year;
        }
        if (quote.vehicle.mileage) {
          createServiceOrderData.vehicleMileage = quote.vehicle.mileage;
        }
      }

      if (elevatorId) {
        createServiceOrderData.elevatorId = elevatorId;
      }

      // Usar tempo estimado do diagnóstico se existir, senão calcular dos itens
      if (
        quoteWithEstimatedHours?.estimatedHours &&
        typeof quoteWithEstimatedHours.estimatedHours === 'object' &&
        'toNumber' in quoteWithEstimatedHours.estimatedHours
      ) {
        const estimatedHours = quoteWithEstimatedHours.estimatedHours as {
          toNumber: () => number;
        };
        createServiceOrderData.estimatedHours = estimatedHours.toNumber();
      } else {
        const totalHours = quote.items
          .filter((item) => item.hours)
          .reduce((sum, item) => sum + (item.hours?.toNumber() || 0), 0);
        if (totalHours > 0) {
          createServiceOrderData.estimatedHours = totalHours;
        }
      }

      if (quote.laborCost) {
        createServiceOrderData.laborCost = quote.laborCost.toNumber();
      }

      if (quote.partsCost) {
        createServiceOrderData.partsCost = quote.partsCost.toNumber();
      }

      if (quote.discount) {
        createServiceOrderData.discount = quote.discount.toNumber();
      }

      if (quote.inspectionNotes) {
        createServiceOrderData.notes = quote.inspectionNotes;
      }

      const serviceOrder = await this.serviceOrdersService.create(
        tenantId,
        createServiceOrderData,
      );

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
          assignedMechanic: {
            select: {
              id: true,
              name: true,
              email: true,
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

      // Criar agendamento automaticamente
      try {
        // Usar data padrão: amanhã às 9h (UTC)
        const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        appointmentDate.setUTCHours(9, 0, 0, 0); // Usar UTC para evitar problemas de timezone

        this.logger.log(
          `Tentando criar agendamento para OS ${serviceOrder.number} na data: ${appointmentDate.toISOString()}`,
        );

        await this.appointmentsService.create(tenantId, {
          customerId: quote.customerId || undefined,
          serviceOrderId: serviceOrder.id,
          assignedToId: quote.assignedMechanicId || undefined,
          date: appointmentDate.toISOString(),
          duration: createServiceOrderData.estimatedHours
            ? Math.ceil(createServiceOrderData.estimatedHours * 60)
            : 60,
          serviceType: 'Serviço aprovado',
          notes: `Agendamento automático para OS ${serviceOrder.number}`,
          status: AppointmentStatus.SCHEDULED,
        });

        this.logger.log(
          `✅ Agendamento criado automaticamente para OS ${serviceOrder.number}`,
        );
      } catch (error) {
        this.logger.error(
          `❌ Não foi possível criar agendamento automaticamente para OS ${serviceOrder.number}: ${getErrorMessage(error)}`,
          getErrorStack(error),
        );
        // Não falha a aprovação se o agendamento não puder ser criado
      }

      this.logger.log(
        `Orçamento ${quote.number} aprovado e convertido em OS ${serviceOrder.number}`,
      );

      return {
        quote: this.toResponseDto(updatedQuote),
        serviceOrder,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao aprovar orçamento ${id}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Erro ao aprovar orçamento: ${getErrorMessage(error)}`,
      );
    }
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
    const quoteStatus = quote.status as QuoteStatus;
    if (quoteStatus === QuoteStatus.CONVERTED) {
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
   * Envia orçamento para diagnóstico do mecânico
   */
  async sendForDiagnosis(
    tenantId: string,
    id: string,
  ): Promise<QuoteResponseDto> {
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Validar que o status é DRAFT
    const quoteStatus = quote.status as QuoteStatus;
    if (quoteStatus !== QuoteStatus.DRAFT) {
      throw new BadRequestException(
        'Apenas orçamentos em rascunho podem ser enviados para diagnóstico',
      );
    }

    // Validar campos obrigatórios
    if (!quote.customerId) {
      throw new BadRequestException(
        'Cliente é obrigatório para enviar para diagnóstico',
      );
    }

    if (!quote.vehicleId) {
      throw new BadRequestException(
        'Veículo é obrigatório para enviar para diagnóstico',
      );
    }

    if (
      !quote.reportedProblemCategory ||
      !quote.reportedProblemSymptoms ||
      quote.reportedProblemSymptoms.length === 0
    ) {
      throw new BadRequestException(
        'Categoria do problema e pelo menos um sintoma são obrigatórios para enviar para diagnóstico',
      );
    }

    // Notificar todos os mecânicos sobre novo orçamento disponível
    await this.notificationsService.notifyAllMechanics(
      tenantId,
      NotificationType.QUOTE_AVAILABLE,
      'Novo Orçamento Disponível',
      `Orçamento ${quote.number} está aguardando diagnóstico`,
      { quoteId: id, quoteNumber: quote.number },
    );

    // Atualizar status para AWAITING_DIAGNOSIS
    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.AWAITING_DIAGNOSIS,
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    this.logger.log(
      `Orçamento ${quote.number} enviado para diagnóstico do mecânico`,
    );

    return this.toResponseDto(updatedQuote);
  }

  /**
   * Completa o diagnóstico do mecânico
   */
  async completeDiagnosis(
    tenantId: string,
    id: string,
    completeDiagnosisDto: CompleteDiagnosisDto,
  ): Promise<QuoteResponseDto> {
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
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Validar que o status é AWAITING_DIAGNOSIS
    const quoteStatus = quote.status as QuoteStatus;
    if (quoteStatus !== QuoteStatus.AWAITING_DIAGNOSIS) {
      throw new BadRequestException(
        'Apenas orçamentos aguardando diagnóstico podem ter o diagnóstico concluído',
      );
    }

    // Preparar dados de atualização
    const updateData: Prisma.QuoteUpdateInput = {
      status: QuoteStatus.DIAGNOSED,
    };

    if (completeDiagnosisDto.identifiedProblemCategory !== undefined) {
      updateData.identifiedProblemCategory =
        completeDiagnosisDto.identifiedProblemCategory || null;
    }

    if (completeDiagnosisDto.identifiedProblemDescription !== undefined) {
      updateData.identifiedProblemDescription =
        completeDiagnosisDto.identifiedProblemDescription?.trim() || null;
    }

    if (completeDiagnosisDto.identifiedProblemId !== undefined) {
      if (completeDiagnosisDto.identifiedProblemId) {
        updateData.identifiedProblem = {
          connect: { id: completeDiagnosisDto.identifiedProblemId },
        };
      } else {
        updateData.identifiedProblem = { disconnect: true };
      }
    }

    if (completeDiagnosisDto.recommendations !== undefined) {
      updateData.recommendations =
        completeDiagnosisDto.recommendations?.trim() || null;
    }

    if (completeDiagnosisDto.diagnosticNotes !== undefined) {
      updateData.diagnosticNotes =
        completeDiagnosisDto.diagnosticNotes?.trim() || null;
    }

    if (completeDiagnosisDto.estimatedHours !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updateData as any).estimatedHours =
        completeDiagnosisDto.estimatedHours !== null &&
        completeDiagnosisDto.estimatedHours !== undefined
          ? new Decimal(completeDiagnosisDto.estimatedHours)
          : null;
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    // Notificar atendentes sobre diagnóstico concluído
    // Buscar todos os receptionists ativos do tenant e notificar cada um
    try {
      const receptionists = await this.prisma.user.findMany({
        where: {
          tenantId,
          role: 'receptionist',
          isActive: true,
        },
        select: { id: true },
      });

      // Notificar cada receptionist individualmente
      for (const receptionist of receptionists) {
        await this.notificationsService.create({
          tenantId,
          userId: receptionist.id,
          type: NotificationType.QUOTE_DIAGNOSIS_COMPLETED,
          title: '🔔 Diagnóstico Concluído',
          message: `Orçamento ${quote.number} foi diagnosticado e está pronto para preenchimento`,
          data: {
            quoteId: id,
            quoteNumber: quote.number,
            mechanicId: quote.assignedMechanicId,
          },
        });
      }

      // Se não houver receptionists, criar notificação geral (fallback)
      if (receptionists.length === 0) {
        await this.notificationsService.create({
          tenantId,
          type: NotificationType.QUOTE_DIAGNOSIS_COMPLETED,
          title: '🔔 Diagnóstico Concluído',
          message: `Orçamento ${quote.number} foi diagnosticado e está pronto para preenchimento`,
          data: {
            quoteId: id,
            quoteNumber: quote.number,
            mechanicId: quote.assignedMechanicId,
          },
        });
      }
    } catch (notificationError) {
      this.logger.warn(
        `Erro ao criar notificações para receptionists: ${getErrorMessage(notificationError)}`,
      );
    }

    this.logger.log(
      `Diagnóstico do orçamento ${quote.number} concluído pelo mecânico`,
    );

    return this.toResponseDto(updatedQuote);
  }

  /**
   * Envia orçamento ao cliente (muda status para SENT)
   */
  async sendToCustomer(
    tenantId: string,
    id: string,
  ): Promise<QuoteResponseDto> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Validar que o orçamento tem itens
    if (!quote.items || quote.items.length === 0) {
      throw new BadRequestException(
        'Não é possível enviar orçamento sem itens. Adicione itens antes de enviar.',
      );
    }

    // Validar status - só pode enviar se estiver DIAGNOSED ou SENT
    const currentStatus = quote.status as QuoteStatus;
    if (
      currentStatus !== QuoteStatus.DIAGNOSED &&
      currentStatus !== QuoteStatus.SENT
    ) {
      throw new BadRequestException(
        `Não é possível enviar orçamento com status ${currentStatus}. O orçamento deve estar diagnosticado.`,
      );
    }

    // Gerar token público se não existir ou regenerar
    const publicToken = this.generatePublicToken();

    // Atualizar status para SENT e definir sentAt
    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.SENT,
        sentAt: new Date(),
        publicToken: publicToken,
        publicTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    this.logger.log(`Orçamento ${quote.number} enviado ao cliente`);

    return this.toResponseDto(updatedQuote);
  }

  /**
   * Gera token único para acesso público ao orçamento
   */
  private generatePublicToken(): string {
    return randomBytes(32).toString('base64url');
  }

  /**
   * Busca orçamento por token público (para visualização pública)
   */
  async findByPublicToken(
    token: string,
  ): Promise<QuoteResponseDto & { tenantName?: string }> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        publicToken: token,
        publicTokenExpiresAt: {
          gt: new Date(), // Token ainda não expirou
        },
      },
      include: {
        tenant: {
          select: {
            name: true,
          },
        },
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Token inválido ou expirado');
    }

    // Registrar visualização se ainda não foi visualizado
    if (!quote.viewedAt) {
      await this.prisma.quote.update({
        where: { id: quote.id },
        data: {
          viewedAt: new Date(),
          // Atualizar status para VIEWED se ainda não foi visualizado e está em SENT ou DIAGNOSED
          status:
            (quote.status as QuoteStatus) === QuoteStatus.SENT ||
            (quote.status as QuoteStatus) === QuoteStatus.DIAGNOSED
              ? QuoteStatus.VIEWED
              : quote.status,
        },
      });
      // Atualizar o objeto quote para refletir a mudança
      quote.viewedAt = new Date();
      const currentQuoteStatus = quote.status as QuoteStatus;
      quote.status =
        currentQuoteStatus === QuoteStatus.SENT ||
        currentQuoteStatus === QuoteStatus.DIAGNOSED
          ? QuoteStatus.VIEWED
          : quote.status;
    }

    const response = this.toResponseDto(quote);

    // Buscar configurações da oficina
    const workshopSettings = await this.prisma.workshopSettings.findUnique({
      where: { tenantId: quote.tenantId },
    });

    // Adicionar nome do tenant e configurações para exibição
    return {
      ...response,
      tenantName: workshopSettings?.displayName || quote.tenant?.name,
      workshopSettings: workshopSettings
        ? {
            displayName: workshopSettings.displayName,
            logoUrl: workshopSettings.logoUrl,
            primaryColor: workshopSettings.primaryColor,
            secondaryColor: workshopSettings.secondaryColor,
            accentColor: workshopSettings.accentColor,
            phone: workshopSettings.phone,
            email: workshopSettings.email,
            whatsapp: workshopSettings.whatsapp,
            address: workshopSettings.address,
            city: workshopSettings.city,
            state: workshopSettings.state,
            zipCode: workshopSettings.zipCode,
            showLogoOnQuotes: workshopSettings.showLogoOnQuotes,
            showAddressOnQuotes: workshopSettings.showAddressOnQuotes,
            showContactOnQuotes: workshopSettings.showContactOnQuotes,
            quoteFooterText: workshopSettings.quoteFooterText || undefined,
          }
        : undefined,
    } as QuoteResponseDto & { tenantName?: string; workshopSettings?: unknown };
  }

  /**
   * Aprova orçamento via token público (cliente aprova pelo link)
   * Cria automaticamente a Service Order quando aprovado
   */
  async approveByPublicToken(
    token: string,
    customerSignature: string,
  ): Promise<QuoteResponseDto> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        publicToken: token,
        publicTokenExpiresAt: {
          gt: new Date(),
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
            mileage: true,
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Token inválido ou expirado');
    }

    // Validar status - permitir aprovar se foi enviado, visualizado ou diagnosticado
    const allowedStatuses = [
      QuoteStatus.SENT,
      QuoteStatus.VIEWED,
      QuoteStatus.DIAGNOSED,
    ];
    if (!allowedStatuses.includes(quote.status as QuoteStatus)) {
      throw new BadRequestException(
        `Este orçamento não pode ser aprovado. Status atual: ${quote.status}. Status permitidos: ${allowedStatuses.join(', ')}`,
      );
    }

    // Verificar se já foi aprovado
    if (quote.acceptedAt || quote.serviceOrderId) {
      throw new BadRequestException(
        'Este orçamento já foi aprovado e convertido',
      );
    }

    // Criar Service Order automaticamente
    let serviceOrder;
    try {
      serviceOrder = await this.serviceOrdersService.create(quote.tenantId, {
        customerId: quote.customerId || undefined,
        vehiclePlaca: quote.vehicle?.placa ? quote.vehicle.placa : undefined,
        vehicleMake: quote.vehicle?.make ? quote.vehicle.make : undefined,
        vehicleModel: quote.vehicle?.model ? quote.vehicle.model : undefined,
        vehicleYear: quote.vehicle?.year ? quote.vehicle.year : undefined,
        vehicleMileage: quote.vehicle?.mileage
          ? quote.vehicle.mileage
          : undefined,
        status: ServiceOrderStatus.SCHEDULED,
        elevatorId: quote.elevatorId || undefined,
        technicianId: quote.assignedMechanicId || undefined, // Atribuir ao mecânico se houver
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

      this.logger.log(
        `Service Order ${serviceOrder.number} criada automaticamente para o orçamento ${quote.number}`,
      );
    } catch (serviceOrderError) {
      this.logger.error(
        `Erro ao criar Service Order para orçamento ${quote.number}: ${getErrorMessage(serviceOrderError)}`,
      );
      throw new BadRequestException(
        'Erro ao criar ordem de serviço. Tente novamente ou entre em contato com a oficina.',
      );
    }

    // Atualizar status para ACCEPTED e vincular Service Order
    const updatedQuote = await this.prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
        customerSignature: customerSignature,
        approvalMethod: 'digital',
        viewedAt: quote.viewedAt || new Date(),
        serviceOrderId: serviceOrder.id,
        convertedAt: new Date(),
        convertedToServiceOrderId: serviceOrder.id,
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    // Se elevador foi especificado, reservar
    if (quote.elevatorId) {
      try {
        await this.elevatorsService.reserve(quote.tenantId, quote.elevatorId, {
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

    // Criar agendamento automaticamente
    try {
      // Usar data padrão: amanhã às 9h (UTC)
      const appointmentDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      appointmentDate.setUTCHours(9, 0, 0, 0); // Usar UTC para evitar problemas de timezone

      this.logger.log(
        `Tentando criar agendamento para OS ${serviceOrder.number} na data: ${appointmentDate.toISOString()}`,
      );

      await this.appointmentsService.create(quote.tenantId, {
        customerId: quote.customerId || undefined,
        serviceOrderId: serviceOrder.id,
        assignedToId: quote.assignedMechanicId || undefined,
        date: appointmentDate.toISOString(),
        duration:
          quote.items
            .filter((item) => item.hours)
            .reduce((sum, item) => sum + (item.hours?.toNumber() || 0), 0) > 0
            ? Math.ceil(
                quote.items
                  .filter((item) => item.hours)
                  .reduce(
                    (sum, item) => sum + (item.hours?.toNumber() || 0),
                    0,
                  ) * 60,
              )
            : 60,
        serviceType: 'Serviço aprovado',
        notes: `Agendamento automático para OS ${serviceOrder.number}`,
        status: AppointmentStatus.SCHEDULED,
      });

      this.logger.log(
        `✅ Agendamento criado automaticamente para OS ${serviceOrder.number}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Não foi possível criar agendamento automaticamente para OS ${serviceOrder.number}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      // Não falha a aprovação se o agendamento não puder ser criado
    }

    // Notificar atendentes sobre aprovação
    try {
      const receptionists = await this.prisma.user.findMany({
        where: {
          tenantId: quote.tenantId,
          role: 'receptionist',
          isActive: true,
        },
        select: { id: true },
      });

      for (const receptionist of receptionists) {
        await this.notificationsService.create({
          tenantId: quote.tenantId,
          userId: receptionist.id,
          type: NotificationType.QUOTE_APPROVED,
          title: '✅ Orçamento Aprovado pelo Cliente',
          message: `Orçamento ${quote.number} foi aprovado digitalmente e a OS ${serviceOrder.number} foi criada automaticamente`,
          data: {
            quoteId: quote.id,
            quoteNumber: quote.number,
            serviceOrderId: serviceOrder.id,
            serviceOrderNumber: serviceOrder.number,
            approvalMethod: 'digital',
          },
        });
      }
    } catch (notificationError) {
      this.logger.warn(
        `Erro ao criar notificação de aprovação: ${getErrorMessage(notificationError)}`,
      );
    }

    // Notificar mecânico atribuído (se houver) sobre a nova OS
    if (quote.assignedMechanicId) {
      try {
        await this.notificationsService.create({
          tenantId: quote.tenantId,
          userId: quote.assignedMechanicId,
          type: NotificationType.SERVICE_ORDER_STARTED,
          title: '🛠️ Nova Ordem de Serviço Criada',
          message: `Ordem de Serviço ${serviceOrder.number} foi criada a partir do orçamento ${quote.number} aprovado pelo cliente`,
          data: {
            serviceOrderId: serviceOrder.id,
            serviceOrderNumber: serviceOrder.number,
            quoteId: quote.id,
            quoteNumber: quote.number,
          },
        });
        this.logger.log(
          `Notificação enviada ao mecânico ${quote.assignedMechanicId} sobre a OS ${serviceOrder.number}`,
        );
      } catch (notificationError) {
        this.logger.warn(
          `Erro ao notificar mecânico sobre OS: ${getErrorMessage(notificationError)}`,
        );
      }
    } else {
      // Se não houver mecânico atribuído, notificar todos os mecânicos
      try {
        await this.notificationsService.notifyAllMechanics(
          quote.tenantId,
          NotificationType.SERVICE_ORDER_STARTED,
          '🛠️ Nova Ordem de Serviço Disponível',
          `Ordem de Serviço ${serviceOrder.number} foi criada a partir do orçamento ${quote.number} aprovado pelo cliente`,
          {
            serviceOrderId: serviceOrder.id,
            serviceOrderNumber: serviceOrder.number,
            quoteId: quote.id,
            quoteNumber: quote.number,
          },
        );
        this.logger.log(
          `Notificação enviada a todos os mecânicos sobre a OS ${serviceOrder.number}`,
        );
      } catch (notificationError) {
        this.logger.warn(
          `Erro ao notificar mecânicos sobre OS: ${getErrorMessage(notificationError)}`,
        );
      }
    }

    this.logger.log(
      `Orçamento ${quote.number} aprovado digitalmente pelo cliente via token público e OS ${serviceOrder.number} criada automaticamente`,
    );

    return this.toResponseDto(updatedQuote);
  }

  /**
   * Rejeita orçamento via token público
   */
  async rejectByPublicToken(
    token: string,
    reason?: string,
  ): Promise<QuoteResponseDto> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        publicToken: token,
        publicTokenExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Token inválido ou expirado');
    }

    // Validar status
    const quoteStatus = quote.status as QuoteStatus;
    if (
      quoteStatus !== QuoteStatus.SENT &&
      quoteStatus !== QuoteStatus.VIEWED
    ) {
      throw new BadRequestException(
        'Este orçamento não pode ser rejeitado. Status inválido.',
      );
    }

    // Atualizar status para REJECTED
    const updatedQuote = await this.prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: QuoteStatus.REJECTED,
        rejectedAt: new Date(),
        rejectedReason: reason || 'Cliente rejeitou via link público',
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    // Notificar atendentes sobre rejeição
    try {
      const receptionists = await this.prisma.user.findMany({
        where: {
          tenantId: quote.tenantId,
          role: 'receptionist',
          isActive: true,
        },
        select: { id: true },
      });

      for (const receptionist of receptionists) {
        await this.notificationsService.create({
          tenantId: quote.tenantId,
          userId: receptionist.id,
          type: NotificationType.QUOTE_REJECTED,
          title: '❌ Orçamento Rejeitado pelo Cliente',
          message: `Orçamento ${quote.number} foi rejeitado pelo cliente${reason ? `: ${reason}` : ''}`,
          data: {
            quoteId: quote.id,
            quoteNumber: quote.number,
            reason: reason,
          },
        });
      }
    } catch (notificationError) {
      this.logger.warn(
        `Erro ao criar notificação de rejeição: ${getErrorMessage(notificationError)}`,
      );
    }

    this.logger.log(
      `Orçamento ${quote.number} rejeitado pelo cliente via token público`,
    );

    return this.toResponseDto(updatedQuote);
  }

  /**
   * Aprova orçamento manualmente (atendente marca como aprovado após assinatura física)
   */
  async approveManually(
    tenantId: string,
    id: string,
    customerSignature?: string,
    notes?: string,
  ): Promise<{ quote: QuoteResponseDto; serviceOrder: unknown }> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        items: true,
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
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Validar status
    const quoteStatus = quote.status as QuoteStatus;
    if (
      quoteStatus !== QuoteStatus.SENT &&
      quoteStatus !== QuoteStatus.VIEWED
    ) {
      throw new BadRequestException(
        'Apenas orçamentos enviados podem ser aprovados manualmente',
      );
    }

    // Verificar se já foi aprovado
    if (quote.acceptedAt) {
      throw new BadRequestException('Este orçamento já foi aprovado');
    }

    // Criar Service Order
    const serviceOrder = await this.serviceOrdersService.create(tenantId, {
      customerId: quote.customerId || undefined,
      vehiclePlaca: quote.vehicle?.placa ? quote.vehicle.placa : undefined,
      vehicleMake: quote.vehicle?.make ? quote.vehicle.make : undefined,
      vehicleModel: quote.vehicle?.model ? quote.vehicle.model : undefined,
      vehicleYear: quote.vehicle?.year ? quote.vehicle.year : undefined,
      status: ServiceOrderStatus.SCHEDULED,
      elevatorId: quote.elevatorId || undefined,
      estimatedHours:
        quote.items
          .filter((item) => item.hours)
          .reduce((sum, item) => sum + (item.hours?.toNumber() || 0), 0) ||
        undefined,
      laborCost: quote.laborCost?.toNumber() || undefined,
      partsCost: quote.partsCost?.toNumber() || undefined,
      discount: quote.discount?.toNumber() || undefined,
      notes: notes || quote.inspectionNotes || undefined,
    });

    // Atualizar orçamento
    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        status: QuoteStatus.ACCEPTED,
        acceptedAt: new Date(),
        customerSignature: customerSignature || quote.customerSignature,
        approvalMethod: 'manual',
        serviceOrderId: serviceOrder.id,
        convertedAt: new Date(),
        convertedToServiceOrderId: serviceOrder.id,
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    this.logger.log(
      `Orçamento ${quote.number} aprovado manualmente e Service Order ${serviceOrder.number} criada`,
    );

    return {
      quote: this.toResponseDto(updatedQuote),
      serviceOrder,
    };
  }

  /**
   * Regenera token público do orçamento
   */
  async regeneratePublicToken(
    tenantId: string,
    id: string,
  ): Promise<QuoteResponseDto> {
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Gerar novo token
    const newToken = this.generatePublicToken();

    // Atualizar token e expiração
    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        publicToken: newToken,
        publicTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    this.logger.log(
      `Token público regenerado para o orçamento ${quote.number}`,
    );

    return this.toResponseDto(updatedQuote);
  }

  /**
   * Atribui um mecânico ao orçamento
   */
  async assignMechanic(
    tenantId: string,
    quoteId: string,
    assignMechanicDto: AssignMechanicDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<QuoteResponseDto> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Determinar qual mecânico atribuir
    let mechanicId = assignMechanicDto.mechanicId;

    // Se não fornecido, usar o usuário atual (se for mecânico)
    if (!mechanicId) {
      if (currentUserRole === 'mechanic') {
        mechanicId = currentUserId;
      } else {
        throw new BadRequestException(
          'ID do mecânico é obrigatório ou você deve ser um mecânico para auto-atribuição',
        );
      }
    }

    // Validar que o mecânico existe e é do tenant
    const mechanic = await this.prisma.user.findFirst({
      where: {
        id: mechanicId,
        tenantId,
        role: 'mechanic',
        isActive: true,
      },
    });

    if (!mechanic) {
      throw new NotFoundException('Mecânico não encontrado ou inativo');
    }

    // Validar permissões
    // Se já está atribuído, apenas o mecânico atribuído ou admin/manager podem reatribuir
    if (
      quote.assignedMechanicId &&
      quote.assignedMechanicId !== mechanicId &&
      currentUserRole !== 'admin' &&
      currentUserRole !== 'manager'
    ) {
      if (quote.assignedMechanicId !== currentUserId) {
        throw new BadRequestException(
          'Orçamento já está atribuído a outro mecânico. Apenas admin/manager podem reatribuir.',
        );
      }
    }

    // Registrar histórico de atribuição anterior (se houver)
    if (quote.assignedMechanicId && quote.assignedMechanicId !== mechanicId) {
      // Marcar atribuição anterior como desatribuída
      await this.prisma.quoteAssignmentHistory.updateMany({
        where: {
          quoteId,
          mechanicId: quote.assignedMechanicId,
          unassignedAt: null,
        },
        data: {
          unassignedAt: new Date(),
          reason: 'Reatribuído',
        },
      });
    }

    // Criar registro de histórico
    await this.prisma.quoteAssignmentHistory.create({
      data: {
        quoteId,
        mechanicId,
        assignedBy: currentUserId,
        reason: assignMechanicDto.reason || 'Atribuição manual',
      },
    });

    // Atualizar orçamento
    const updateData: Prisma.QuoteUpdateInput = {
      assignedMechanic: {
        connect: { id: mechanicId },
      },
      assignedAt: new Date(),
    };

    // Se status for DRAFT, mudar para AWAITING_DIAGNOSIS
    const quoteStatus = quote.status as QuoteStatus;
    if (quoteStatus === QuoteStatus.DRAFT) {
      updateData.status = QuoteStatus.AWAITING_DIAGNOSIS;
    }

    const updatedQuote = await this.prisma.quote.update({
      where: { id: quoteId },
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    // Notificar o mecânico atribuído
    await this.notificationsService.create({
      tenantId,
      userId: mechanicId,
      type: NotificationType.QUOTE_ASSIGNED,
      title: 'Orçamento Atribuído',
      message: `Orçamento ${quote.number} foi atribuído a você para diagnóstico`,
      data: { quoteId, quoteNumber: quote.number },
    });

    this.logger.log(
      `Orçamento ${quote.number} atribuído ao mecânico ${mechanic.name} (${mechanicId})`,
    );

    return this.toResponseDto(updatedQuote);
  }

  /**
   * Balanceia orçamentos disponíveis entre mecânicos (round-robin)
   */
  async balanceQuoteAssignments(
    tenantId: string,
    quoteId: string,
  ): Promise<QuoteResponseDto> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
        tenantId,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    if (quote.assignedMechanicId) {
      throw new BadRequestException('Orçamento já está atribuído');
    }

    // Buscar mecânicos ativos
    const mechanics = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: 'mechanic',
        isActive: true,
      },
      include: {
        assignedQuotes: {
          where: {
            status: QuoteStatus.AWAITING_DIAGNOSIS,
          },
        },
      },
      orderBy: {
        assignedQuotes: {
          _count: 'asc',
        },
      },
    });

    if (mechanics.length === 0) {
      throw new BadRequestException('Nenhum mecânico ativo encontrado');
    }

    // Selecionar mecânico com menos orçamentos atribuídos
    const selectedMechanic = mechanics[0];

    // Atribuir usando o método existente
    return this.assignMechanic(
      tenantId,
      quoteId,
      { mechanicId: selectedMechanic.id, reason: 'Balanceamento automático' },
      'system', // Sistema fazendo a atribuição
      'admin',
    );
  }

  /**
   * Busca histórico de atribuições de um orçamento
   */
  async getAssignmentHistory(
    tenantId: string,
    quoteId: string,
  ): Promise<unknown[]> {
    const quote = await this.prisma.quote.findFirst({
      where: {
        id: quoteId,
        tenantId,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    const history = await this.prisma.quoteAssignmentHistory.findMany({
      where: {
        quoteId,
      },
      include: {
        mechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return history;
  }

  /**
   * Gera PDF do orçamento
   */
  async generatePdf(tenantId: string, id: string): Promise<Buffer> {
    const quote = await this.findOne(tenantId, id);

    // Buscar workshop settings para incluir no PDF
    const workshopSettings = await this.prisma.workshopSettings.findUnique({
      where: { tenantId },
    });

    return this.quotePdfService.generatePdf(quote, workshopSettings);
  }

  /**
   * Converte Prisma Quote para QuoteResponseDto
   */
  private toResponseDto(quote: {
    id: string;
    tenantId: string;
    number: string;
    customerId: string | null;
    customer?: {
      id: string;
      name: string;
      phone: string;
      email: string | null;
    } | null;
    vehicleId: string | null;
    vehicle?: {
      id: string;
      placa: string | null;
      make: string | null;
      model: string | null;
      year: number | null;
    } | null;
    elevatorId: string | null;
    elevator?: {
      id: string;
      name: string;
      number: string;
      status: string;
    } | null;
    serviceOrderId: string | null;
    status: string;
    version: number;
    parentQuoteId: string | null;
    laborCost?: { toNumber: () => number } | null;
    partsCost?: { toNumber: () => number } | null;
    totalCost?: { toNumber: () => number } | null;
    discount?: { toNumber: () => number } | null;
    taxAmount?: { toNumber: () => number } | null;
    expiresAt: Date | null;
    validUntil: Date | null;
    sentAt: Date | null;
    viewedAt: Date | null;
    acceptedAt: Date | null;
    rejectedAt: Date | null;
    rejectedReason: string | null;
    customerSignature: string | null;
    approvalMethod: string | null;
    publicToken: string | null;
    publicTokenExpiresAt: Date | null;
    convertedAt: Date | null;
    convertedToServiceOrderId: string | null;
    reportedProblemCategory: string | null;
    reportedProblemDescription: string | null;
    reportedProblemSymptoms: string[];
    identifiedProblemCategory: string | null;
    identifiedProblemDescription: string | null;
    identifiedProblemId: string | null;
    diagnosticNotes: string | null;
    inspectionNotes: string | null;
    inspectionPhotos: string[];
    recommendations: string | null;
    estimatedHours?: { toNumber: () => number } | null;
    assignedMechanicId: string | null;
    assignedAt: Date | null;
    assignedMechanic?: { id: string; name: string; email: string } | null;
    items: Array<{
      id: string;
      type: string;
      serviceId: string | null;
      partId: string | null;
      name: string;
      description: string | null;
      quantity: number;
      unitCost?: { toNumber: () => number } | null;
      totalCost?: { toNumber: () => number } | null;
      hours?: { toNumber: () => number } | null;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): QuoteResponseDto {
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
      totalCost: quote.totalCost?.toNumber() ?? 0,
      discount: quote.discount?.toNumber() ?? 0,
      taxAmount: quote.taxAmount?.toNumber() ?? 0,
      expiresAt: quote.expiresAt || undefined,
      validUntil: quote.validUntil || undefined,
      sentAt: quote.sentAt || undefined,
      viewedAt: quote.viewedAt || undefined,
      acceptedAt: quote.acceptedAt || undefined,
      rejectedAt: quote.rejectedAt || undefined,
      rejectedReason: quote.rejectedReason || undefined,
      customerSignature: quote.customerSignature || undefined,
      approvalMethod: quote.approvalMethod || undefined,
      publicToken: quote.publicToken || undefined,
      publicTokenExpiresAt: quote.publicTokenExpiresAt || undefined,
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
      // Tempo estimado de serviço
      estimatedHours: quote.estimatedHours
        ? typeof quote.estimatedHours === 'object' &&
          'toNumber' in quote.estimatedHours
          ? quote.estimatedHours.toNumber()
          : undefined
        : undefined,
      // Atribuição
      assignedMechanicId: quote.assignedMechanicId || undefined,
      assignedAt: quote.assignedAt || undefined,
      assignedMechanic: quote.assignedMechanic
        ? {
            id: quote.assignedMechanic.id,
            name: quote.assignedMechanic.name,
            email: quote.assignedMechanic.email,
          }
        : undefined,
      items: quote.items.map((item) => ({
        id: item.id,
        type: item.type as QuoteItemType,
        serviceId: item.serviceId || undefined,
        partId: item.partId || undefined,
        name: item.name,
        description: item.description || undefined,
        quantity: item.quantity,
        unitCost: item.unitCost?.toNumber() ?? 0,
        totalCost: item.totalCost?.toNumber() ?? 0,
        hours: item.hours?.toNumber() || undefined,
      })),
      // Integrações com novos módulos (serão populados assincronamente se necessário)
      attachments: undefined, // Será populado quando necessário
      checklists: undefined, // Será populado quando necessário
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    };
  }

  /**
   * Busca attachments e checklists relacionados a um quote
   */
  private async enrichQuoteWithRelations(
    tenantId: string,
    quoteId: string,
  ): Promise<{
    attachments: Array<{
      id: string;
      type: string;
      url: string;
      originalName: string;
    }>;
    checklists: Array<{
      id: string;
      checklistType: string;
      name: string;
      status: string;
    }>;
  }> {
    try {
      const [attachmentsResult, checklistsResult] = await Promise.all([
        this.attachmentsService.findAll(tenantId, {
          quoteId,
          page: 1,
          limit: 100,
        }),
        this.checklistsService.findAll(tenantId, {
          entityType: ChecklistEntityType.QUOTE,
          entityId: quoteId,
          page: 1,
          limit: 100,
        }),
      ]);

      return {
        attachments: attachmentsResult.data.map((att) => ({
          id: att.id,
          type: att.type,
          url: att.url,
          originalName: att.originalName,
        })),
        checklists: checklistsResult.data.map((checklist) => ({
          id: checklist.id,
          checklistType: checklist.checklistType,
          name: checklist.name,
          status: checklist.status,
        })),
      };
    } catch (error) {
      this.logger.warn(
        `Erro ao buscar attachments/checklists: ${getErrorMessage(error)}`,
      );
      return { attachments: [], checklists: [] };
    }
  }

  /**
   * Mecânico pega um orçamento disponível (sem mecânico atribuído)
   */
  async claimQuote(
    tenantId: string,
    id: string,
    mechanicId: string,
  ): Promise<QuoteResponseDto> {
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // Validar que o status permite atribuição
    const quoteStatus = quote.status as QuoteStatus;
    if (quoteStatus !== QuoteStatus.AWAITING_DIAGNOSIS) {
      throw new BadRequestException(
        'Apenas orçamentos aguardando diagnóstico podem ser pegos',
      );
    }

    // Validar que não tem mecânico atribuído
    if (quote.assignedMechanicId) {
      throw new BadRequestException(
        'Este orçamento já foi atribuído a outro mecânico',
      );
    }

    // Verificar se o mecânico existe e é do tenant
    const mechanic = await this.prisma.user.findFirst({
      where: {
        id: mechanicId,
        tenantId,
        role: 'mechanic',
        isActive: true,
      },
    });

    if (!mechanic) {
      throw new NotFoundException('Mecânico não encontrado ou inativo');
    }

    // Atribuir o orçamento ao mecânico
    const updatedQuote = await this.prisma.quote.update({
      where: { id },
      data: {
        assignedMechanic: {
          connect: { id: mechanicId },
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
        assignedMechanic: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    // Criar notificação para o mecânico
    try {
      await this.notificationsService.create({
        tenantId,
        userId: mechanicId,
        type: NotificationType.QUOTE_ASSIGNED,
        title: 'Orçamento Atribuído',
        message: `Você pegou o orçamento ${quote.number}`,
        data: {
          quoteId: id,
          quoteNumber: quote.number,
        },
      });
    } catch (notificationError) {
      // Log mas não falha a operação se a notificação falhar
      this.logger.warn(
        `Erro ao criar notificação para mecânico ${mechanicId}: ${getErrorMessage(notificationError)}`,
      );
    }

    this.logger.log(`Mecânico ${mechanicId} pegou o orçamento ${quote.number}`);

    return this.toResponseDto(updatedQuote);
  }
}
