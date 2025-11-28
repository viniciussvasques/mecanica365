import { Test, TestingModule } from '@nestjs/testing';
import { EmailTemplatesService } from './email-templates.service';

describe('EmailTemplatesService', () => {
  let service: EmailTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailTemplatesService],
    }).compile();

    service = module.get<EmailTemplatesService>(EmailTemplatesService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('getWelcomeEmailTemplate', () => {
    it('deve gerar template HTML de boas-vindas', () => {
      const data = {
        name: 'João Silva',
        subdomain: 'oficina-teste',
        email: 'joao@oficina.com',
        password: 'TempPass123',
        loginUrl: 'http://localhost:3000/login?subdomain=oficina-teste',
      };

      const html = service.getWelcomeEmailTemplate(data);
      expect(html).toContain('João Silva');
      expect(html).toContain('oficina-teste');
      expect(html).toContain('joao@oficina.com');
      expect(html).toContain('TempPass123');
      expect(html).toContain(
        'http://localhost:3000/login?subdomain=oficina-teste',
      );
    });

    it('deve gerar template HTML com todas as informações', () => {
      const data = {
        name: 'João Silva',
        subdomain: 'oficina-teste',
        email: 'joao@oficina.com',
        password: 'TempPass123',
        loginUrl: 'http://localhost:3000/login?subdomain=oficina-teste',
      };

      const html = service.getWelcomeEmailTemplate(data);
      expect(html).toContain('João Silva');
      expect(html).toContain('oficina-teste');
      expect(html).toContain('joao@oficina.com');
      expect(html).toContain('TempPass123');
      expect(html).toContain(
        'http://localhost:3000/login?subdomain=oficina-teste',
      );
    });
  });

  describe('getPaymentFailedEmailTemplate', () => {
    it('deve gerar template HTML de pagamento falhado', () => {
      const data = {
        name: 'João Silva',
        subdomain: 'oficina-teste',
        amount: 9900,
        currency: 'brl',
        paymentMethod: 'Cartão de Crédito',
        failureReason: 'Cartão recusado',
        retryUrl: 'http://localhost:3000/retry',
        supportUrl: 'http://localhost:3000/support',
      };

      const html = service.getPaymentFailedEmailTemplate(data);
      expect(html).toContain('João Silva');
      expect(html).toContain('99,00'); // Valor formatado
      expect(html).toContain('Cartão recusado');
      expect(html).toContain('http://localhost:3000/retry');
    });
  });

  describe('getSubscriptionCancelledEmailTemplate', () => {
    it('deve gerar template HTML de cancelamento', () => {
      const data = {
        name: 'João Silva',
        subdomain: 'oficina-teste',
        planName: 'Workshops Professional',
        cancellationDate: new Date('2025-12-31'),
        accessUntilDate: new Date('2026-01-31'),
        reactivateUrl: 'http://localhost:3000/reactivate',
        supportUrl: 'http://localhost:3000/support',
      };

      const html = service.getSubscriptionCancelledEmailTemplate(data);
      expect(html).toContain('João Silva');
      expect(html).toContain('Workshops Professional');
      expect(html).toContain('http://localhost:3000/reactivate');
    });
  });

  describe('getInvoicePaymentSucceededEmailTemplate', () => {
    it('deve gerar template HTML de pagamento bem-sucedido', () => {
      const data = {
        name: 'João Silva',
        subdomain: 'oficina-teste',
        amount: 9900,
        currency: 'brl',
        invoiceNumber: 'INV-001',
        invoiceUrl: 'http://localhost:3000/invoice/001',
        nextBillingDate: new Date('2025-12-31'),
        loginUrl: 'http://localhost:3000/login',
      };

      const html = service.getInvoicePaymentSucceededEmailTemplate(data);
      expect(html).toContain('João Silva');
      expect(html).toContain('99,00'); // Valor formatado
      expect(html).toContain('INV-001');
      expect(html).toContain('http://localhost:3000/invoice/001');
    });
  });

  describe('getInvoiceUpcomingEmailTemplate', () => {
    it('deve gerar template HTML de fatura próxima', () => {
      const data = {
        name: 'João Silva',
        subdomain: 'oficina-teste',
        amount: 9900,
        currency: 'brl',
        dueDate: new Date('2025-12-31'),
        invoiceUrl: 'http://localhost:3000/invoice/001',
        paymentMethod: 'Cartão de Crédito',
        loginUrl: 'http://localhost:3000/login',
      };

      const html = service.getInvoiceUpcomingEmailTemplate(data);
      expect(html).toContain('João Silva');
      expect(html).toContain('99,00'); // Valor formatado
      expect(html).toContain('31/12/2025');
    });
  });

  describe('getTrialEndingEmailTemplate', () => {
    it('deve gerar template HTML de trial terminando', () => {
      const data = {
        name: 'João Silva',
        subdomain: 'oficina-teste',
        trialEndDate: new Date('2025-12-31'),
        planName: 'Workshops Professional',
        amount: 9900,
        currency: 'brl',
        subscribeUrl: 'http://localhost:3000/upgrade',
        supportUrl: 'http://localhost:3000/support',
      };

      const html = service.getTrialEndingEmailTemplate(data);
      expect(html).toContain('João Silva');
      expect(html).toContain('Workshops Professional');
      expect(html).toContain('31/12/2025');
    });
  });

  describe('getAccountSuspendedEmailTemplate', () => {
    it('deve gerar template HTML de conta suspensa', () => {
      const data = {
        name: 'João Silva',
        subdomain: 'oficina-teste',
        reason: 'Pagamento pendente',
        reactivateUrl: 'http://localhost:3000/reactivate',
        supportUrl: 'http://localhost:3000/support',
      };

      const html = service.getAccountSuspendedEmailTemplate(data);
      expect(html).toContain('João Silva');
      expect(html).toContain('Pagamento pendente');
      expect(html).toContain('http://localhost:3000/reactivate');
    });
  });
});
