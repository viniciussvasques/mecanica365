import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { DocumentType } from '../src/modules/core/tenants/dto/create-tenant.dto';
import * as bcrypt from 'bcrypt';

describe('ElevatorsController (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let testTenantId: string;
  let testUserEmail: string;
  let testUserPassword: string;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Criar tenant de teste
    const tenant = await prismaService.tenant.create({
      data: {
        name: 'Test Elevators Tenant',
        documentType: DocumentType.CNPJ,
        document: '12345678000199',
        subdomain: 'test-elevators',
        plan: 'workshops_starter',
        status: 'active',
      },
    });
    testTenantId = tenant.id;

    // Criar usuário de teste
    testUserEmail = 'elevators@test.com';
    testUserPassword = 'TestPassword123';
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    await prismaService.user.create({
      data: {
        tenantId: testTenantId,
        email: testUserEmail,
        name: 'Test User',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    });

    // Login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('X-Tenant-Subdomain', 'test-elevators')
      .send({
        email: testUserEmail,
        password: testUserPassword,
      });

    if (loginResponse.status === 200) {
      const body = loginResponse.body as { accessToken: string };
      accessToken = body.accessToken;
    }
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (prismaService) {
      await prismaService.elevator.deleteMany({
        where: { tenantId: testTenantId },
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

  describe('/elevators (POST)', () => {
    it('deve criar um elevador com sucesso', () => {
      return request(app.getHttpServer())
        .post('/api/elevators')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .send({
          name: 'Elevador Teste',
          number: 'ELEV-TEST-001',
          type: 'hydraulic',
          capacity: 3.5,
          status: 'free',
          location: 'Setor Teste',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Elevador Teste');
          expect(res.body.number).toBe('ELEV-TEST-001');
        });
    });

    it('deve retornar 409 quando número já existe', async () => {
      // Criar primeiro elevador
      await request(app.getHttpServer())
        .post('/api/elevators')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .send({
          name: 'Elevador 1',
          number: 'ELEV-DUPLICATE',
          capacity: 3.5,
        });

      // Tentar criar com mesmo número
      return request(app.getHttpServer())
        .post('/api/elevators')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .send({
          name: 'Elevador 2',
          number: 'ELEV-DUPLICATE',
          capacity: 4.0,
        })
        .expect(409);
    });

    it('deve retornar 400 quando dados inválidos', () => {
      return request(app.getHttpServer())
        .post('/api/elevators')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .send({
          name: '', // Nome vazio
          number: 'ELEV-INVALID',
          capacity: -1, // Capacidade negativa
        })
        .expect(400);
    });
  });

  describe('/elevators (GET)', () => {
    it('deve listar elevadores com sucesso', async () => {
      // Criar alguns elevadores
      await prismaService.elevator.createMany({
        data: [
          {
            tenantId: testTenantId,
            name: 'Elevador 1',
            number: 'ELEV-LIST-001',
            type: 'hydraulic',
            capacity: 3.5,
            status: 'free',
          },
          {
            tenantId: testTenantId,
            name: 'Elevador 2',
            number: 'ELEV-LIST-002',
            type: 'pneumatic',
            capacity: 4.0,
            status: 'occupied',
          },
        ],
      });

      return request(app.getHttpServer())
        .get('/api/elevators')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('deve filtrar por status', () => {
      return request(app.getHttpServer())
        .get('/api/elevators?status=free')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((elevator: { status: string }) => {
            expect(elevator.status).toBe('free');
          });
        });
    });

    it('deve aplicar paginação', () => {
      return request(app.getHttpServer())
        .get('/api/elevators?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });
  });

  describe('/elevators/:id (GET)', () => {
    let elevatorId: string;

    beforeAll(async () => {
      const elevator = await prismaService.elevator.create({
        data: {
          tenantId: testTenantId,
          name: 'Elevador Detalhes',
          number: 'ELEV-DETAILS',
          type: 'hydraulic',
          capacity: 3.5,
          status: 'free',
        },
      });
      elevatorId = elevator.id;
    });

    it('deve buscar elevador por ID com sucesso', () => {
      return request(app.getHttpServer())
        .get(`/api/elevators/${elevatorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', elevatorId);
          expect(res.body.name).toBe('Elevador Detalhes');
        });
    });

    it('deve retornar 404 quando elevador não existe', () => {
      return request(app.getHttpServer())
        .get('/api/elevators/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .expect(404);
    });
  });

  describe('/elevators/:id (PATCH)', () => {
    let elevatorId: string;

    beforeAll(async () => {
      const elevator = await prismaService.elevator.create({
        data: {
          tenantId: testTenantId,
          name: 'Elevador Update',
          number: 'ELEV-UPDATE',
          type: 'hydraulic',
          capacity: 3.5,
          status: 'free',
        },
      });
      elevatorId = elevator.id;
    });

    it('deve atualizar elevador com sucesso', () => {
      return request(app.getHttpServer())
        .patch(`/api/elevators/${elevatorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .send({
          name: 'Elevador Atualizado',
          status: 'occupied',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Elevador Atualizado');
          expect(res.body.status).toBe('occupied');
        });
    });

    it('deve retornar 404 quando elevador não existe', () => {
      return request(app.getHttpServer())
        .patch('/api/elevators/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .send({
          name: 'Test',
        })
        .expect(404);
    });
  });

  describe('/elevators/:id (DELETE)', () => {
    let elevatorId: string;

    beforeEach(async () => {
      const elevator = await prismaService.elevator.create({
        data: {
          tenantId: testTenantId,
          name: 'Elevador Delete',
          number: 'ELEV-DELETE',
          type: 'hydraulic',
          capacity: 3.5,
          status: 'free',
        },
      });
      elevatorId = elevator.id;
    });

    it('deve remover elevador com sucesso', () => {
      return request(app.getHttpServer())
        .delete(`/api/elevators/${elevatorId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .expect(204);
    });

    it('deve retornar 404 quando elevador não existe', () => {
      return request(app.getHttpServer())
        .delete('/api/elevators/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', testTenantId)
        .expect(404);
    });
  });
});
