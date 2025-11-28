import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/auth/guards/roles.guard';
import { Roles } from '../../core/auth/decorators/roles.decorator';
import { BulkEmailService } from './bulk-email.service';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';
import { BulkEmailResponseDto } from './dto/bulk-email-response.dto';
import { PrismaService } from '../../../database/prisma.service';

@ApiTags('Admin - Email')
@Controller('admin/email')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('admin')
export class AdminEmailController {
  constructor(
    private readonly bulkEmailService: BulkEmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar emails em massa',
    description:
      'Envia emails para múltiplos destinatários. Apenas administradores podem usar este endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Emails enviados com sucesso',
    type: BulkEmailResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Não autenticado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão (apenas admin)',
  })
  async sendBulkEmail(
    @Body() sendBulkEmailDto: SendBulkEmailDto,
  ): Promise<BulkEmailResponseDto> {
    const result = await this.bulkEmailService.sendBulkEmail({
      recipients: sendBulkEmailDto.recipients,
      subject: sendBulkEmailDto.subject,
      htmlContent: sendBulkEmailDto.htmlContent,
      textContent: sendBulkEmailDto.textContent,
      fromName: sendBulkEmailDto.fromName || 'Mecânica365',
      replyTo: sendBulkEmailDto.replyTo,
    });

    return {
      ...result,
      message: `Disparo concluído: ${result.sent} enviados, ${result.failed} falhas de ${result.total} total`,
    };
  }

  @Get('recipients')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar possíveis destinatários',
    description:
      'Retorna lista de emails de usuários ativos que podem receber emails em massa. Apenas administradores.',
  })
  @ApiQuery({
    name: 'tenantId',
    required: false,
    description: 'Filtrar por tenant específico',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: 'Filtrar por role (admin, manager, technician, etc)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de destinatários',
    schema: {
      type: 'object',
      properties: {
        recipients: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              tenantId: { type: 'string' },
              tenantName: { type: 'string' },
            },
          },
        },
        total: { type: 'number' },
      },
    },
  })
  async getRecipients(
    @Query('tenantId') tenantId?: string,
    @Query('role') role?: string,
  ) {
    const where: {
      isActive: boolean;
      tenantId?: string;
      role?: string;
    } = {
      isActive: true,
    };

    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (role) {
      where.role = role;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        email: true,
        name: true,
        role: true,
        tenantId: true,
        tenant: {
          select: {
            name: true,
            subdomain: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const recipients = users.map((user) => ({
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      tenantName: user.tenant?.name || 'N/A',
      tenantSubdomain: user.tenant?.subdomain || 'N/A',
    }));

    return {
      recipients,
      total: recipients.length,
    };
  }

  @Get('templates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar templates disponíveis',
    description:
      'Retorna informações sobre variáveis disponíveis nos templates',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates e variáveis disponíveis',
    schema: {
      type: 'object',
      properties: {
        variables: {
          type: 'object',
          properties: {
            default: {
              type: 'array',
              items: { type: 'string' },
              description: 'Variáveis padrão disponíveis',
            },
            custom: {
              type: 'string',
              description:
                'Variáveis customizadas podem ser adicionadas via customData',
            },
          },
        },
        examples: {
          type: 'object',
          properties: {
            html: { type: 'string' },
            subject: { type: 'string' },
          },
        },
      },
    },
  })
  getTemplates() {
    return {
      variables: {
        default: ['{{name}}', '{{email}}'],
        custom:
          'Variáveis customizadas podem ser adicionadas via customData no objeto recipient. Ex: {{empresa}}, {{plano}}, etc.',
      },
      examples: {
        html: `
          <h1>Olá {{name}}</h1>
          <p>Seu email é {{email}}</p>
          <p>Sua empresa: {{empresa}}</p>
          <p>Seu plano: {{plano}}</p>
        `,
        subject: 'Atualização para {{name}} - {{empresa}}',
      },
      usage: {
        description:
          'Use {{variableName}} no HTML e subject. Variáveis padrão: name, email. Variáveis customizadas via customData.',
        example: {
          recipient: {
            email: 'cliente@example.com',
            name: 'João Silva',
            customData: {
              empresa: 'Oficina XYZ',
              plano: 'Professional',
            },
          },
        },
      },
    };
  }
}
