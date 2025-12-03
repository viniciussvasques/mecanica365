import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app/app.module';
import { PrismaService } from '../src/database/prisma.service';
import {
  TenantStatus,
  TenantPlan,
} from '../src/modules/core/tenants/dto/create-tenant.dto';
import { DocumentType } from '../src/modules/core/tenants/dto/create-tenant.dto';
import { BillingCycle } from '../src/modules/core/billing/dto/subscription-response.dto';

describe('OnboardingController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testTenantId: string;
  let testSubdomain: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testTenantId) {
      await prisma.tenant.deleteMany({
        where: { id: testTenantId },
      });
    }
    await app.close();
  });

  describe('POST /api/onboarding/register', () => {
    it('deve criar tenant pendente com sucesso', async () => {
      testSubdomain = `test-${Date.now()}`;
      const registerData = {
        name: 'Oficina Teste E2E',
        email: `test-${Date.now()}@test.com`,
        documentType: DocumentType.CNPJ,
        document: '12345678000199',
        subdomain: testSubdomain,
        plan: TenantPlan.WORKSHOPS_STARTER,
        password: 'TestPassword123',
      };

      const response = await request(app.getHttpServer() as App)
        .post('/api/onboarding/register')
        .send(registerData)
        .expect(201);

      const body = response.body as { tenantId: string; subdomain: string };
      expect(body).toHaveProperty('tenantId');
      expect(body).toHaveProperty('subdomain', testSubdomain);
      testTenantId = body.tenantId;

      // Verificar se tenant foi criado com status PENDING
      const tenant = await prisma.tenant.findUnique({
        where: { id: testTenantId },
      });
      expect(tenant).toBeDefined();
      expect(tenant?.status).toBe(TenantStatus.PENDING);
    });

    it('deve retornar erro 400 para dados inválidos', async () => {
      const invalidData = {
        name: 'AB', // Muito curto
        email: 'invalid-email',
        documentType: DocumentType.CNPJ,
        document: '123', // Inválido
        subdomain: 'ab', // Muito curto
        plan: TenantPlan.WORKSHOPS_STARTER,
      };

      const response = await request(app.getHttpServer() as App)
        .post('/api/onboarding/register')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(Array.isArray(response.body.message) || typeof response.body.message === 'string').toBe(true);
    });

    it('deve retornar tenant existente se já houver pendente', async () => {
      const existingSubdomain = `existing-${Date.now()}`;
      const document = '98765432000111';

      // Criar primeiro tenant
      const firstResponse = await request(app.getHttpServer() as App)
        .post('/api/onboarding/register')
        .send({
          name: 'Primeiro Tenant',
          email: `first-${Date.now()}@test.com`,
          documentType: DocumentType.CNPJ,
          document,
          subdomain: existingSubdomain,
          plan: TenantPlan.WORKSHOPS_STARTER,
        })
        .expect(201);

      // Tentar criar segundo com mesmo documento
      const secondResponse = await request(app.getHttpServer() as App)
        .post('/api/onboarding/register')
        .send({
          name: 'Segundo Tenant',
          email: `second-${Date.now()}@test.com`,
          documentType: DocumentType.CNPJ,
          document, // Mesmo documento
          subdomain: `different-${Date.now()}`,
          plan: TenantPlan.WORKSHOPS_STARTER,
        })
        .expect(201);

      // Deve retornar o mesmo tenant
      const firstBody = firstResponse.body as { tenantId: string };
      const secondBody = secondResponse.body as { tenantId: string };
      expect(secondBody.tenantId).toBe(firstBody.tenantId);
    });
  });

  describe('POST /api/onboarding/check-status', () => {
    it('deve retornar tenant pendente se existir', async () => {
      const testDocument = '11111111000111';
      const testEmail = `status-${Date.now()}@test.com`;

      // Criar tenant pendente
      await request(app.getHttpServer() as App)
        .post('/api/onboarding/register')
        .send({
          name: 'Tenant Status Test',
          email: testEmail,
          documentType: DocumentType.CNPJ,
          document: testDocument,
          subdomain: `status-${Date.now()}`,
          plan: TenantPlan.WORKSHOPS_STARTER,
        })
        .expect(201);

      // Verificar status
      const response = await request(app.getHttpServer() as App)
        .post('/api/onboarding/check-status')
        .send({
          document: testDocument,
          email: testEmail,
        })
        .expect(200);

      const body = response.body as {
        exists: boolean;
        tenantId?: string;
        subdomain?: string;
      };
      expect(body).toHaveProperty('exists', true);
      expect(body).toHaveProperty('tenantId');
      expect(body).toHaveProperty('subdomain');
    });

    it('deve retornar exists: false se não houver tenant pendente', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/api/onboarding/check-status')
        .send({
          document: '99999999000199',
          email: 'nonexistent@test.com',
        })
        .expect(200);

      const body = response.body as { exists: boolean };
      expect(body).toHaveProperty('exists', false);
    });
  });

  describe('POST /api/onboarding/checkout', () => {
    let checkoutTenantId: string;

    beforeEach(async () => {
      // Criar tenant pendente para checkout
      const registerResponse = await request(app.getHttpServer() as App)
        .post('/api/onboarding/register')
        .send({
          name: 'Checkout Test',
          email: `checkout-${Date.now()}@test.com`,
          documentType: DocumentType.CNPJ,
          document: `checkout-${Date.now()}`,
          subdomain: `checkout-${Date.now()}`,
          plan: TenantPlan.WORKSHOPS_STARTER,
        })
        .expect(201);

      const registerBody = registerResponse.body as { tenantId: string };
      checkoutTenantId = registerBody.tenantId;
    });

    it('deve retornar erro 400 se Stripe não estiver configurado', async () => {
      // Simular Stripe não configurado
      const originalKey = process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_SECRET_KEY;

      const response = await request(app.getHttpServer() as App)
        .post('/api/onboarding/checkout')
        .send({
          tenantId: checkoutTenantId,
          plan: TenantPlan.WORKSHOPS_STARTER,
          billingCycle: BillingCycle.MONTHLY,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBeTruthy();

      if (originalKey) {
        process.env.STRIPE_SECRET_KEY = originalKey;
      }
    });

    it('deve retornar erro 400 se tenant não for encontrado', async () => {
      const response = await request(app.getHttpServer() as App)
        .post('/api/onboarding/checkout')
        .send({
          tenantId: 'non-existent-id',
          plan: TenantPlan.WORKSHOPS_STARTER,
          billingCycle: BillingCycle.MONTHLY,
        })
        .expect(400);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toBeTruthy();
    });
  });
});
