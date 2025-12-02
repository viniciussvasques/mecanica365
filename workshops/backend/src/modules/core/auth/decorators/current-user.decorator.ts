import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
  };
}

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    // Se um campo específico foi solicitado (ex: 'id', 'role'), retornar apenas esse campo
    if (data && typeof data === 'string') {
      return user[data as keyof typeof user];
    }

    // Caso contrário, retornar o objeto user completo
    return user;
  },
);
