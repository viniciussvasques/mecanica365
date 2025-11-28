# Recomendações Técnicas - Backend

**Versão:** 1.0  
**Data:** 2024  
**Objetivo:** Definir stack tecnológico e padrões antes de iniciar desenvolvimento

---

## 🎯 Decisão Principal: NestJS + TypeScript

### Recomendação Final

**Backend Principal:** NestJS 10+ com TypeScript 5+  
**ORM:** Prisma 5+  
**Validação:** class-validator + class-transformer  
**Documentação:** Swagger/OpenAPI  
**Testes:** Jest

### Por que NestJS?

#### ✅ Vantagens

1. **Arquitetura Modular**
   - Perfeito para multi-tenant
   - Separação clara de responsabilidades
   - Fácil manutenção e escalabilidade

2. **TypeScript Nativo**
   - Type safety end-to-end (frontend + backend)
   - Melhor DX (Developer Experience)
   - Menos bugs em produção

3. **Ecosistema Maduro**
   - Muitas bibliotecas disponíveis
   - Comunidade grande
   - Documentação excelente

4. **Padrões Enterprise**
   - Dependency Injection
   - Decorators
   - Guards, Interceptors, Pipes
   - Facilita testes

5. **Performance**
   - Baseado em Express (ou Fastify)
   - Suporta async/await nativamente
   - Escalável horizontalmente

6. **Multi-Tenant Friendly**
   - Fácil implementar middleware de tenant
   - Connection pooling por tenant
   - Isolamento de dados natural

#### ⚠️ Considerações

- Curva de aprendizado (se time não conhece)
- Mais verboso que Express puro
- Overhead inicial (mas compensa depois)

---

## 🔄 Alternativas Consideradas

### FastAPI (Python)

**Quando usar:**
- ✅ Serviço de AI/ML (já recomendado)
- ✅ Microserviços especializados
- ✅ Time com expertise em Python

**Por que não para backend principal:**
- ❌ Frontend é TypeScript (perde type safety)
- ❌ Ecossistema menor para ERP
- ❌ Menos padrões enterprise

**Decisão:** Usar FastAPI apenas para AI/ML Service

---

### Express.js (TypeScript)

**Quando usar:**
- ✅ Projetos pequenos
- ✅ Time experiente em Express
- ✅ Controle total necessário

**Por que não:**
- ❌ Sem estrutura padrão (cada um faz diferente)
- ❌ Mais código boilerplate
- ❌ Difícil manter em projetos grandes

**Decisão:** Não usar (NestJS é melhor para este projeto)

---

### AdonisJS

**Quando usar:**
- ✅ Projetos Laravel-like
- ✅ Time vindo de PHP

**Por que não:**
- ❌ Ecossistema menor
- ❌ Menos recursos disponíveis
- ❌ Comunidade menor

**Decisão:** Não usar

---

## 📦 Stack Tecnológico Recomendado

### Core Backend

```json
{
  "framework": "NestJS 10.4.0",
  "runtime": "Node.js 20 LTS",
  "language": "TypeScript 5.3.3",
  "orm": "Prisma 5.10.0",
  "validation": {
    "class-validator": "^0.14.1",
    "class-transformer": "^0.5.1"
  },
  "documentation": {
    "@nestjs/swagger": "^7.3.0"
  },
  "testing": {
    "jest": "^29.7.0",
    "@nestjs/testing": "^10.3.0"
  },
  "http": "Express (default)"
}
```

### Banco de Dados

```json
{
  "oltp": "PostgreSQL 16+",
  "cache": "Redis 7+",
  "analytics": "ClickHouse 24+ (futuro)",
  "migrations": "Prisma Migrate"
}
```

### Autenticação

```json
{
  "provider": "Auth0 (SaaS) ou Keycloak (self-hosted)",
  "strategy": "@nestjs/passport + passport-jwt",
  "mfa": "TOTP (Time-based One-Time Password)"
}
```

### Message Queue

```json
{
  "primary": "RabbitMQ 3.13+ (inicial)",
  "alternative": "Kafka (quando escalar)",
  "client": "@nestjs/microservices"
}
```

### Storage

```json
{
  "s3_compatible": "MinIO (dev) / AWS S3 (prod)",
  "client": "@aws-sdk/client-s3"
}
```

### Observabilidade

```json
{
  "metrics": "Prometheus + @willsoto/nestjs-prometheus",
  "logging": "Winston + @nestjs/logger",
  "tracing": "OpenTelemetry (opcional)"
}
```

---

## 🏗️ Estrutura de Projeto Recomendada

### Monorepo vs Multi-Repo

**Recomendação: Monorepo (Nx ou Turborepo)**

**Estrutura:**

```
erp-dealer/
├── apps/
│   ├── api/                    # NestJS Backend
│   ├── frontend/               # Next.js Frontend
│   ├── ai-service/            # FastAPI AI/ML Service
│   └── worker/                # Background Jobs (NestJS)
├── libs/
│   ├── shared/                # Código compartilhado
│   ├── database/              # Prisma schema e migrations
│   └── types/                 # TypeScript types compartilhados
├── docs/                      # Documentação
├── infrastructure/            # Terraform, K8s
└── package.json               # Root package.json
```

**Vantagens:**
- ✅ Type safety entre frontend e backend
- ✅ Código compartilhado fácil
- ✅ Deploy coordenado
- ✅ Refatoração mais segura

**Ferramenta:** Nx (recomendado) ou Turborepo

---

### Estrutura do Backend (apps/api)

```
apps/api/
├── src/
│   ├── main.ts                # Bootstrap
│   ├── app.module.ts         # Root module
│   │
│   ├── modules/              # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   └── guards/
│   │   │       └── jwt-auth.guard.ts
│   │   │
│   │   ├── tenants/
│   │   │   ├── tenants.module.ts
│   │   │   ├── tenants.controller.ts
│   │   │   ├── tenants.service.ts
│   │   │   └── repositories/
│   │   │       └── tenants.repository.ts
│   │   │
│   │   ├── vehicles/
│   │   │   ├── vehicles.module.ts
│   │   │   ├── vehicles.controller.ts
│   │   │   ├── vehicles.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-vehicle.dto.ts
│   │   │   │   └── update-vehicle.dto.ts
│   │   │   └── entities/
│   │   │       └── vehicle.entity.ts
│   │   │
│   │   └── ... (outros módulos)
│   │
│   ├── common/               # Código compartilhado
│   │   ├── decorators/
│   │   │   ├── tenant.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── all-exceptions.filter.ts
│   │   ├── guards/
│   │   │   ├── roles.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── middleware/
│   │   │   └── tenant-resolver.middleware.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   │
│   ├── config/               # Configurações
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── app.config.ts
│   │
│   ├── database/             # Database setup
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   │
│   └── health/               # Health checks
│       └── health.module.ts
│
├── prisma/
│   ├── schema.prisma         # Prisma schema
│   └── migrations/          # Migrations
│
├── test/                     # Testes
│   ├── e2e/
│   └── unit/
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── nest-cli.json
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## 📋 Padrões de Desenvolvimento

### 1. Arquitetura em Camadas

```
Controller → Service → Repository → Database
     ↓         ↓          ↓
    DTOs    Business   Data Access
           Logic
```

**Regras:**
- Controller: Apenas validação de entrada e formatação de saída
- Service: Lógica de negócio
- Repository: Acesso a dados (Prisma)
- DTOs: Validação de dados de entrada/saída

---

### 2. Nomenclatura

**Arquivos:**
- `*.module.ts` - Módulos NestJS
- `*.controller.ts` - Controllers
- `*.service.ts` - Services
- `*.repository.ts` - Repositories
- `*.entity.ts` - Entidades (Prisma types)
- `*.dto.ts` - Data Transfer Objects
- `*.guard.ts` - Guards
- `*.interceptor.ts` - Interceptors
- `*.pipe.ts` - Pipes
- `*.filter.ts` - Exception Filters

**Classes:**
- PascalCase: `VehiclesService`, `CreateVehicleDto`
- Interfaces: Prefixo `I` (opcional): `IVehicleRepository`

**Variáveis/Funções:**
- camelCase: `getVehicleById`, `vehicleId`

**Constantes:**
- UPPER_SNAKE_CASE: `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE`

---

### 3. DTOs (Data Transfer Objects)

**Sempre usar DTOs para entrada/saída:**

```typescript
// create-vehicle.dto.ts
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVehicleDto {
  @ApiProperty({ description: 'VIN do veículo' })
  @IsString()
  @IsOptional()
  vin?: string;

  @ApiProperty({ description: 'Placa do veículo' })
  @IsString()
  @IsOptional()
  placa?: string;

  @ApiProperty({ description: 'Preço do veículo' })
  @IsNumber()
  @Min(0)
  price: number;
}
```

---

### 4. Services

**Services contêm lógica de negócio:**

```typescript
// vehicles.service.ts
@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vehicleHistoryService: VehicleHistoryService,
  ) {}

  async create(tenantId: string, createVehicleDto: CreateVehicleDto) {
    // 1. Validações de negócio
    if (createVehicleDto.vin) {
      await this.validateVin(createVehicleDto.vin);
    }

    // 2. Criar veículo
    const vehicle = await this.prisma.vehicle.create({
      data: {
        ...createVehicleDto,
        tenantId,
      },
    });

    // 3. Disparar eventos
    if (createVehicleDto.vin || createVehicleDto.placa) {
      await this.vehicleHistoryService.queryAsync(
        tenantId,
        vehicle.id,
        createVehicleDto.vin,
        createVehicleDto.placa,
      );
    }

    return vehicle;
  }
}
```

---

### 5. Repositories (Opcional, mas Recomendado)

**Repositories abstraem acesso a dados:**

```typescript
// vehicles.repository.ts
@Injectable()
export class VehiclesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTenantAndId(tenantId: string, id: string) {
    return this.prisma.vehicle.findFirst({
      where: { id, tenantId },
    });
  }

  async findByTenantAndStatus(tenantId: string, status: string) {
    return this.prisma.vehicle.findMany({
      where: { tenantId, status },
    });
  }
}
```

**Vantagens:**
- Fácil testar (mock do repository)
- Trocar ORM sem mudar service
- Reutilizar queries

---

### 6. Multi-Tenancy

**Middleware para resolver tenant:**

```typescript
// tenant-resolver.middleware.ts
@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(private readonly tenantsService: TenantsService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host;
    const subdomain = host?.split('.')[0];

    if (!subdomain) {
      throw new BadRequestException('Subdomain required');
    }

    const tenant = await this.tenantsService.findBySubdomain(subdomain);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    req['tenant'] = tenant;
    req['tenantId'] = tenant.id;

    next();
  }
}
```

**Guard para validar tenant:**

```typescript
// tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const tenantId = request['tenantId'];

    if (!tenantId) {
      throw new UnauthorizedException('Tenant not resolved');
    }

    return true;
  }
}
```

---

### 7. Error Handling

**Exception Filter global:**

```typescript
// all-exceptions.filter.ts
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

---

### 8. Logging

**Usar logger do NestJS:**

```typescript
// vehicles.service.ts
@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  async create(tenantId: string, dto: CreateVehicleDto) {
    this.logger.log(`Creating vehicle for tenant ${tenantId}`);
    
    try {
      // ...
    } catch (error) {
      this.logger.error(`Failed to create vehicle: ${error.message}`, error.stack);
      throw error;
    }
  }
}
```

---

### 9. Testes

**Estrutura de testes:**

```typescript
// vehicles.service.spec.ts
describe('VehiclesService', () => {
  let service: VehiclesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: PrismaService,
          useValue: {
            vehicle: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create a vehicle', async () => {
    const dto = { vin: 'ABC123', price: 50000 };
    const tenantId = 'tenant-1';

    jest.spyOn(prisma.vehicle, 'create').mockResolvedValue({
      id: 'vehicle-1',
      ...dto,
      tenantId,
    } as any);

    const result = await service.create(tenantId, dto);

    expect(result).toBeDefined();
    expect(prisma.vehicle.create).toHaveBeenCalledWith({
      data: { ...dto, tenantId },
    });
  });
});
```

---

## 🔧 Configurações Recomendadas

### TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["src/*"],
      "@common/*": ["src/common/*"],
      "@modules/*": ["src/modules/*"]
    }
  }
}
```

### ESLint (.eslintrc.js)

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

### Prettier (.prettierrc)

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 100
}
```

---

## 🚀 Setup Inicial Recomendado

### Passo 1: Criar Projeto NestJS

```bash
# Instalar NestJS CLI globalmente
npm i -g @nestjs/cli

# Criar projeto
nest new api

# Ou usar Nx
npx create-nx-workspace@latest erp-dealer
```

### Passo 2: Instalar Dependências

```bash
cd apps/api

# Core
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install reflect-metadata rxjs

# Database
npm install @prisma/client
npm install -D prisma

# Validation
npm install class-validator class-transformer

# Swagger
npm install @nestjs/swagger swagger-ui-express

# Auth
npm install @nestjs/passport @nestjs/jwt passport passport-jwt
npm install bcrypt

# Redis
npm install ioredis @nestjs-modules/ioredis

# Testing
npm install -D @nestjs/testing jest @types/jest ts-jest
```

### Passo 3: Configurar Prisma

```bash
# Inicializar Prisma
npx prisma init

# Criar schema inicial
# Editar prisma/schema.prisma

# Gerar cliente
npx prisma generate

# Criar migration
npx prisma migrate dev --name init
```

---

## ✅ Checklist Antes de Começar

- [ ] Node.js 20 LTS instalado
- [ ] NestJS CLI instalado
- [ ] Projeto criado (NestJS ou Nx)
- [ ] Prisma configurado
- [ ] ESLint + Prettier configurados
- [ ] Git inicializado
- [ ] .env.example criado
- [ ] README.md do backend criado
- [ ] Estrutura de pastas criada
- [ ] Health check implementado
- [ ] Swagger configurado

---

## 📚 Recursos Úteis

### Documentação Oficial

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Cursos/Tutoriais

- NestJS Official Course
- Prisma Learn
- TypeScript Deep Dive

---

## 🎯 Próximos Passos

1. **Criar projeto NestJS**
2. **Configurar Prisma**
3. **Implementar módulo de Tenants**
4. **Implementar middleware de tenant resolver**
5. **Implementar módulo de Auth**
6. **Criar primeiro módulo de negócio (Vehicles)**

---

**Documento criado em:** [Data]  
**Última atualização:** [Data]  
**Versão:** 1.0

