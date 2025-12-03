import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../database/prisma.service';
import {
  getErrorMessage,
  getErrorStack,
} from '../../../common/utils/error.utils';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { FindTenantByEmailDto } from './dto/find-tenant-by-email.dto';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto, tenantId: string): Promise<LoginResponseDto> {
    try {
      // Validar entrada
      if (!loginDto.email || !loginDto.password) {
        throw new BadRequestException('Email e senha são obrigatórios');
      }

      // Normalizar email
      const normalizedEmail = loginDto.email.toLowerCase().trim();

      // Buscar usuário por email e tenantId
      const user = await this.prisma.user.findUnique({
        where: {
          tenantId_email: {
            tenantId,
            email: normalizedEmail,
          },
        },
        include: {
          tenant: true,
        },
      });

      if (!user) {
        this.logger.warn(
          `Tentativa de login com credenciais inválidas: ${normalizedEmail} (tenant: ${tenantId})`,
        );
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Verificar se usuário está ativo
      if (!user.isActive) {
        this.logger.warn(`Tentativa de login com usuário inativo: ${user.id}`);
        throw new UnauthorizedException('Usuário inativo');
      }

      // Verificar se tenant está ativo
      if (user.tenant.status !== 'active') {
        this.logger.warn(`Tentativa de login com tenant inativo: ${tenantId}`);
        throw new UnauthorizedException('Tenant inativo');
      }

      // Validar senha
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordValid) {
        this.logger.warn(
          `Tentativa de login com senha incorreta: ${normalizedEmail} (tenant: ${tenantId})`,
        );
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Gerar tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken();
      const expiresAt = new Date();
      const refreshExpiresIn =
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
      const days = refreshExpiresIn.includes('d')
        ? Number.parseInt(refreshExpiresIn)
        : 7;
      expiresAt.setDate(expiresAt.getDate() + days);

      // Salvar refresh token
      await this.saveRefreshToken(user.id, refreshToken, expiresAt);

      // Verificar se é primeiro login (usuário criado nas últimas 24 horas)
      const userCreatedAt = user.createdAt;
      const now = new Date();
      const hoursSinceCreation =
        (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60);
      const isFirstLogin = hoursSinceCreation < 24; // Usuário criado há menos de 24 horas

      this.logger.log(
        `Login realizado com sucesso: ${user.id} (${normalizedEmail})${isFirstLogin ? ' [PRIMEIRO LOGIN]' : ''}`,
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        isFirstLogin,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao realizar login: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException('Erro ao realizar login');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    try {
      if (!refreshToken) {
        throw new BadRequestException('Refresh token é obrigatório');
      }

      // Revogar refresh token
      await this.revokeRefreshToken(refreshToken);

      this.logger.log(`Logout realizado com sucesso: ${userId}`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Erro ao realizar logout: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException('Erro ao realizar logout');
    }
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      if (!refreshTokenDto.refreshToken) {
        throw new BadRequestException('Refresh token é obrigatório');
      }

      // Validar refresh token
      const refreshTokenRecord = await this.validateRefreshToken(
        refreshTokenDto.refreshToken,
      );

      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { id: refreshTokenRecord.userId },
        include: {
          tenant: true,
        },
      });

      if (!user || !user.isActive) {
        this.logger.warn(
          `Tentativa de refresh com usuário inativo: ${refreshTokenRecord.userId}`,
        );
        throw new UnauthorizedException('Usuário não encontrado ou inativo');
      }

      if (user.tenant.status !== 'active') {
        this.logger.warn(
          `Tentativa de refresh com tenant inativo: ${user.tenantId}`,
        );
        throw new UnauthorizedException('Tenant inativo');
      }

      // Revogar refresh token antigo
      await this.revokeRefreshToken(refreshTokenDto.refreshToken);

      // Gerar novos tokens
      const accessToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken();
      const expiresAt = new Date();
      const refreshExpiresIn =
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
      const days = refreshExpiresIn.includes('d')
        ? Number.parseInt(refreshExpiresIn)
        : 7;
      expiresAt.setDate(expiresAt.getDate() + days);

      // Salvar novo refresh token
      await this.saveRefreshToken(user.id, newRefreshToken, expiresAt);

      this.logger.log(`Token renovado com sucesso: ${user.id}`);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao renovar token: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException('Erro ao renovar token');
    }
  }

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    try {
      if (!userId) {
        throw new BadRequestException('ID do usuário é obrigatório');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao obter perfil: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException('Erro ao obter perfil');
    }
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    try {
      // Validar entrada
      if (
        !changePasswordDto.currentPassword ||
        !changePasswordDto.newPassword ||
        !changePasswordDto.confirmPassword
      ) {
        throw new BadRequestException('Todos os campos são obrigatórios');
      }

      // Validar confirmação de senha
      if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
        throw new BadRequestException('Nova senha e confirmação não coincidem');
      }

      // Validar se nova senha é diferente da atual
      if (changePasswordDto.newPassword === changePasswordDto.currentPassword) {
        throw new BadRequestException(
          'Nova senha deve ser diferente da senha atual',
        );
      }

      // Validar força da senha
      if (changePasswordDto.newPassword.length < 8) {
        throw new BadRequestException(
          'Nova senha deve ter no mínimo 8 caracteres',
        );
      }

      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Validar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.password,
      );

      if (!isCurrentPasswordValid) {
        this.logger.warn(
          `Tentativa de alterar senha com senha atual incorreta: ${userId}`,
        );
        throw new UnauthorizedException('Senha atual incorreta');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(
        changePasswordDto.newPassword,
        10,
      );

      // Atualizar senha
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Revogar todos os refresh tokens do usuário (forçar novo login)
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      });

      this.logger.log(`Senha alterada com sucesso: ${userId}`);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao alterar senha: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException('Erro ao alterar senha');
    }
  }

  private generateAccessToken(user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  }): string {
    const payload: {
      sub: string;
      email: string;
      role: string;
      tenantId: string;
    } = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '15m';
    // @ts-expect-error - expiresIn type compatibility issue with @nestjs/jwt
    return this.jwtService.sign(payload, {
      expiresIn,
    });
  }

  private generateRefreshToken(): string {
    return randomUUID();
  }

  private async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<void> {
    try {
      await this.prisma.refreshToken.create({
        data: {
          userId,
          token,
          expiresAt,
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao salvar refresh token: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException('Erro ao salvar refresh token');
    }
  }

  private async revokeRefreshToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        token,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private async validateRefreshToken(token: string) {
    try {
      if (!token) {
        throw new BadRequestException('Refresh token é obrigatório');
      }

      const refreshToken = await this.prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!refreshToken) {
        this.logger.warn(`Tentativa de usar refresh token inválido`);
        throw new UnauthorizedException('Refresh token inválido');
      }

      if (refreshToken.revokedAt) {
        this.logger.warn(
          `Tentativa de usar refresh token revogado: ${refreshToken.id}`,
        );
        throw new UnauthorizedException('Refresh token revogado');
      }

      if (refreshToken.expiresAt < new Date()) {
        this.logger.warn(
          `Tentativa de usar refresh token expirado: ${refreshToken.id}`,
        );
        throw new UnauthorizedException('Refresh token expirado');
      }

      return refreshToken;
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Erro ao validar refresh token: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      throw new InternalServerErrorException('Erro ao validar refresh token');
    }
  }

  /**
   * Busca o tenant (subdomain) pelo email do usuário
   */
  async findTenantByEmail(
    findTenantDto: FindTenantByEmailDto,
  ): Promise<{ subdomain: string; tenantId: string } | null> {
    try {
      const normalizedEmail = findTenantDto.email.toLowerCase().trim();

      // Buscar usuário pelo email com tenant ativo
      const user = await this.prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          isActive: true,
          tenant: {
            status: 'active',
          },
        },
        include: {
          tenant: {
            select: {
              id: true,
              subdomain: true,
              status: true,
            },
          },
        },
      });

      if (!user || !user.tenant) {
        return null;
      }

      return {
        subdomain: user.tenant.subdomain,
        tenantId: user.tenant.id,
      };
    } catch (error) {
      this.logger.error(
        `Erro ao buscar tenant por email ${findTenantDto.email}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      return null;
    }
  }
}
