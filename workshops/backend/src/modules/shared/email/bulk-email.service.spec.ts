import { Test, TestingModule } from '@nestjs/testing';
import { BulkEmailService } from './bulk-email.service';
import { EmailService } from './email.service';

describe('BulkEmailService', () => {
  let service: BulkEmailService;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(async () => {
    const mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkEmailService,
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<BulkEmailService>(BulkEmailService);
    emailService = module.get(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendBulkEmail', () => {
    it('deve enviar emails para múltiplos destinatários', async () => {
      const data = {
        recipients: [
          { email: 'user1@test.com', name: 'User 1' },
          { email: 'user2@test.com', name: 'User 2' },
        ],
        subject: 'Test Subject',
        htmlContent: '<p>Hello {{name}}</p>',
        textContent: 'Hello {{name}}',
        fromName: 'Test',
      };

      const result = await service.sendBulkEmail(data);

      expect(result.total).toBe(2);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(0);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendEmail).toHaveBeenCalledTimes(2);
    });

    it('deve substituir variáveis padrão no conteúdo', async () => {
      const data = {
        recipients: [{ email: 'user1@test.com', name: 'User 1' }],
        subject: 'Hello {{name}}',
        htmlContent: '<p>Hello {{name}}, your email is {{email}}</p>',
        textContent: 'Hello {{name}}, your email is {{email}}',
        fromName: 'Test',
      };

      await service.sendBulkEmail(data);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'user1@test.com',
        'Hello User 1',
        expect.stringContaining('User 1'),
        expect.stringContaining('user1@test.com'),
      );
    });

    it('deve substituir variáveis customizadas no conteúdo', async () => {
      const data = {
        recipients: [
          {
            email: 'user1@test.com',
            name: 'User 1',
            customData: { company: 'Test Company', discount: '10%' },
          },
        ],
        subject: 'Hello {{name}}',
        htmlContent:
          '<p>Hello {{name}} from {{company}}, discount: {{discount}}</p>',
        textContent: 'Hello {{name}} from {{company}}, discount: {{discount}}',
        fromName: 'Test',
      };

      await service.sendBulkEmail(data);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'user1@test.com',
        'Hello User 1',
        expect.stringContaining('Test Company'),
        expect.stringContaining('10%'),
      );
    });

    it('deve processar emails em lotes', async () => {
      const recipients = Array.from({ length: 25 }, (_, i) => ({
        email: `user${i}@test.com`,
        name: `User ${i}`,
      }));

      const data = {
        recipients,
        subject: 'Test',
        htmlContent: '<p>Test</p>',
        fromName: 'Test',
      };

      const result = await service.sendBulkEmail(data);

      expect(result.total).toBe(25);
      expect(result.sent).toBe(25);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(emailService.sendEmail).toHaveBeenCalledTimes(25);
    });

    it('deve tratar erros individuais sem parar o processo', async () => {
      emailService.sendEmail
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('SMTP Error'))
        .mockResolvedValueOnce(undefined);

      const data = {
        recipients: [
          { email: 'user1@test.com', name: 'User 1' },
          { email: 'user2@test.com', name: 'User 2' },
          { email: 'user3@test.com', name: 'User 3' },
        ],
        subject: 'Test',
        htmlContent: '<p>Test</p>',
        fromName: 'Test',
      };

      const result = await service.sendBulkEmail(data);

      expect(result.total).toBe(3);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].email).toBe('user2@test.com');
    });

    it('deve retornar estatísticas corretas', async () => {
      emailService.sendEmail
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce(undefined);

      const data = {
        recipients: [
          { email: 'user1@test.com', name: 'User 1' },
          { email: 'user2@test.com', name: 'User 2' },
          { email: 'user3@test.com', name: 'User 3' },
          { email: 'user4@test.com', name: 'User 4' },
        ],
        subject: 'Test',
        htmlContent: '<p>Test</p>',
        fromName: 'Test',
      };

      const result = await service.sendBulkEmail(data);

      expect(result.total).toBe(4);
      expect(result.sent).toBe(2);
      expect(result.failed).toBe(2);
      expect(result.errors).toHaveLength(2);
    });
  });
});
