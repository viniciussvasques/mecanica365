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
      // Limpar transporter para simular não configurado
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      (service as any).transporter = null;
      const loggerSpy = jest.spyOn(service['logger'], 'log');

      await service.sendWelcomeEmail(emailData);

      // Verificar se logger foi chamado (pode ser log ou error)
      expect(loggerSpy).toHaveBeenCalled();
      expect(mockTransporter.sendMail).not.toHaveBeenCalled();
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
});
