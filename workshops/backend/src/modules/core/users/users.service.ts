import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateUserDto, UpdateUserDto, UserResponseDto, UserRole } from './dto';
import * as bcrypt from 'bcrypt';
import {
  getErrorMessage,
  getErrorStack,
} from '../../../common/utils/error.utils';
import { Prisma } from '@prisma/client';

// Tipo para User do Prisma
type PrismaUser = Prisma.UserGetPayload<Record<string, never>>;

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const normalizedEmail = createUserDto.email.toLowerCase().trim();

      // Verificar se email já existe no tenant
      const existingUser = await this.prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId,
            email: normalizedEmail,
          },
        },
      });

      if (existingUser) {
        throw new ConflictException('Email já cadastrado neste tenant');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      // Criar usuário
      const user = await this.prisma.user.create({
        data: {
          tenantId,
          email: normalizedEmail,
          name: createUserDto.name.trim(),
          password: hashedPassword,
          role: createUserDto.role,
          isActive: createUserDto.isActive ?? true,
        },
      });

      this.logger.log(
        `Usuário criado: ${user.id} (${user.email}) no tenant ${tenantId}`,
      );
      return this.toResponseDto(user);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao criar usuário: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findAll(
    tenantId: string,
    includeInactive = false,
    role?: string,
  ): Promise<UserResponseDto[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          tenantId,
          ...(includeInactive ? {} : { isActive: true }),
          ...(role ? { role } : {}),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return users.map((user) => this.toResponseDto(user));
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao listar usuários: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async findOne(tenantId: string, id: string): Promise<UserResponseDto> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      return this.toResponseDto(user);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao buscar usuário ${id}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async update(
    tenantId: string,
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      // Verificar se usuário existe
      const existingUser = await this.prisma.user.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!existingUser) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Se email está sendo atualizado, verificar se não existe outro usuário com esse email
      if (updateUserDto.email) {
        const normalizedEmail = updateUserDto.email.toLowerCase().trim();
        if (normalizedEmail !== existingUser.email.toLowerCase()) {
          const emailExists = await this.prisma.user.findUnique({
            where: {
              tenantId_email: {
                tenantId,
                email: normalizedEmail,
              },
            },
          });

          if (emailExists) {
            throw new ConflictException('Email já cadastrado neste tenant');
          }
        }
      }

      // Preparar dados para atualização
      const updateData: Prisma.UserUpdateInput = {};

      if (updateUserDto.email) {
        updateData.email = updateUserDto.email.toLowerCase().trim();
      }

      if (updateUserDto.name) {
        updateData.name = updateUserDto.name.trim();
      }

      if (updateUserDto.role) {
        updateData.role = updateUserDto.role;
      }

      if (updateUserDto.isActive !== undefined) {
        updateData.isActive = updateUserDto.isActive;
      }

      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      this.logger.log(`Usuário atualizado: ${id}`);
      return this.toResponseDto(updatedUser);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao atualizar usuário ${id}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  async remove(tenantId: string, id: string): Promise<void> {
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          id,
          tenantId,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Soft delete: marcar como inativo ao invés de deletar
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(`Usuário removido (soft delete): ${id}`);
    } catch (error: unknown) {
      this.logger.error(
        `Erro ao remover usuário ${id}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw error;
    }
  }

  private toResponseDto(user: PrismaUser): UserResponseDto {
    return {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
