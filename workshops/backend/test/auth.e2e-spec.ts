import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let testTenantId: string;
  let testUserId: string;
  let testUserEmail: string;
  let testUserPassword: string;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    // Configurar CORS e validação global
    await app.init();

    // Criar tenant de teste
    const tenant = await prismaService.tenant.create({
      data: {
        name: 'Test Tenant',
        cnpj: '12345678000199',
        subdomain: 'test-tenant',
        plan: 'workshops_starter',
        status: 'active',
      },
    });
    testTenantId = tenant.id;

    // Criar usuário de teste
    testUserEmail = 'test@example.com';
    testUserPassword = 'TestPassword123';
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    const user = await prismaService.user.create({
      data: {
        tenantId: testTenantId,
        email: testUserEmail,
        name: 'Test User',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (prismaService) {
      await prismaService.refreshToken.deleteMany({
        where: { userId: testUserId },
      });
      await prismaService.user.deleteMany({
        where: { tenantId: testTenantId },
      });
      await prismaService.tenant.delete({
        where: { id: testTenantId },
      });
    }
    await app.close();
  });

  describe('/api/auth/login (POST)', () => {
    it('deve fazer login com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Tenant-Subdomain', 'test-tenant')
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testUserEmail);

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('deve retornar 401 com credenciais inválidas', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Tenant-Subdomain', 'test-tenant')
        .send({
          email: testUserEmail,
          password: 'wrongPassword',
        })
        .expect(401);
    });

    it('deve retornar 400 com dados inválidos', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('X-Tenant-Subdomain', 'test-tenant')
        .send({
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('/api/auth/profile (GET)', () => {
    it('deve retornar perfil do usuário autenticado', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', testUserEmail);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('role');
    });

    it('deve retornar 401 sem token', async () => {
      await request(app.getHttpServer()).get('/api/auth/profile').expect(401);
    });

    it('deve retornar 401 com token inválido', async () => {
      await request(app.getHttpServer())
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/api/auth/refresh (POST)', () => {
    it('deve renovar token com sucesso', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.refreshToken).not.toBe(refreshToken);

      // Atualizar tokens para próximos testes
      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('deve retornar 401 com refresh token inválido', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        })
        .expect(401);
    });

    it('deve retornar 400 sem refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('/api/auth/change-password (PATCH)', () => {
    it('deve alterar senha com sucesso', async () => {
      const newPassword = 'NewPassword123';
      await request(app.getHttpServer())
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUserPassword,
          newPassword,
          confirmPassword: newPassword,
        })
        .expect(204);

      // Atualizar senha de teste para próximos testes
      testUserPassword = newPassword;
    });

    it('deve retornar 400 quando senhas não coincidem', async () => {
      await request(app.getHttpServer())
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testUserPassword,
          newPassword: 'NewPassword123',
          confirmPassword: 'DifferentPassword123',
        })
        .expect(400);
    });

    it('deve retornar 401 quando senha atual está incorreta', async () => {
      await request(app.getHttpServer())
        .patch('/api/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: 'WrongPassword123',
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        })
        .expect(401);
    });

    it('deve retornar 401 sem token', async () => {
      await request(app.getHttpServer())
        .patch('/api/auth/change-password')
        .send({
          currentPassword: testUserPassword,
          newPassword: 'NewPassword123',
          confirmPassword: 'NewPassword123',
        })
        .expect(401);
    });
  });

  describe('/api/auth/logout (POST)', () => {
    it('deve fazer logout com sucesso', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          refreshToken,
        })
        .expect(204);
    });

    it('deve retornar 401 sem token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .send({
          refreshToken,
        })
        .expect(401);
    });
  });
});
