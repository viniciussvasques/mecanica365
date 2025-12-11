import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  BadRequestException,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { FindTenantByEmailDto } from './dto/find-tenant-by-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { TenantId } from '../../../common/decorators/tenant.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { TenantsService } from '../../core/tenants/tenants.service';
import { EmailService } from '../../shared/email/email.service';
import { getErrorMessage } from '../../../common/utils/error.utils';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly tenantsService: TenantsService,
    private readonly emailService: EmailService,
  ) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fazer login',
    description:
      'Autentica um usuário e retorna access token e refresh token. Requer header X-Tenant-Subdomain.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos (email ou senha não fornecidos)',
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas, usuário inativo ou tenant inativo',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Headers('x-tenant-subdomain') subdomain?: string,
    @TenantId() tenantId?: string,
  ): Promise<LoginResponseDto> {
    // Se tenantId não foi injetado pelo middleware (rota pública),
    // buscar pelo subdomain do header
    let resolvedTenantId = tenantId;

    if (!resolvedTenantId && subdomain) {
      try {
        const tenant = await this.tenantsService.findBySubdomain(subdomain);
        resolvedTenantId = tenant.id;
      } catch {
        throw new BadRequestException(
          `Tenant não encontrado: ${subdomain}. Verifique o subdomain e tente novamente.`,
        );
      }
    }

    if (!resolvedTenantId) {
      throw new BadRequestException(
        'Tenant subdomain é obrigatório. Use o header X-Tenant-Subdomain.',
      );
    }

    return this.authService.login(loginDto, resolvedTenantId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Fazer logout',
    description: 'Revoga o refresh token do usuário. Requer autenticação JWT.',
  })
  @ApiResponse({
    status: 204,
    description: 'Logout realizado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Refresh token não fornecido',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado (token inválido ou expirado)',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async logout(
    @CurrentUser() user: { id: string },
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<void> {
    return this.authService.logout(user.id, refreshTokenDto.refreshToken);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar access token',
    description:
      'Renova o access token usando um refresh token válido. Gera um novo par de tokens.',
  })
  @ApiResponse({
    status: 200,
    description: 'Token renovado com sucesso',
    schema: {
      type: 'object',
      properties: {
        accessToken: {
          type: 'string',
          description: 'Novo access token JWT',
        },
        refreshToken: {
          type: 'string',
          description: 'Novo refresh token UUID',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Refresh token não fornecido',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido, expirado ou revogado',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async refresh(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obter perfil do usuário autenticado',
    description:
      'Retorna os dados do perfil do usuário autenticado. Requer autenticação JWT.',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil obtido com sucesso',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado (token inválido ou expirado)',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async getProfile(
    @CurrentUser() user: { id: string },
  ): Promise<ProfileResponseDto> {
    return this.authService.getProfile(user.id);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Alterar senha',
    description:
      'Altera a senha do usuário autenticado. Requer autenticação JWT. Após alterar, todos os refresh tokens são revogados.',
  })
  @ApiResponse({
    status: 204,
    description: 'Senha alterada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description:
      'Dados inválidos (senhas não coincidem, nova senha igual à atual, senha muito curta)',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado (token inválido) ou senha atual incorreta',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @ApiResponse({
    status: 500,
    description: 'Erro interno do servidor',
  })
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('find-tenant')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Buscar tenant por email',
    description: 'Retorna o subdomain do tenant associado ao email do usuário',
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant encontrado',
    schema: {
      type: 'object',
      properties: {
        subdomain: { type: 'string' },
        tenantId: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Tenant não encontrado',
    schema: {
      type: 'object',
      properties: {
        subdomain: { type: 'null' },
        tenantId: { type: 'null' },
      },
    },
  })
  async findTenantByEmail(
    @Body() findTenantDto: FindTenantByEmailDto,
  ): Promise<{ subdomain: string; tenantId: string } | null> {
    return this.authService.findTenantByEmail(findTenantDto);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar recuperação de senha',
    description:
      'Envia um email com link para redefinição de senha. Requer header X-Tenant-Subdomain.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email enviado (se o email existir)',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Headers('x-tenant-subdomain') subdomain?: string,
    @TenantId() tenantId?: string,
  ): Promise<{ message: string }> {
    // Resolver tenant
    let resolvedTenantId = tenantId;

    if (!resolvedTenantId && subdomain) {
      try {
        const tenant = await this.tenantsService.findBySubdomain(subdomain);
        resolvedTenantId = tenant.id;
      } catch {
        // Retornar mensagem genérica para não revelar se tenant existe
        return {
          message:
            'Se o email existir em nossa base, você receberá as instruções de recuperação.',
        };
      }
    }

    if (!resolvedTenantId) {
      throw new BadRequestException(
        'Tenant subdomain é obrigatório. Use o header X-Tenant-Subdomain.',
      );
    }

    // Processar solicitação
    await this.authService.forgotPassword(
      forgotPasswordDto.email,
      resolvedTenantId,
    );

    // Buscar dados para envio de email
    const resetData = await this.authService.getUserForPasswordReset(
      forgotPasswordDto.email,
      resolvedTenantId,
    );

    if (resetData) {
      // Enviar email de recuperação
      try {
        await this.emailService.sendPasswordResetEmail({
          name: resetData.user.name,
          email: resetData.user.email,
          resetUrl: resetData.resetUrl,
          expiresInMinutes: 30,
          workshopName: resetData.tenant.name,
        });
      } catch (error: unknown) {
        this.logger.error(
          'Erro ao enviar email de recuperação:',
          getErrorMessage(error),
        );
        // Não falhar - apenas logar
      }
    }

    return {
      message:
        'Se o email existir em nossa base, você receberá as instruções de recuperação.',
    };
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redefinir senha com token',
    description: 'Redefine a senha usando o token recebido por email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Token inválido ou expirado',
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Get('validate-reset-token')
  @Public()
  @ApiOperation({
    summary: 'Validar token de reset',
    description: 'Verifica se o token de reset é válido.',
  })
  @ApiQuery({ name: 'token', required: true, type: String })
  @ApiResponse({
    status: 200,
    description: 'Token válido ou inválido',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean' },
        email: { type: 'string', nullable: true },
      },
    },
  })
  async validateResetToken(
    @Query('token') token: string,
  ): Promise<{ valid: boolean; email?: string }> {
    if (!token) {
      return { valid: false };
    }
    return this.authService.validateResetToken(token);
  }
}
