import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('QuotesController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let tenantId: string;
  let customerId: string;
  let vehicleId: string;
  let quoteId: string;

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
        name: 'Test Tenant Quotes',
        subdomain: 'test-quotes',
        plan: 'professional',
        document: '12345678000199',
      },
    });
    tenantId = tenant.id;

    await prisma.user.create({
      data: {
        tenantId,
        email: 'test-quotes@test.com',
        name: 'Test User',
        password:
          '$2b$10$rQZ8vJZ8vJZ8vJZ8vJZ8vOeZ8vJZ8vJZ8vJZ8vJZ8vJZ8vJZ8vJZ8v',
        role: 'admin',
      },
    });

    // Login para obter token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'test-quotes@test.com',
        password: 'password123',
      });

    if (loginResponse.status === 200) {
      accessToken = loginResponse.body.accessToken;
    } else {
      // Se login falhar, criar token manualmente (para testes)
      accessToken = 'test-token';
    }

    // Criar cliente e veículo para testes
    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: 'Cliente Teste Quotes',
        phone: '(11) 99999-9999',
        email: 'cliente@test.com',
        documentType: 'cpf',
        cpf: '12345678901',
      },
    });
    customerId = customer.id;

    const vehicle = await prisma.customerVehicle.create({
      data: {
        customerId,
        placa: 'TEST123',
        make: 'Honda',
        model: 'Civic',
        year: 2020,
      },
    });
    vehicleId = vehicle.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (quoteId) {
      await prisma.quote.deleteMany({ where: { tenantId } });
    }
    await prisma.customerVehicle.deleteMany({ where: { customerId } });
    await prisma.customer.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });

    await app.close();
  });

  describe('/quotes (POST)', () => {
    it('deve criar um orçamento', () => {
      return request(app.getHttpServer())
        .post('/api/quotes')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', tenantId)
        .send({
          customerId,
          vehicleId,
          items: [
            {
              type: 'service',
              name: 'Troca de óleo',
              description: 'Troca de óleo do motor',
              quantity: 1,
              unitCost: 150,
              hours: 1.5,
            },
          ],
          laborCost: 200,
          partsCost: 300,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('number');
          expect(res.body.number).toMatch(/^ORC-/);
          quoteId = res.body.id;
        });
    });

    it('deve retornar erro 400 se não houver itens', () => {
      return request(app.getHttpServer())
        .post('/api/quotes')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', tenantId)
        .send({
          customerId,
          vehicleId,
          items: [],
        })
        .expect(400);
    });
  });

  describe('/quotes (GET)', () => {
    it('deve listar orçamentos', () => {
      return request(app.getHttpServer())
        .get('/api/quotes')
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

  describe('/quotes/:id (GET)', () => {
    it('deve retornar orçamento por ID', () => {
      return request(app.getHttpServer())
        .get(`/api/quotes/${quoteId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', tenantId)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', quoteId);
        });
    });

    it('deve retornar 404 se orçamento não existir', () => {
      return request(app.getHttpServer())
        .get('/api/quotes/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', tenantId)
        .expect(404);
    });
  });

  describe('/quotes/:id/approve (POST)', () => {
    it('deve aprovar orçamento e criar Service Order', () => {
      return request(app.getHttpServer())
        .post(`/api/quotes/${quoteId}/approve`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('X-Tenant-Id', tenantId)
        .send({
          customerSignature: 'data:image/png;base64,test',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('quote');
          expect(res.body).toHaveProperty('serviceOrder');
          expect(res.body.quote.status).toBe('accepted');
        });
    });
  });
});
