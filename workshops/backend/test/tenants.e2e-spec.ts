import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('TenantsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let testTenantId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clear database
    await prisma.tenant.deleteMany();

    // Create admin user for authentication
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Admin Tenant',
        cnpj: '11222333000181',
        subdomain: 'admin-tenant',
        plan: 'workshops_starter',
        status: 'active',
      },
    });
    testTenantId = tenant.id;

    const hashedPassword = await import('bcrypt').then((m) =>
      m.default.hash('Admin123', 10),
    );
    await prisma.user.create({
      data: {
        tenantId: testTenantId,
        email: 'admin@tenant.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    });

    // Login to get access token
    const loginResponse = await request(app.getHttpServer() as App)
      .post('/api/auth/login')
      .set('Host', 'admin-tenant.localhost:3001')
      .send({ email: 'admin@tenant.com', password: 'Admin123' });

    const loginBody = loginResponse.body as { accessToken: string };
    accessToken = loginBody.accessToken;
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany();
    await app.close();
  });

  it('/api/tenants (POST) - should create a tenant', async () => {
    const response = await request(app.getHttpServer() as App)
      .post('/api/tenants')
      .send({
        name: 'Nova Oficina',
        cnpj: '33444555000192',
        subdomain: 'nova-oficina',
        plan: 'workshops_starter',
        status: 'pending',
      })
      .expect(201);

    const body = response.body as {
      id: string;
      name: string;
      cnpj: string;
      subdomain: string;
    };
    expect(body).toHaveProperty('id');
    expect(body.name).toBe('Nova Oficina');
    expect(body.cnpj).toBe('33444555000192');
    expect(body.subdomain).toBe('nova-oficina');
  });

  it('/api/tenants (GET) - should list all tenants (admin)', async () => {
    const response = await request(app.getHttpServer() as App)
      .get('/api/tenants')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as unknown[];
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('/api/tenants/subdomain/:subdomain (GET) - should get tenant by subdomain', async () => {
    const response = await request(app.getHttpServer() as App)
      .get('/api/tenants/subdomain/admin-tenant')
      .expect(200);

    const body = response.body as { subdomain: string };
    expect(body.subdomain).toBe('admin-tenant');
  });

  it('/api/tenants/:id (GET) - should get tenant by id', async () => {
    const response = await request(app.getHttpServer() as App)
      .get(`/api/tenants/${testTenantId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as { id: string };
    expect(body.id).toBe(testTenantId);
  });

  it('/api/tenants/:id (PATCH) - should update tenant', async () => {
    const response = await request(app.getHttpServer() as App)
      .patch(`/api/tenants/${testTenantId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Oficina Atualizada',
      })
      .expect(200);

    const body = response.body as { name: string };
    expect(body.name).toBe('Oficina Atualizada');
  });

  it('/api/tenants/:id/activate (POST) - should activate tenant', async () => {
    // Create a pending tenant first
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Pending Tenant',
        cnpj: '44555666000103',
        subdomain: 'pending-tenant',
        plan: 'workshops_starter',
        status: 'pending',
      },
    });

    const response = await request(app.getHttpServer() as App)
      .post(`/api/tenants/${tenant.id}/activate`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as { status: string };
    expect(body.status).toBe('active');
  });

  it('/api/tenants/:id/suspend (POST) - should suspend tenant', async () => {
    const response = await request(app.getHttpServer() as App)
      .post(`/api/tenants/${testTenantId}/suspend`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as { status: string };
    expect(body.status).toBe('suspended');
  });

  it('/api/tenants/:id/cancel (POST) - should cancel tenant', async () => {
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Cancel Tenant',
        cnpj: '55666777000114',
        subdomain: 'cancel-tenant',
        plan: 'workshops_starter',
        status: 'active',
      },
    });

    const response = await request(app.getHttpServer() as App)
      .post(`/api/tenants/${tenant.id}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as { status: string };
    expect(body.status).toBe('cancelled');
  });

  it('/api/tenants (POST) - should reject duplicate CNPJ', async () => {
    await request(app.getHttpServer() as App)
      .post('/api/tenants')
      .send({
        name: 'Duplicate CNPJ',
        cnpj: '11222333000181', // Same as admin tenant
        subdomain: 'duplicate-cnpj',
        plan: 'workshops_starter',
      })
      .expect(409);
  });
});
