import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { DocumentType } from '../src/modules/core/tenants/dto/create-tenant.dto';
import * as bcrypt from 'bcrypt';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let testTenantId: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clear database
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();

    // Create a test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'E2E Test Tenant',
        documentType: DocumentType.CNPJ,
        document: '11223344000155',
        subdomain: 'e2e-users',
        plan: 'workshops_starter',
        status: 'active',
      },
    });
    testTenantId = tenant.id;

    // Create admin user for authentication
    const hashedPassword = await bcrypt.hash('Admin123', 10);
    await prisma.user.create({
      data: {
        tenantId: testTenantId,
        email: 'admin@e2e.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    });

    // Login to get access token
    const loginResponse = await request(app.getHttpServer() as App)
      .post('/api/auth/login')
      .set('Host', 'e2e-users.localhost:3001')
      .send({ email: 'admin@e2e.com', password: 'Admin123' });

    const loginBody = loginResponse.body as { accessToken: string };
    accessToken = loginBody.accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    await app.close();
  });

  it('/api/users (POST) - should create a user', async () => {
    const response = await request(app.getHttpServer() as App)
      .post('/api/users')
      .set('Host', 'e2e-users.localhost:3001')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: 'newuser@e2e.com',
        name: 'New User',
        password: 'Password123',
        role: 'technician',
        isActive: true,
      })
      .expect(201);

    const body = response.body as {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    expect(body).toHaveProperty('id');
    expect(body.email).toBe('newuser@e2e.com');
    expect(body.name).toBe('New User');
    expect(body.role).toBe('technician');
    expect(body).not.toHaveProperty('password');

    testUserId = body.id;
  });

  it('/api/users (GET) - should list all users', async () => {
    const response = await request(app.getHttpServer() as App)
      .get('/api/users')
      .set('Host', 'e2e-users.localhost:3001')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as Array<{
      id: string;
      email: string;
      name: string;
      role: string;
    }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).not.toHaveProperty('password');
  });

  it('/api/users/:id (GET) - should get a user by id', async () => {
    const response = await request(app.getHttpServer() as App)
      .get(`/api/users/${testUserId}`)
      .set('Host', 'e2e-users.localhost:3001')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const body = response.body as { id: string; email: string };
    expect(body.id).toBe(testUserId);
    expect(body.email).toBe('newuser@e2e.com');
    expect(body).not.toHaveProperty('password');
  });

  it('/api/users/:id (PATCH) - should update a user', async () => {
    const response = await request(app.getHttpServer() as App)
      .patch(`/api/users/${testUserId}`)
      .set('Host', 'e2e-users.localhost:3001')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Updated Name',
        role: 'manager',
      })
      .expect(200);

    const body = response.body as { name: string; role: string };
    expect(body.name).toBe('Updated Name');
    expect(body.role).toBe('manager');
  });

  it('/api/users/:id (DELETE) - should soft delete a user', async () => {
    await request(app.getHttpServer() as App)
      .delete(`/api/users/${testUserId}`)
      .set('Host', 'e2e-users.localhost:3001')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(204);

    // Verify user is inactive
    const user = await prisma.user.findUnique({
      where: { id: testUserId },
    });
    expect(user?.isActive).toBe(false);
  });

  it('/api/users (POST) - should reject duplicate email', async () => {
    await request(app.getHttpServer() as App)
      .post('/api/users')
      .set('Host', 'e2e-users.localhost:3001')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        email: 'admin@e2e.com', // Duplicate email
        name: 'Duplicate User',
        password: 'Password123',
        role: 'technician',
      })
      .expect(409);
  });
});
