import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('ServiceOrdersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let tenantId: string;
  let customerId: string;
  let serviceOrderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Criar tenant e usuário para testes
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant Service Orders',
        subdomain: 'test-service-orders',
        plan: 'professional',
        document: '12345678000198',
      },
    });
    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: {
        tenantId,
        email: 'test-service-orders@test.com',
        name: 'Test User',
        password: '$2b$10$rQZ8vJZ8vJZ8vJZ8vJZ8vOeZ8vJZ8vJZ8vJZ8vJZ8vJZ8vJZ8vJZ8v',
        role: 'admin',
      },
    });

    // Login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test-service-orders@test.com',
        password: 'password123',
      });

    if (loginResponse.status === 200) {
      accessToken = loginResponse.body.accessToken;
    } else {
      accessToken = 'test-token';
    }

    // Criar cliente para testes
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: 'Cliente Teste Service Orders',
        phone: '(11) 99999-9998',
        email: 'cliente-so@test.com',
        documentType: 'cpf',
        cpf: '12345678902',
      },
    });
    customerId = customer.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (serviceOrderId) {
      await prisma.serviceOrder.deleteMany({ where: { tenantId } });
    }
    await prisma.customer.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });

    await app.close();
  });

  describe('/service-orders (POST)', () => {
    it('deve criar uma ordem de serviço', () => {
      return request(app.getHttpServer())
        .post('/api/service-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', tenantId)
        .send({
          customerId,
          vehiclePlaca: 'TEST123',
          vehicleMake: 'Honda',
          vehicleModel: 'Civic',
          vehicleYear: 2020,
          status: 'scheduled',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('number');
          expect(res.body.number).toMatch(/^OS-/);
          serviceOrderId = res.body.id;
        });
    });
  });

  describe('/service-orders (GET)', () => {
    it('deve listar ordens de serviço', () => {
      return request(app.getHttpServer())
        .get('/api/service-orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', tenantId)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
        });
    });
  });

  describe('/service-orders/:id (GET)', () => {
    it('deve retornar ordem de serviço por ID', () => {
      return request(app.getHttpServer())
        .get(`/api/service-orders/${serviceOrderId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', tenantId)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', serviceOrderId);
        });
    });
  });

  describe('/service-orders/:id/start (POST)', () => {
    it('deve iniciar ordem de serviço', () => {
      return request(app.getHttpServer())
        .post(`/api/service-orders/${serviceOrderId}/start`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', tenantId)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('in_progress');
          expect(res.body.startedAt).toBeDefined();
        });
    });
  });

  describe('/service-orders/:id/complete (POST)', () => {
    it('deve finalizar ordem de serviço', () => {
      return request(app.getHttpServer())
        .post(`/api/service-orders/${serviceOrderId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', tenantId)
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('completed');
          expect(res.body.completedAt).toBeDefined();
        });
    });
  });
});

