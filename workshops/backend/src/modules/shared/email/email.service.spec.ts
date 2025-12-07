import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplatesService } from './email-templates.service';
import { WelcomeEmailData } from './interfaces/email-data.interfaces';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let mockTransporter: {
    verify: jest.Mock;
    sendMail: jest.Mock;
  };

  beforeEach(async () => {
    mockTransporter = {
      verify: jest.fn(),
      sendMail: jest.fn(),
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockTemplatesService = {
      getWelcomeEmailTemplate: jest.fn().mockReturnValue('<html>Test</html>'),
      getWelcomeEmailTextVersion: jest.fn().mockReturnValue('Test text'),
      getPaymentFailedEmailTemplate: jest
        .fn()
        .mockReturnValue('<html>Payment Failed</html>'),
      getPaymentFailedEmailTextVersion: jest
        .fn()
        .mockReturnValue('Payment Failed text'),
      getSubscriptionCancelledEmailTemplate: jest
        .fn()
        .mockReturnValue('<html>Cancelled</html>'),
      getSubscriptionUpdatedEmailTemplate: jest
        .fn()
        .mockReturnValue('<html>Updated</html>'),
      getInvoicePaymentSucceededEmailTemplate: jest
        .fn()
        .mockReturnValue('<html>Payment Succeeded</html>'),
      getInvoiceUpcomingEmailTemplate: jest
        .fn()
        .mockReturnValue('<html>Upcoming</html>'),
      getTrialEndingEmailTemplate: jest
        .fn()
        .mockReturnValue('<html>Trial Ending</html>'),
      getAccountSuspendedEmailTemplate: jest
        .fn()
        .mockReturnValue('<html>Suspended</html>'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailTemplatesService, useValue: mockTemplatesService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWelcomeEmail', () => {
    const emailData: WelcomeEmailData = {
      to: 'test@example.com',
      name: 'João Silva',
      subdomain: 'oficina-teste',
      email: 'test@example.com',
      password: 'TempPassword123',
      loginUrl: 'http://localhost:3000/login?subdomain=oficina-teste',
    };

    it('deve logar email se SMTP não estiver configurado', async () => {
      // Limpar variável de ambiente para simular não configurado
      const originalSmtpUser = process.env.SMTP_USER;
      delete process.env.SMTP_USER;
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.sendWelcomeEmail(emailData);

      // Verificar se logger foi chamado
      expect(loggerSpy).toHaveBeenCalled();
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();

      // Restaurar variável de ambiente
      if (originalSmtpUser) {
        process.env.SMTP_USER = originalSmtpUser;
      }
    });

    it('deve enviar email se SMTP estiver configurado', async () => {
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'password';
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendWelcomeEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: emailData.to,
          subject: 'Bem-vindo ao Mecânica365! Suas credenciais de acesso',
        }),
      );
    });

    it('deve tratar erros ao enviar email', async () => {
      process.env.SMTP_USER = 'test@example.com';
      process.env.SMTP_PASS = 'password';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.sendWelcomeEmail(emailData);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send welcome email'),
        expect.any(String),
      );
    });
  });

  describe('sendEmail', () => {
    it('deve enviar email quando SMTP está configurado', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendEmail(
        'test@example.com',
        'Test Subject',
        '<html>Test</html>',
        'Test text',
      );

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<html>Test</html>',
          text: 'Test text',
        }),
      );
    });

    it('deve logar email quando SMTP não está configurado', async () => {
      delete process.env.SMTP_USER;
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.sendEmail(
        'test@example.com',
        'Test Subject',
        '<html>Test</html>',
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('EMAIL (SMTP não configurado)'),
      );
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
    });

    it('deve tratar erros ao enviar email', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await expect(
        service.sendEmail('test@example.com', 'Test', '<html>Test</html>'),
      ).rejects.toThrow('SMTP Error');

      expect(loggerSpy).toHaveBeenCalled();
    });

    it('deve usar messageId quando disponível', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'custom-message-id',
      });
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.sendEmail('test@example.com', 'Test', '<html>Test</html>');

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('custom-message-id'),
      );
    });

    it('deve usar messageId padrão quando não disponível', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockResolvedValue({});
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.sendEmail('test@example.com', 'Test', '<html>Test</html>');

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('unknown'),
      );
    });
  });

  describe('sendPaymentFailedEmail', () => {
    const emailData = {
      to: 'test@example.com',
      name: 'João Silva',
      subdomain: 'oficina-teste',
      amount: 99.99,
      currency: 'BRL',
      invoiceUrl: 'https://example.com/invoice',
    };

    it('deve enviar email de pagamento falhado', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendPaymentFailedEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: emailData.to,
          subject: 'Pagamento Não Processado - Ação Necessária',
        }),
      );
    });

    it('deve tratar erros ao enviar email de pagamento falhado', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.sendPaymentFailedEmail(emailData);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send payment failed email'),
        expect.any(String),
      );
    });
  });

  describe('sendSubscriptionCancelledEmail', () => {
    const emailData = {
      to: 'test@example.com',
      name: 'João Silva',
      subdomain: 'oficina-teste',
      planName: 'Plano Básico',
      cancellationDate: new Date(),
      accessUntilDate: new Date(Date.now() + 86400000),
    };

    it('deve enviar email de assinatura cancelada', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendSubscriptionCancelledEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: emailData.to,
          subject: 'Assinatura Cancelada',
        }),
      );
    });

    it('deve tratar erros ao enviar email de assinatura cancelada', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.sendSubscriptionCancelledEmail(emailData);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send subscription cancelled email'),
        expect.any(String),
      );
    });
  });

  describe('sendSubscriptionUpdatedEmail', () => {
    const emailData = {
      to: 'test@example.com',
      name: 'João Silva',
      subdomain: 'oficina-teste',
      oldPlan: 'Plano Básico',
      newPlan: 'Plano Premium',
      billingCycle: 'monthly',
      nextBillingDate: new Date(),
      amount: 99.99,
      currency: 'BRL',
      loginUrl: 'https://example.com/login',
    };

    it('deve enviar email de assinatura atualizada', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendSubscriptionUpdatedEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: emailData.to,
          subject: 'Assinatura Atualizada',
        }),
      );
    });

    it('deve tratar erros ao enviar email de assinatura atualizada', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.sendSubscriptionUpdatedEmail(emailData);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send subscription updated email'),
        expect.any(String),
      );
    });
  });

  describe('sendInvoicePaymentSucceededEmail', () => {
    const emailData = {
      to: 'test@example.com',
      name: 'João Silva',
      subdomain: 'oficina-teste',
      invoiceNumber: 'INV-001',
      amount: 99.99,
      currency: 'BRL',
      invoiceUrl: 'https://example.com/invoice',
    };

    it('deve enviar email de pagamento confirmado', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendInvoicePaymentSucceededEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: emailData.to,
          subject: 'Pagamento Confirmado',
        }),
      );
    });

    it('deve tratar erros ao enviar email de pagamento confirmado', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.sendInvoicePaymentSucceededEmail(emailData);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Failed to send invoice payment succeeded email',
        ),
        expect.any(String),
      );
    });
  });

  describe('sendInvoiceUpcomingEmail', () => {
    const emailData = {
      to: 'test@example.com',
      name: 'João Silva',
      subdomain: 'oficina-teste',
      amount: 99.99,
      currency: 'BRL',
      dueDate: new Date(),
      invoiceUrl: 'https://example.com/invoice',
    };

    it('deve enviar email de cobrança programada', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendInvoiceUpcomingEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: emailData.to,
          subject: 'Próxima Cobrança Programada',
        }),
      );
    });

    it('deve tratar erros ao enviar email de cobrança programada', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.sendInvoiceUpcomingEmail(emailData);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send invoice upcoming email'),
        expect.any(String),
      );
    });
  });

  describe('sendTrialEndingEmail', () => {
    const emailData = {
      to: 'test@example.com',
      name: 'João Silva',
      subdomain: 'oficina-teste',
      trialEndDate: new Date(),
      planName: 'Plano Básico',
      amount: 99.99,
      currency: 'BRL',
      subscribeUrl: 'https://example.com/subscribe',
    };

    it('deve enviar email de trial terminando', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendTrialEndingEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: emailData.to,
          subject: 'Seu Período de Teste Está Terminando',
        }),
      );
    });

    it('deve tratar erros ao enviar email de trial terminando', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.sendTrialEndingEmail(emailData);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send trial ending email'),
        expect.any(String),
      );
    });
  });

  describe('sendAccountSuspendedEmail', () => {
    const emailData = {
      to: 'test@example.com',
      name: 'João Silva',
      subdomain: 'oficina-teste',
      reason: 'Pagamento não processado',
      reactivateUrl: 'https://example.com/reactivate',
    };

    it('deve enviar email de conta suspensa', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockResolvedValue({
        messageId: 'test-message-id',
      });

      await service.sendAccountSuspendedEmail(emailData);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: emailData.to,
          subject: 'Conta Suspensa - Ação Necessária',
        }),
      );
    });

    it('deve tratar erros ao enviar email de conta suspensa', async () => {
      process.env.SMTP_USER = 'test@example.com';
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP Error'));
      const loggerSpy = jest.spyOn(service['logger'], 'error');

      await service.sendAccountSuspendedEmail(emailData);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send account suspended email'),
        expect.any(String),
      );
    });
  });

  describe('createTransporter', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('deve criar transporter com configuração padrão', async () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_SECURE;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;

      await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: { get: jest.fn() } },
          {
            provide: EmailTemplatesService,
            useValue: {
              getWelcomeEmailTemplate: jest.fn(),
              getWelcomeEmailTextVersion: jest.fn(),
            },
          },
        ],
      }).compile();

      expect(nodemailer.createTransport).toHaveBeenCalled();
    });

    it('deve criar transporter com TLS quando host contém mail.', async () => {
      process.env.SMTP_HOST = 'mail.example.com';
      process.env.SMTP_PORT = '587';
      process.env.SMTP_SECURE = 'false';

      jest.clearAllMocks();

      await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: { get: jest.fn() } },
          {
            provide: EmailTemplatesService,
            useValue: {
              getWelcomeEmailTemplate: jest.fn(),
              getWelcomeEmailTextVersion: jest.fn(),
            },
          },
        ],
      }).compile();

      const calls = (nodemailer.createTransport as jest.Mock).mock.calls;
      const lastCall = calls.at(-1) as unknown[];
      expect(lastCall[0]).toMatchObject({
        tls: {
          rejectUnauthorized: false,
        },
      });
    });
  });

  describe('verifyConnection', () => {
    it('deve verificar conexão em desenvolvimento', async () => {
      process.env.NODE_ENV = 'development';
      mockTransporter.verify.mockResolvedValue(true);

      await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: { get: jest.fn() } },
          {
            provide: EmailTemplatesService,
            useValue: {
              getWelcomeEmailTemplate: jest.fn(),
              getWelcomeEmailTextVersion: jest.fn(),
            },
          },
        ],
      }).compile();

      // Aguardar verificação assíncrona
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('deve tratar erro na verificação de conexão', async () => {
      process.env.NODE_ENV = 'development';
      mockTransporter.verify.mockRejectedValue(new Error('Connection failed'));

      await Test.createTestingModule({
        providers: [
          EmailService,
          { provide: ConfigService, useValue: { get: jest.fn() } },
          {
            provide: EmailTemplatesService,
            useValue: {
              getWelcomeEmailTemplate: jest.fn(),
              getWelcomeEmailTextVersion: jest.fn(),
            },
          },
        ],
      }).compile();

      // Aguardar verificação assíncrona
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(mockTransporter.verify).toHaveBeenCalled();
    });
  });
});
