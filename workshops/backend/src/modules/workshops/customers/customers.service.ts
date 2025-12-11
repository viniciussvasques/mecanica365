import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CustomerResponseDto,
  CustomerFiltersDto,
  DocumentType,
} from './dto';
import { Prisma } from '@prisma/client';
import { getErrorMessage, getErrorStack } from '@common/utils/error.utils';

// Tipo para Customer do Prisma
type PrismaCustomer = Prisma.CustomerGetPayload<Record<string, never>>;

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria um novo cliente
   */
  async create(
    tenantId: string,
    createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    try {
      const documentType = createCustomerDto.documentType || DocumentType.CPF;
      this.validateDocumentForCreate(documentType, createCustomerDto);

      await this.validatePhoneUniqueness(tenantId, createCustomerDto.phone);
      await this.validateDocumentUniqueness(
        tenantId,
        documentType,
        createCustomerDto.cpf,
        createCustomerDto.cnpj,
      );

      const customer = await this.createCustomer(
        tenantId,
        createCustomerDto,
        documentType,
      );

      this.logger.log(`Cliente criado: ${customer.id} (tenant: ${tenantId})`);
      return this.toResponseDto(customer);
    } catch (error: unknown) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Erro ao criar cliente: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao criar cliente');
    }
  }

  /**
   * Lista todos os clientes do tenant com filtros e paginação
   */
  async findAll(
    tenantId: string,
    filters: CustomerFiltersDto,
  ): Promise<{
    data: CustomerResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const skip = (page - 1) * limit;

      // Construir condições de busca
      const where: Prisma.CustomerWhereInput = {
        tenantId,
      };

      if (filters.name) {
        where.name = {
          contains: filters.name.trim(),
          mode: 'insensitive',
        };
      }

      if (filters.phone) {
        where.phone = {
          contains: filters.phone.trim(),
          mode: 'insensitive',
        };
      }

      if (filters.email) {
        where.email = {
          contains: filters.email.trim(),
          mode: 'insensitive',
        };
      }

      if (filters.documentType) {
        (where as { documentType?: string }).documentType =
          filters.documentType;
      }

      if (filters.cpf) {
        where.cpf = {
          contains: filters.cpf.trim(),
          mode: 'insensitive',
        };
      }

      if (filters.cnpj) {
        (where as { cnpj?: { contains: string; mode: 'insensitive' } }).cnpj = {
          contains: filters.cnpj.trim(),
          mode: 'insensitive',
        };
      }

      // Buscar clientes e total
      const [customers, total] = await Promise.all([
        this.prisma.customer.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.customer.count({ where }),
      ]);

      return {
        data: customers.map((customer) => this.toResponseDto(customer)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar clientes: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao listar clientes');
    }
  }

  /**
   * Busca um cliente por ID
   */
  async findOne(tenantId: string, id: string): Promise<CustomerResponseDto> {
    try {
      const customer = await this.prisma.customer.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }

      return this.toResponseDto(customer);
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(
        `Erro ao buscar cliente: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao buscar cliente');
    }
  }

  /**
   * Atualiza um cliente
   */
  async update(
    tenantId: string,
    id: string,
    updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    try {
      const existingCustomer = await this.findCustomerByIdAndTenant(
        id,
        tenantId,
      );
      this.validateDocumentsForUpdate(updateCustomerDto);

      await this.validatePhoneUniquenessForUpdate(
        tenantId,
        id,
        updateCustomerDto.phone,
        existingCustomer.phone,
      );
      await this.validateDocumentUniquenessForUpdate(
        tenantId,
        id,
        updateCustomerDto,
        existingCustomer,
      );

      const updateData = this.prepareCustomerUpdateData(updateCustomerDto);
      const customer = await this.prisma.customer.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Cliente atualizado: ${id} (tenant: ${tenantId})`);
      return this.toResponseDto(customer);
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Erro ao atualizar cliente: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao atualizar cliente');
    }
  }

  /**
   * Remove um cliente
   */
  async remove(tenantId: string, id: string): Promise<void> {
    try {
      // Verificar se cliente existe
      const customer = await this.prisma.customer.findFirst({
        where: {
          id,
          tenantId,
        },
        include: {
          serviceOrders: {
            take: 1,
          },
          invoices: {
            take: 1,
          },
          appointments: {
            take: 1,
          },
        },
      });

      if (!customer) {
        throw new NotFoundException('Cliente não encontrado');
      }

      // Verificar se cliente tem relacionamentos
      if (customer.serviceOrders.length > 0) {
        throw new BadRequestException(
          'Não é possível excluir cliente com ordens de serviço vinculadas',
        );
      }

      if (customer.invoices.length > 0) {
        throw new BadRequestException(
          'Não é possível excluir cliente com faturas vinculadas',
        );
      }

      if (customer.appointments.length > 0) {
        throw new BadRequestException(
          'Não é possível excluir cliente com agendamentos vinculados',
        );
      }

      // Remover cliente
      await this.prisma.customer.delete({
        where: { id },
      });

      this.logger.log(`Cliente removido: ${id} (tenant: ${tenantId})`);
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      this.logger.error(
        `Erro ao remover cliente: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new BadRequestException('Erro ao remover cliente');
    }
  }

  private validateDocumentForCreate(
    documentType: DocumentType,
    createCustomerDto: CreateCustomerDto,
  ): void {
    if (documentType === DocumentType.CPF) {
      if (!createCustomerDto.cpf) {
        throw new BadRequestException('CPF é obrigatório para pessoa física');
      }
      if (!this.isValidCPF(createCustomerDto.cpf)) {
        throw new BadRequestException('CPF inválido');
      }
    } else if (documentType === DocumentType.CNPJ) {
      if (!createCustomerDto.cnpj) {
        throw new BadRequestException(
          'CNPJ é obrigatório para pessoa jurídica',
        );
      }
      if (!this.isValidCNPJ(createCustomerDto.cnpj)) {
        throw new BadRequestException('CNPJ inválido');
      }
    }
  }

  private async validatePhoneUniqueness(
    tenantId: string,
    phone: string,
  ): Promise<void> {
    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        phone,
      },
    });

    if (existingCustomer) {
      throw new ConflictException(
        'Já existe um cliente cadastrado com este telefone',
      );
    }
  }

  private async validateDocumentUniqueness(
    tenantId: string,
    documentType: DocumentType,
    cpf: string | undefined,
    cnpj: string | undefined,
  ): Promise<void> {
    if (documentType === DocumentType.CPF && cpf) {
      await this.validateCpfUniqueness(tenantId, cpf);
    } else if (documentType === DocumentType.CNPJ && cnpj) {
      await this.validateCnpjUniqueness(tenantId, cnpj);
    }
  }

  private async validateCpfUniqueness(
    tenantId: string,
    cpf: string,
  ): Promise<void> {
    const existingByCpf = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        cpf: cpf.trim(),
      },
    });

    if (existingByCpf) {
      throw new ConflictException(
        'Já existe um cliente cadastrado com este CPF',
      );
    }
  }

  private async validateCnpjUniqueness(
    tenantId: string,
    cnpj: string,
  ): Promise<void> {
    const existingByCnpj = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        cnpj: cnpj.trim(),
      } as Prisma.CustomerWhereInput,
    });

    if (existingByCnpj) {
      throw new ConflictException(
        'Já existe um cliente cadastrado com este CNPJ',
      );
    }
  }

  private async createCustomer(
    tenantId: string,
    createCustomerDto: CreateCustomerDto,
    documentType: DocumentType,
  ): Promise<PrismaCustomer> {
    return await this.prisma.customer.create({
      data: {
        tenantId,
        name: createCustomerDto.name.trim(),
        email: createCustomerDto.email?.trim() || null,
        phone: createCustomerDto.phone.trim(),
        documentType,
        cpf:
          documentType === DocumentType.CPF
            ? createCustomerDto.cpf?.trim() || null
            : null,
        cnpj:
          documentType === DocumentType.CNPJ
            ? createCustomerDto.cnpj?.trim() || null
            : null,
        address: createCustomerDto.address?.trim() || null,
        notes: createCustomerDto.notes?.trim() || null,
      } as Prisma.CustomerUncheckedCreateInput,
    });
  }

  private async findCustomerByIdAndTenant(
    id: string,
    tenantId: string,
  ): Promise<PrismaCustomer> {
    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!existingCustomer) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return existingCustomer;
  }

  private validateDocumentsForUpdate(
    updateCustomerDto: UpdateCustomerDto,
  ): void {
    if (updateCustomerDto.cpf && !this.isValidCPF(updateCustomerDto.cpf)) {
      throw new BadRequestException('CPF inválido');
    }
    if (updateCustomerDto.cnpj && !this.isValidCNPJ(updateCustomerDto.cnpj)) {
      throw new BadRequestException('CNPJ inválido');
    }
  }

  private async validatePhoneUniquenessForUpdate(
    tenantId: string,
    id: string,
    newPhone: string | undefined,
    currentPhone: string,
  ): Promise<void> {
    if (!newPhone || newPhone === currentPhone) {
      return;
    }

    const customerWithPhone = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        phone: newPhone,
        NOT: { id },
      },
    });

    if (customerWithPhone) {
      throw new ConflictException(
        'Já existe um cliente cadastrado com este telefone',
      );
    }
  }

  private async validateDocumentUniquenessForUpdate(
    tenantId: string,
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    existingCustomer: PrismaCustomer,
  ): Promise<void> {
    if (
      updateCustomerDto.cpf &&
      updateCustomerDto.cpf !== existingCustomer.cpf
    ) {
      await this.validateCpfUniquenessForUpdate(
        tenantId,
        id,
        updateCustomerDto.cpf,
      );
    }

    const existingCustomerWithCnpj = existingCustomer as PrismaCustomer & {
      cnpj?: string | null;
    };

    if (
      updateCustomerDto.cnpj &&
      updateCustomerDto.cnpj !== existingCustomerWithCnpj.cnpj
    ) {
      await this.validateCnpjUniquenessForUpdate(
        tenantId,
        id,
        updateCustomerDto.cnpj,
      );
    }
  }

  private async validateCpfUniquenessForUpdate(
    tenantId: string,
    id: string,
    cpf: string,
  ): Promise<void> {
    const customerWithCpf = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        cpf,
        NOT: { id },
      },
    });

    if (customerWithCpf) {
      throw new ConflictException(
        'Já existe um cliente cadastrado com este CPF',
      );
    }
  }

  private async validateCnpjUniquenessForUpdate(
    tenantId: string,
    id: string,
    cnpj: string,
  ): Promise<void> {
    const customerWithCnpj = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        cnpj,
        NOT: { id },
      } as Prisma.CustomerWhereInput,
    });

    if (customerWithCnpj) {
      throw new ConflictException(
        'Já existe um cliente cadastrado com este CNPJ',
      );
    }
  }

  private prepareCustomerUpdateData(
    updateCustomerDto: UpdateCustomerDto,
  ): Prisma.CustomerUpdateInput {
    const updateData: Prisma.CustomerUpdateInput = {};

    if (updateCustomerDto.name !== undefined) {
      updateData.name = updateCustomerDto.name.trim();
    }

    if (updateCustomerDto.email !== undefined) {
      updateData.email = updateCustomerDto.email?.trim() || null;
    }

    if (updateCustomerDto.phone !== undefined) {
      updateData.phone = updateCustomerDto.phone.trim();
    }

    if (updateCustomerDto.documentType !== undefined) {
      (updateData as { documentType?: string }).documentType =
        updateCustomerDto.documentType;
    }

    if (updateCustomerDto.cpf !== undefined) {
      updateData.cpf = updateCustomerDto.cpf?.trim() || null;
      if (updateCustomerDto.cpf) {
        (updateData as { cnpj?: string | null }).cnpj = null;
      }
    }

    if (updateCustomerDto.cnpj !== undefined) {
      (updateData as { cnpj?: string | null }).cnpj =
        updateCustomerDto.cnpj?.trim() || null;
      if (updateCustomerDto.cnpj) {
        updateData.cpf = null;
      }
    }

    if (updateCustomerDto.address !== undefined) {
      updateData.address = updateCustomerDto.address?.trim() || null;
    }

    if (updateCustomerDto.notes !== undefined) {
      updateData.notes = updateCustomerDto.notes?.trim() || null;
    }

    return updateData;
  }

  /**
   * Converte Customer do Prisma para CustomerResponseDto
   */
  private toResponseDto(customer: PrismaCustomer): CustomerResponseDto {
    const customerWithDoc = customer as PrismaCustomer & {
      documentType?: string;
      cnpj?: string | null;
    };

    return {
      id: customer.id,
      tenantId: customer.tenantId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      documentType: customerWithDoc.documentType || 'cpf',
      cpf: customer.cpf,
      cnpj: customerWithDoc.cnpj || null,
      address: customer.address,
      notes: customer.notes,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }

  /**
   * Valida CPF
   */
  private isValidCPF(cpf: string): boolean {
    // Remove caracteres não numéricos
    const cleanCpf = cpf.replaceAll(/\D/g, '');

    // Verifica se tem 11 dígitos
    if (cleanCpf.length !== 11) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cleanCpf)) {
      return false;
    }

    // Validação dos dígitos verificadores
    let sum = 0;
    let remainder: number;

    // Valida primeiro dígito
    for (let i = 1; i <= 9; i++) {
      sum += Number.parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }

    if (remainder !== Number.parseInt(cleanCpf.substring(9, 10))) {
      return false;
    }

    // Valida segundo dígito
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += Number.parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }

    if (remainder !== Number.parseInt(cleanCpf.substring(10, 11))) {
      return false;
    }

    return true;
  }

  /**
   * Valida CNPJ
   */
  private isValidCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const cleanCnpj = cnpj.replaceAll(/\D/g, '');

    // Verifica se tem 14 dígitos
    if (cleanCnpj.length !== 14) {
      return false;
    }

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cleanCnpj)) {
      return false;
    }

    // Validação dos dígitos verificadores
    let length = cleanCnpj.length - 2;
    let numbers = cleanCnpj.substring(0, length);
    const digits = cleanCnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    // Valida primeiro dígito
    for (let i = length; i >= 1; i--) {
      sum += Number.parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number.parseInt(digits.charAt(0))) {
      return false;
    }

    // Valida segundo dígito
    length = length + 1;
    numbers = cleanCnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += Number.parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number.parseInt(digits.charAt(1))) {
      return false;
    }

    return true;
  }
}
