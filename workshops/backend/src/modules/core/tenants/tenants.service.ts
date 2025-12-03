import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateTenantDto,
  UpdateTenantDto,
  TenantResponseDto,
  DocumentType,
} from './dto';
import { BillingService } from '../billing/billing.service';
import { UsersService } from '../users/users.service';
import {
  BillingCycle,
  SubscriptionPlan,
} from '../billing/dto/subscription-response.dto';
import { UserRole } from '../users/dto/create-user.dto';
import {
  getErrorMessage,
  getErrorStack,
} from '../../../common/utils/error.utils';
import { Prisma } from '@prisma/client';

// Tipo para Tenant com subscription incluída
type TenantWithSubscription = Prisma.TenantGetPayload<{
  include: { subscription: true };
}>;

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    private readonly usersService: UsersService,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    try {
      const normalizedSubdomain = createTenantDto.subdomain
        .toLowerCase()
        .trim();

      const documentType = createTenantDto.documentType || DocumentType.CNPJ;
      const document = createTenantDto.document;

      this.validateDocument(documentType, document);
      await this.validateDocumentUniqueness(document, documentType);
      await this.validateSubdomainUniqueness(normalizedSubdomain);

      const tenant = await this.createTenant(
        createTenantDto,
        normalizedSubdomain,
        documentType,
        document,
      );

      this.logger.log(`Tenant criado: ${tenant.id} (${tenant.subdomain})`);

      await this.provisionSubscription(tenant.id, createTenantDto.plan);
      await this.provisionAdminUser(tenant.id, createTenantDto);

      // Buscar tenant atualizado com subscription
      const tenantWithSubscription = await this.prisma.tenant.findUnique({
        where: { id: tenant.id },
        include: { subscription: true },
      });

      if (!tenantWithSubscription) {
        throw new NotFoundException('Tenant não encontrado após criação');
      }

      return this.toResponseDto(tenantWithSubscription);
    } catch (error) {
      this.logger.error(
        `Erro ao criar tenant: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findAll(): Promise<TenantResponseDto[]> {
    try {
      const tenants = await this.prisma.tenant.findMany({
        include: { subscription: true },
        orderBy: { createdAt: 'desc' },
      });

      return tenants.map((tenant) => this.toResponseDto(tenant));
    } catch (error) {
      this.logger.error(
        `Erro ao listar tenants: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findOne(id: string): Promise<TenantResponseDto> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id },
        include: { subscription: true },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant não encontrado');
      }

      return this.toResponseDto(tenant);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar tenant ${id}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findBySubdomain(subdomain: string): Promise<TenantResponseDto> {
    try {
      const normalizedSubdomain = subdomain.toLowerCase().trim();
      const tenant = await this.prisma.tenant.findUnique({
        where: { subdomain: normalizedSubdomain },
        include: { subscription: true },
      });

      if (!tenant) {
        throw new NotFoundException(
          `Tenant não encontrado: ${normalizedSubdomain}`,
        );
      }

      return this.toResponseDto(tenant);
    } catch (error) {
      this.logger.error(
        `Erro ao buscar tenant por subdomain ${subdomain}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  private validateDocument(documentType: DocumentType, document: string): void {
    if (documentType === DocumentType.CPF) {
      if (!this.isValidCPF(document)) {
        throw new BadRequestException('CPF inválido');
      }
    } else if (!this.isValidCNPJ(document)) {
      throw new BadRequestException('CNPJ inválido');
    }
  }

  private async validateDocumentUniqueness(
    document: string,
    documentType: DocumentType,
  ): Promise<void> {
    const existingByDocument = await this.prisma.tenant.findUnique({
      where: { document },
    });

    if (existingByDocument) {
      throw new ConflictException(
        `${documentType.toUpperCase()} já cadastrado`,
      );
    }
  }

  private async validateSubdomainUniqueness(subdomain: string): Promise<void> {
    const existingBySubdomain = await this.prisma.tenant.findUnique({
      where: { subdomain },
    });

    if (existingBySubdomain) {
      throw new ConflictException('Subdomain já está em uso');
    }
  }

  private async createTenant(
    createTenantDto: CreateTenantDto,
    normalizedSubdomain: string,
    documentType: DocumentType,
    document: string,
  ): Promise<TenantWithSubscription> {
    return await this.prisma.tenant.create({
      data: {
        name: createTenantDto.name.trim(),
        documentType,
        document,
        subdomain: normalizedSubdomain,
        plan: createTenantDto.plan || 'workshops_starter',
        status: createTenantDto.status || 'pending',
        adminEmail: createTenantDto.adminEmail
          ? createTenantDto.adminEmail.toLowerCase().trim()
          : null,
      },
      include: { subscription: true },
    });
  }

  private async provisionSubscription(
    tenantId: string,
    plan?: string,
  ): Promise<void> {
    try {
      await this.billingService.create({
        tenantId,
        plan: (plan || 'workshops_starter') as SubscriptionPlan,
        billingCycle: BillingCycle.MONTHLY,
      });
      this.logger.log(
        `Subscription criada automaticamente para tenant ${tenantId}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar subscription automaticamente: ${getErrorMessage(error)}`,
      );
    }
  }

  private async provisionAdminUser(
    tenantId: string,
    createTenantDto: CreateTenantDto,
  ): Promise<void> {
    if (
      !createTenantDto.adminEmail ||
      !createTenantDto.adminName ||
      !createTenantDto.adminPassword
    ) {
      return;
    }

    try {
      await this.usersService.create(tenantId, {
        email: createTenantDto.adminEmail,
        name: createTenantDto.adminName,
        password: createTenantDto.adminPassword,
        role: UserRole.ADMIN,
        isActive: true,
      });
      this.logger.log(
        `Usuário admin criado automaticamente para tenant ${tenantId}`,
      );
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar usuário admin automaticamente: ${getErrorMessage(error)}`,
      );
    }
  }

  async update(
    id: string,
    updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant não encontrado');
      }

      const updateData: Prisma.TenantUpdateInput = {};

      if (updateTenantDto.name) {
        updateData.name = updateTenantDto.name.trim();
      }

      if (updateTenantDto.status) {
        updateData.status = updateTenantDto.status;
      }

      if (updateTenantDto.plan) {
        updateData.plan = updateTenantDto.plan;
      }

      const updatedTenant = await this.prisma.tenant.update({
        where: { id },
        data: updateData,
        include: { subscription: true },
      });

      this.logger.log(`Tenant atualizado: ${id}`);
      return this.toResponseDto(updatedTenant);
    } catch (error) {
      this.logger.error(
        `Erro ao atualizar tenant ${id}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async activate(id: string): Promise<TenantResponseDto> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant não encontrado');
      }

      const updatedTenant = await this.prisma.tenant.update({
        where: { id },
        data: { status: 'active' },
        include: { subscription: true },
      });

      this.logger.log(`Tenant ativado: ${id}`);
      return this.toResponseDto(updatedTenant);
    } catch (error) {
      this.logger.error(
        `Erro ao ativar tenant ${id}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async suspend(id: string): Promise<TenantResponseDto> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant não encontrado');
      }

      const updatedTenant = await this.prisma.tenant.update({
        where: { id },
        data: { status: 'suspended' },
        include: { subscription: true },
      });

      this.logger.log(`Tenant suspenso: ${id}`);
      return this.toResponseDto(updatedTenant);
    } catch (error) {
      this.logger.error(
        `Erro ao suspender tenant ${id}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async cancel(id: string): Promise<TenantResponseDto> {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id },
      });

      if (!tenant) {
        throw new NotFoundException('Tenant não encontrado');
      }

      const updatedTenant = await this.prisma.tenant.update({
        where: { id },
        data: { status: 'cancelled' },
        include: { subscription: true },
      });

      this.logger.log(`Tenant cancelado: ${id}`);
      return this.toResponseDto(updatedTenant);
    } catch (error) {
      this.logger.error(
        `Erro ao cancelar tenant ${id}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  private isValidCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replaceAll(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1+$/.test(cleanCPF)) {
      return false;
    }

    // Validação dos dígitos verificadores
    let sum = 0;
    let remainder: number;

    // Validação do primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum += Number.parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== Number.parseInt(cleanCPF.substring(9, 10))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += Number.parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== Number.parseInt(cleanCPF.substring(10, 11))) return false;

    return true;
  }

  private isValidCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const cleanCNPJ = cnpj.replaceAll(/\D/g, '');

    // Verifica se tem 14 dígitos
    if (cleanCNPJ.length !== 14) {
      return false;
    }

    // Verifica se todos os dígitos são iguais (CNPJ inválido)
    if (/^(\d)\1+$/.test(cleanCNPJ)) {
      return false;
    }

    // Validação básica dos dígitos verificadores
    let length = cleanCNPJ.length - 2;
    let numbers = cleanCNPJ.substring(0, length);
    const digits = cleanCNPJ.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += Number.parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number.parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cleanCNPJ.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += Number.parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number.parseInt(digits.charAt(1))) return false;

    return true;
  }

  private toResponseDto(
    tenant:
      | TenantWithSubscription
      | Prisma.TenantGetPayload<{
          include: { subscription: true };
        }>,
  ): TenantResponseDto {
    return {
      id: tenant.id,
      name: tenant.name,
      documentType: tenant.documentType,
      document: tenant.document,
      subdomain: tenant.subdomain,
      plan: tenant.plan as TenantResponseDto['plan'],
      status: tenant.status as TenantResponseDto['status'],
      subscription: tenant.subscription
        ? {
            id: tenant.subscription.id,
            plan: tenant.subscription.plan,
            status: tenant.subscription.status,
            currentPeriodStart: tenant.subscription.currentPeriodStart,
            currentPeriodEnd: tenant.subscription.currentPeriodEnd,
          }
        : undefined,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}
