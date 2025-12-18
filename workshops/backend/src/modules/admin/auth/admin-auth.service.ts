import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../../database/prisma.service';
import * as bcrypt from 'bcrypt';
import { AdminLoginDto } from './dto/admin-login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: AdminLoginDto) {
    const { email, password } = loginDto;

    const admin = await this.prisma.adminUser.findUnique({
      where: { email, isActive: true },
    });

    if (!admin) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Atualizar último login
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const payload = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin', // Diferencia de tenant auth
    };

    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    };
  }

  async validateAdmin(adminId: string) {
    return this.prisma.adminUser.findUnique({
      where: { id: adminId, isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async getProfile(adminId: string) {
    const admin = await this.validateAdmin(adminId);
    if (!admin) {
      throw new UnauthorizedException('Admin não encontrado');
    }
    return admin;
  }
}
