import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { CreateAuditLogDto, AuditAction } from '../dto';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { method, url, user, body, params, query } = request;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const ipAddress =
      request.ip ||
      (request.connection as { remoteAddress?: string })?.remoteAddress ||
      '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const userAgent = request.get('user-agent') || '';

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

    const resourceId =
      (params as { id?: string })?.id ||
      (body as { id?: string })?.id ||
      (query as { id?: string })?.id;

    return next.handle().pipe(
      tap({
        next: () => {
          // Criar log de auditoria de forma assíncrona (não bloquear a resposta)

          this.logAudit(
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
          ).catch((error: unknown) => {
            // Não falhar a requisição se o log falhar
            console.error('Erro ao criar log de auditoria:', error);
          });
        },
        error: (error: unknown) => {
          // Log de erros também

          this.logError(
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
            error,
          ).catch((logError: unknown) => {
            console.error('Erro ao criar log de erro:', logError);
          });
        },
      }),
    );
  }

  private async logAudit(
    context: ExecutionContext,
    action: AuditAction,
    resourceType: string | undefined,
    resourceId: string | undefined,
    body: unknown,
    method: string,
    url: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any,
    ipAddress: string,
    userAgent: string,
  ): Promise<void> {
    try {
      const response = context.switchToHttp().getResponse();

      const statusCode =
        (response as { statusCode?: number })?.statusCode || 200;

      const dto: CreateAuditLogDto = {
        action,
        resourceType,
        resourceId,
        changes: this.sanitizeChanges(body),
        metadata: {
          method,
          url,
          statusCode,
        },
      };

      await this.auditService.create(
        (user as { tenantId?: string })?.tenantId || null,

        (user as { id?: string })?.id || null,
        dto,
        ipAddress,
        userAgent,
      );
    } catch (error) {
      // Não falhar a requisição se o log falhar
      console.error('Erro ao criar log de auditoria:', error);
    }
  }

  private async logError(
    context: ExecutionContext,
    action: AuditAction,
    resourceType: string | undefined,
    resourceId: string | undefined,
    body: unknown,
    method: string,
    url: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any,
    ipAddress: string,
    userAgent: string,
    error: unknown,
  ): Promise<void> {
    try {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const statusCode = (error as { status?: number })?.status || 500;

      const dto: CreateAuditLogDto = {
        action,
        resourceType,
        resourceId,
        changes: this.sanitizeChanges(body),
        metadata: {
          method,
          url,
          error: errorMessage,
          statusCode,
        },
      };

      await this.auditService.create(
        (user as { tenantId?: string })?.tenantId || null,

        (user as { id?: string })?.id || null,
        dto,
        ipAddress,
        userAgent,
      );
    } catch (logError) {
      console.error('Erro ao criar log de erro:', logError);
    }
  }

  private extractResourceType(url: string): string | undefined {
    // Extrair tipo de recurso da URL (ex: /api/customers -> customers)
    const match = url.match(/\/api\/([^/]+)/);
    return match ? match[1].replace(/s$/, '') : undefined; // Remove plural
  }

  private sanitizeChanges(body: unknown): Record<string, unknown> | undefined {
    if (!body || typeof body !== 'object') return undefined;

    // Remover campos sensíveis
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

    const sanitized = { ...(body as Record<string, unknown>) };

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}
