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
      // Validar CPF se fornecido
      if (createCustomerDto.cpf && !this.isValidCPF(createCustomerDto.cpf)) {
        throw new BadRequestException('CPF inválido');
      }

      // Verificar se já existe cliente com mesmo telefone no tenant
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          tenantId,
          phone: createCustomerDto.phone,
        },
      });

      if (existingCustomer) {
        throw new ConflictException(
          'Já existe um cliente cadastrado com este telefone',
        );
      }

      // Verificar se já existe cliente com mesmo CPF no tenant (se fornecido)
      if (createCustomerDto.cpf) {
        const existingByCpf = await this.prisma.customer.findFirst({
          where: {
            tenantId,
            cpf: createCustomerDto.cpf,
          },
        });

        if (existingByCpf) {
          throw new ConflictException(
            'Já existe um cliente cadastrado com este CPF',
          );
        }
      }

      // Criar cliente
      const customer = await this.prisma.customer.create({
        data: {
          tenantId,
          name: createCustomerDto.name.trim(),
          email: createCustomerDto.email?.trim() || null,
          phone: createCustomerDto.phone.trim(),
          cpf: createCustomerDto.cpf?.trim() || null,
          address: createCustomerDto.address?.trim() || null,
          notes: createCustomerDto.notes?.trim() || null,
        },
      });

      this.logger.log(`Cliente criado: ${customer.id} (tenant: ${tenantId})`);

      return this.toResponseDto(customer);
    } catch (error) {
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

      if (filters.cpf) {
        where.cpf = filters.cpf.trim();
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
    } catch (error) {
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
    } catch (error) {
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
      // Verificar se cliente existe
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!existingCustomer) {
        throw new NotFoundException('Cliente não encontrado');
      }

      // Validar CPF se fornecido
      if (updateCustomerDto.cpf && !this.isValidCPF(updateCustomerDto.cpf)) {
        throw new BadRequestException('CPF inválido');
      }

      // Verificar conflito de telefone (se alterado)
      if (
        updateCustomerDto.phone &&
        updateCustomerDto.phone !== existingCustomer.phone
      ) {
        const customerWithPhone = await this.prisma.customer.findFirst({
          where: {
            tenantId,
            phone: updateCustomerDto.phone,
            NOT: { id },
          },
        });

        if (customerWithPhone) {
          throw new ConflictException(
            'Já existe um cliente cadastrado com este telefone',
          );
        }
      }

      // Verificar conflito de CPF (se alterado)
      if (
        updateCustomerDto.cpf &&
        updateCustomerDto.cpf !== existingCustomer.cpf
      ) {
        const customerWithCpf = await this.prisma.customer.findFirst({
          where: {
            tenantId,
            cpf: updateCustomerDto.cpf,
            NOT: { id },
          },
        });

        if (customerWithCpf) {
          throw new ConflictException(
            'Já existe um cliente cadastrado com este CPF',
          );
        }
      }

      // Preparar dados para atualização
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

      if (updateCustomerDto.cpf !== undefined) {
        updateData.cpf = updateCustomerDto.cpf?.trim() || null;
      }

      if (updateCustomerDto.address !== undefined) {
        updateData.address = updateCustomerDto.address?.trim() || null;
      }

      if (updateCustomerDto.notes !== undefined) {
        updateData.notes = updateCustomerDto.notes?.trim() || null;
      }

      // Atualizar cliente
      const customer = await this.prisma.customer.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Cliente atualizado: ${id} (tenant: ${tenantId})`);

      return this.toResponseDto(customer);
    } catch (error) {
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
    } catch (error) {
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

  /**
   * Converte Customer do Prisma para CustomerResponseDto
   */
  private toResponseDto(customer: PrismaCustomer): CustomerResponseDto {
    return {
      id: customer.id,
      tenantId: customer.tenantId,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      cpf: customer.cpf,
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
    const cleanCpf = cpf.replace(/\D/g, '');

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
      sum += parseInt(cleanCpf.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }

    if (remainder !== parseInt(cleanCpf.substring(9, 10))) {
      return false;
    }

    // Valida segundo dígito
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cleanCpf.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) {
      remainder = 0;
    }

    if (remainder !== parseInt(cleanCpf.substring(10, 11))) {
      return false;
    }

    return true;
  }
}
