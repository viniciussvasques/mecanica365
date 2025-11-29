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

      // Validar documento conforme o tipo
      if (documentType === DocumentType.CPF) {
        if (!createCustomerDto.cpf) {
          throw new BadRequestException('CPF é obrigatório para pessoa física');
        }
        if (!this.isValidCPF(createCustomerDto.cpf)) {
          throw new BadRequestException('CPF inválido');
        }
      } else if (documentType === DocumentType.CNPJ) {
        if (!createCustomerDto.cnpj) {
          throw new BadRequestException('CNPJ é obrigatório para pessoa jurídica');
        }
        if (!this.isValidCNPJ(createCustomerDto.cnpj)) {
          throw new BadRequestException('CNPJ inválido');
        }
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

      // Verificar se já existe cliente com mesmo documento no tenant
      if (documentType === DocumentType.CPF && createCustomerDto.cpf) {
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
      } else if (documentType === DocumentType.CNPJ && createCustomerDto.cnpj) {
        const existingByCnpj = await this.prisma.customer.findFirst({
          where: {
            tenantId,
            cnpj: createCustomerDto.cnpj,
          } as Prisma.CustomerWhereInput,
        });

        if (existingByCnpj) {
          throw new ConflictException(
            'Já existe um cliente cadastrado com este CNPJ',
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
          documentType,
          cpf: documentType === DocumentType.CPF ? createCustomerDto.cpf?.trim() || null : null,
          cnpj: documentType === DocumentType.CNPJ ? createCustomerDto.cnpj?.trim() || null : null,
          address: createCustomerDto.address?.trim() || null,
          notes: createCustomerDto.notes?.trim() || null,
        } as Prisma.CustomerUncheckedCreateInput,
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

      if (filters.documentType) {
        (where as { documentType?: string }).documentType = filters.documentType;
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

      // Validar documento se fornecido
      if (updateCustomerDto.cpf && !this.isValidCPF(updateCustomerDto.cpf)) {
        throw new BadRequestException('CPF inválido');
      }
      if (updateCustomerDto.cnpj && !this.isValidCNPJ(updateCustomerDto.cnpj)) {
        throw new BadRequestException('CNPJ inválido');
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

      // Verificar conflito de documento (se alterado)
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

      if (
        updateCustomerDto.cnpj &&
        updateCustomerDto.cnpj !== (existingCustomer as { cnpj?: string | null }).cnpj
      ) {
        const customerWithCnpj = await this.prisma.customer.findFirst({
          where: {
            tenantId,
            cnpj: updateCustomerDto.cnpj,
            NOT: { id },
          } as Prisma.CustomerWhereInput,
        });

        if (customerWithCnpj) {
          throw new ConflictException(
            'Já existe um cliente cadastrado com este CNPJ',
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

      if (updateCustomerDto.documentType !== undefined) {
        (updateData as { documentType?: string }).documentType = updateCustomerDto.documentType;
      }

      if (updateCustomerDto.cpf !== undefined) {
        updateData.cpf = updateCustomerDto.cpf?.trim() || null;
        // Se está atualizando CPF, limpar CNPJ
        if (updateCustomerDto.cpf) {
          (updateData as { cnpj?: string | null }).cnpj = null;
        }
      }

      if (updateCustomerDto.cnpj !== undefined) {
        (updateData as { cnpj?: string | null }).cnpj = updateCustomerDto.cnpj?.trim() || null;
        // Se está atualizando CNPJ, limpar CPF
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

  /**
   * Valida CNPJ
   */
  private isValidCNPJ(cnpj: string): boolean {
    // Remove caracteres não numéricos
    const cleanCnpj = cnpj.replace(/\D/g, '');

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
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) {
      return false;
    }

    // Valida segundo dígito
    length = length + 1;
    numbers = cleanCnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) {
        pos = 9;
      }
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) {
      return false;
    }

    return true;
  }
}
