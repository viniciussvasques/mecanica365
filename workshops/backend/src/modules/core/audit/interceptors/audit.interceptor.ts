import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { CreateAuditLogDto, AuditAction } from '../dto';
import { getErrorMessage } from '@common/utils/error.utils';

interface AuditRequest {
  method: string;
  url: string;
  user?: { id: string; email?: string; name?: string };
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  ip?: string;
  connection?: { remoteAddress?: string };
  get?: (header: string) => string | undefined;
}

interface AuditContext {
  context: ExecutionContext;
  action: AuditAction;
  resourceType: string | undefined;
  resourceId: string | undefined;
  body: unknown;
  method: string;
  url: string;
  user?: { tenantId?: string; id?: string };
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuditRequest>();

    const { method, url, user, body, params, query } = request;
    const ipAddress = request.ip || request.connection?.remoteAddress || '';
    const userAgent = request.get?.('user-agent') || '';

    // Determinar ação baseada no método HTTP
    let action: AuditAction;
    switch (method) {
      case 'POST':
        action = AuditAction.CREATE;
        break;
      case 'PUT':
      case 'PATCH':
        action = AuditAction.UPDATE;
        break;
      case 'DELETE':
        action = AuditAction.DELETE;
        break;
      case 'GET':
        action = AuditAction.VIEW;
        break;
      default:
        action = AuditAction.VIEW;
    }

    // Extrair resourceType e resourceId da URL
    const resourceType = this.extractResourceType(url);

    const bodyWithId = body as { id?: string };
    const resourceId = params?.id || bodyWithId?.id || query?.id;

    return next.handle().pipe(
      tap({
        next: () => {
          // Criar log de auditoria de forma assíncrona (não bloquear a resposta)

          this.logAudit({
            context,
            action,
            resourceType,
            resourceId,
            body: body || {},
            method,
            url,
            user,
            ipAddress,
            userAgent,
          }).catch((error: unknown) => {
            // Não falhar a requisição se o log falhar
            this.logger.error(
              'Erro ao criar log de auditoria:',
              getErrorMessage(error),
            );
          });
        },
        error: (error: unknown) => {
          // Log de erros também

          this.logError(
            {
              context,
              action,
              resourceType,
              resourceId,
              body,
              method,
              url,
              user,
              ipAddress,
              userAgent,
            },
            error,
          ).catch((logError: unknown) => {
            this.logger.error(
              'Erro ao criar log de erro:',
              getErrorMessage(logError),
            );
          });
        },
      }),
    );
  }

  private async logAudit(auditContext: AuditContext): Promise<void> {
    try {
      const response = auditContext.context.switchToHttp().getResponse();

      const statusCode = response.statusCode || 200;

      const dto: CreateAuditLogDto = {
        action: auditContext.action,
        resourceType: auditContext.resourceType,
        resourceId: auditContext.resourceId,
        changes: this.sanitizeChanges(auditContext.body),
        metadata: {
          method: auditContext.method,
          url: auditContext.url,
          statusCode,
        },
      };

      await this.auditService.create(
        auditContext.user?.tenantId || null,
        auditContext.user?.id || null,
        dto,
        auditContext.ipAddress,
        auditContext.userAgent,
      );
    } catch (error: unknown) {
      // Não falhar a requisição se o log falhar
      this.logger.error(
        'Erro ao criar log de auditoria:',
        getErrorMessage(error),
      );
    }
  }

  private async logError(
    auditContext: AuditContext,
    error: unknown,
  ): Promise<void> {
    try {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const statusCode = (error as { status?: number })?.status || 500;

      const dto: CreateAuditLogDto = {
        action: auditContext.action,
        resourceType: auditContext.resourceType,
        resourceId: auditContext.resourceId,
        changes: this.sanitizeChanges(auditContext.body),
        metadata: {
          method: auditContext.method,
          url: auditContext.url,
          error: errorMessage,
          statusCode,
        },
      };

      await this.auditService.create(
        auditContext.user?.tenantId || null,
        auditContext.user?.id || null,
        dto,
        auditContext.ipAddress,
        auditContext.userAgent,
      );
    } catch (logError: unknown) {
      this.logger.error(
        'Erro ao criar log de erro:',
        getErrorMessage(logError),
      );
    }
  }

  private extractResourceType(url: string): string | undefined {
    // Extrair tipo de recurso da URL (ex: /api/customers -> customers)
    const regex = /\/api\/([^/]+)/;
    const match = regex.exec(url);
    return match ? match[1].replaceAll(/s$/, '') : undefined; // Remove plural
  }

  private sanitizeChanges(body: unknown): Record<string, unknown> | undefined {
    if (!body || typeof body !== 'object') return undefined;

    // Remover campos sensíveis
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

    const sanitized = { ...(body as Record<string, unknown>) };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    }

    return sanitized;
  }
}
