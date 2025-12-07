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

  /**
   * Solicita recuperação de senha
   * Gera um token único e envia email com link para reset
   */
  async forgotPassword(
    email: string,
    tenantId: string,
  ): Promise<{ message: string }> {
    const normalizedEmail = email.toLowerCase().trim();

    // Buscar usuário
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

    // SEMPRE retornar sucesso para não revelar se email existe
    if (!user || !user.isActive) {
      this.logger.warn(
        `Tentativa de recuperação de senha para email inexistente ou inativo: ${normalizedEmail}`,
      );
      return {
        message:
          'Se o email existir em nossa base, você receberá as instruções de recuperação.',
      };
    }

    // Gerar token único
    const resetToken = randomUUID() + '-' + randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Salvar token no banco
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: expiresAt,
      },
    });

    this.logger.log(
      `Token de recuperação gerado para usuário ${user.email} (tenant: ${tenantId})`,
    );

    // Retornar dados para envio de email (será tratado no controller)
    return {
      message:
        'Se o email existir em nossa base, você receberá as instruções de recuperação.',
      // Dados internos para envio de email (não expostos na resposta)
      // O controller irá usar esses dados para enviar o email
    };
  }

  /**
   * Busca usuário por token de reset para envio de email
   * Uso interno - não exposto via API
   */
  async getUserForPasswordReset(
    email: string,
    tenantId: string,
  ): Promise<{
    user: { id: string; email: string; name: string };
    tenant: { subdomain: string; name: string };
    resetToken: string;
    resetUrl: string;
  } | null> {
    const normalizedEmail = email.toLowerCase().trim();

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

    if (!user || !user.isActive || !user.passwordResetToken) {
      return null;
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      `http://${user.tenant.subdomain}.localhost:3000`;
    const resetUrl = `${frontendUrl}/reset-password?token=${user.passwordResetToken}`;

    return {
      user: { id: user.id, email: user.email, name: user.name },
      tenant: { subdomain: user.tenant.subdomain, name: user.tenant.name },
      resetToken: user.passwordResetToken,
      resetUrl,
    };
  }

  /**
   * Redefine a senha usando o token
   */
  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Buscar usuário pelo token
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: {
          gt: new Date(), // Token ainda não expirou
        },
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Token inválido ou expirado. Solicite uma nova recuperação de senha.',
      );
    }

    // Validar se usuário está ativo
    if (!user.isActive) {
      throw new BadRequestException(
        'Usuário inativo. Entre em contato com o suporte.',
      );
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha e limpar token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    this.logger.log(
      `Senha redefinida com sucesso para usuário ${user.email} (tenant: ${user.tenantId})`,
    );

    return {
      message: 'Senha alterada com sucesso! Você já pode fazer login.',
    };
  }

  /**
   * Busca usuário pelo token de reset (para validação)
   */
  async validateResetToken(
    token: string,
  ): Promise<{ valid: boolean; email?: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: {
          gt: new Date(),
        },
        isActive: true,
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      return { valid: false };
    }

    // Mascarar email para segurança
    const emailParts = user.email.split('@');
    const maskedEmail = emailParts[0].substring(0, 2) + '***@' + emailParts[1];

    return { valid: true, email: maskedEmail };
  }

  /**
   * Reset de senha pelo admin (gera senha temporária)
   */
  async adminResetPassword(
    adminUserId: string,
    targetUserId: string,
    tenantId: string,
  ): Promise<{
    tempPassword: string;
    user: { id: string; email: string; name: string };
  }> {
    // Verificar se admin tem permissão
    const adminUser = await this.prisma.user.findUnique({
      where: { id: adminUserId },
    });

    if (!adminUser || !['admin', 'manager'].includes(adminUser.role)) {
      throw new UnauthorizedException('Sem permissão para redefinir senhas');
    }

    // Buscar usuário alvo
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { tenant: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se é do mesmo tenant
    if (targetUser.tenantId !== tenantId) {
      throw new UnauthorizedException('Sem permissão para este usuário');
    }

    // Gerar senha temporária
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Atualizar senha
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    this.logger.log(
      `Senha redefinida pelo admin ${adminUser.email} para usuário ${targetUser.email}`,
    );

    return {
      tempPassword,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
      },
    };
  }

  /**
   * Gera uma senha temporária segura
   */
  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const specials = '!@#$%';
    let password = '';

    // 6 caracteres alfanuméricos
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 1 especial
    password += specials.charAt(Math.floor(Math.random() * specials.length));

    // 1 número
    password += Math.floor(Math.random() * 10);

    return password;
  }
}
