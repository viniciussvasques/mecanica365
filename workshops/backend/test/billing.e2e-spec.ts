import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { DocumentType } from '../src/modules/core/tenants/dto/create-tenant.dto';

describe('BillingController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let testTenantId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clear database
    await prisma.subscription.deleteMany();
    await prisma.tenant.deleteMany();

    // Create tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Billing Test Tenant',
        documentType: DocumentType.CNPJ,
        document: '11222333000181',
        subdomain: 'billing-test',
        plan: 'workshops_starter',
        status: 'active',
      },
    });
    testTenantId = tenant.id;

    // Create subscription
    const subscription = await prisma.subscription.create({
      data: {
        tenantId: testTenantId,
        plan: 'workshops_starter',
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        activeFeatures: ['basic_service_orders', 'basic_customers'],
        serviceOrdersLimit: 50,
        serviceOrdersUsed: 0,
        partsLimit: 100,
        billingCycle: 'monthly',
      },
    });
    subscriptionId = subscription.id;

    // Create admin user
    const hashedPassword = await import('bcrypt').then((m) =>
      m.default.hash('Admin123', 10),
    );
    await prisma.user.create({
      data: {
        tenantId: testTenantId,
        email: 'admin@billing.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    });

    // Login to get access token
    const loginResponse = await request(app.getHttpServer() as App)
      .post('/api/auth/login')
      .set('Host', 'billing-test.localhost:3001')
      .send({ email: 'admin@billing.com', password: 'Admin123' });

    const loginBody = loginResponse.body as { accessToken: string };
    accessToken = loginBody.accessToken;
  });

  afterAll(async () => {
    await prisma.subscription.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    await app.close();
  });

  it('/api/billing/subscription (GET) - should get current subscription', async () => {
    const response = await request(app.getHttpServer() as App)
      .get('/api/billing/subscription')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Tenant-Subdomain', 'billing-test')
      .expect(200);

    const body = response.body as { id: string; plan: string };
    expect(body).toHaveProperty('id', subscriptionId);
    expect(body.plan).toBe('workshops_starter');
  });

  it('/api/billing/plans (GET) - should list available plans', async () => {
    const response = await request(app.getHttpServer() as App)
      .get('/api/billing/plans')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as Array<{ id: string; name: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(3);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('name');
  });

  it('/api/billing/subscription/upgrade (POST) - should upgrade plan', async () => {
    const response = await request(app.getHttpServer() as App)
      .post('/api/billing/subscription/upgrade')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Tenant-Subdomain', 'billing-test')
      .send({ newPlan: 'workshops_professional' })
      .expect(200);

    const body = response.body as { plan: string; serviceOrdersLimit: number };
    expect(body.plan).toBe('workshops_professional');
    expect(body.serviceOrdersLimit).toBe(500);
  });

  it('/api/billing/subscription/downgrade (POST) - should downgrade plan', async () => {
    const response = await request(app.getHttpServer() as App)
      .post('/api/billing/subscription/downgrade')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Tenant-Subdomain', 'billing-test')
      .send({ newPlan: 'workshops_starter' })
      .expect(200);

    const body = response.body as { plan: string; serviceOrdersLimit: number };
    expect(body.plan).toBe('workshops_starter');
    expect(body.serviceOrdersLimit).toBe(50);
  });

  it('/api/billing/subscription/cancel (POST) - should cancel subscription', async () => {
    const response = await request(app.getHttpServer() as App)
      .post('/api/billing/subscription/cancel')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Tenant-Subdomain', 'billing-test')
      .expect(200);

    const body = response.body as { status: string };
    expect(body.status).toBe('cancelled');
  });

  it('/api/billing/subscription/reactivate (POST) - should reactivate subscription', async () => {
    const response = await request(app.getHttpServer() as App)
      .post('/api/billing/subscription/reactivate')
      .set('Authorization', `Bearer ${accessToken}`)
      .set('X-Tenant-Subdomain', 'billing-test')
      .expect(200);

    const body = response.body as { status: string };
    expect(body.status).toBe('active');
  });
});
