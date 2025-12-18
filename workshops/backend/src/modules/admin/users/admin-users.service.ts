import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../database/prisma.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateAdminUserStatusDto } from './dto/update-admin-user-status.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const users = await this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => this.sanitize(user));
  }

  async findOne(id: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário admin não encontrado');
    }

    return this.sanitize(user);
  }

  async create(dto: CreateAdminUserDto) {
    const passwordHash = await this.hashPassword(dto.password);

    try {
      const created = await this.prisma.adminUser.create({
        data: {
          email: dto.email,
          name: dto.name,
          passwordHash,
          role: dto.role ?? 'admin',
        },
      });

      return this.sanitize(created);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Já existe um usuário com este email');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateAdminUserDto) {
    const existing = await this.prisma.adminUser.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('Usuário admin não encontrado');
    }

    const data: Record<string, unknown> = {};

    if (dto.email && dto.email !== existing.email) {
      data.email = dto.email;
    }

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.role !== undefined) {
      data.role = dto.role;
    }

    if (dto.password) {
      data.passwordHash = await this.hashPassword(dto.password);
    }

    try {
      const updated = await this.prisma.adminUser.update({
        where: { id },
        data,
      });
      return this.sanitize(updated);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Já existe um usuário com este email');
      }
      throw error;
    }
  }

  async updateStatus(id: string, dto: UpdateAdminUserStatusDto) {
    await this.ensureUserExists(id);

    const updated = await this.prisma.adminUser.update({
      where: { id },
      data: { isActive: dto.isActive },
    });

    return this.sanitize(updated);
  }

  async resetPassword(id: string, dto: ResetAdminPasswordDto) {
    await this.ensureUserExists(id);

    const updated = await this.prisma.adminUser.update({
      where: { id },
      data: {
        passwordHash: await this.hashPassword(dto.newPassword),
      },
    });

    return this.sanitize(updated);
  }

  private async ensureUserExists(id: string) {
    const user = await this.prisma.adminUser.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException('Usuário admin não encontrado');
    }

    return user;
  }

  private async hashPassword(password: string) {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private sanitize(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
