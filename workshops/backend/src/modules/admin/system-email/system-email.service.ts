import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { EncryptionService } from '../../shared/encryption/encryption.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SystemEmailService {
  private readonly logger = new Logger(SystemEmailService.name);

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  async findAll() {
    const settings = await this.prisma.systemEmailSettings.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Não retornar senha
    return settings.map(({ password, ...setting }) => setting);
  }

  async findOne(id: string) {
    const setting = await this.prisma.systemEmailSettings.findUnique({
      where: { id },
    });

    if (setting) {
      const { password, ...rest } = setting;
      return rest;
    }
    return null;
  }

  async create(data: any) {
    const encryptedPassword = this.encryption.encrypt(data.password);

    return this.prisma.systemEmailSettings.create({
      data: {
        ...data,
        password: encryptedPassword,
      },
    });
  }

  async update(id: string, data: any) {
    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = this.encryption.encrypt(data.password);
    } else {
      delete updateData.password;
    }

    return this.prisma.systemEmailSettings.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.systemEmailSettings.delete({
      where: { id },
    });
  }

  async setDefault(id: string) {
    // Remover default de todos
    await this.prisma.systemEmailSettings.updateMany({
      data: { isDefault: false },
    });

    // Definir novo default
    return this.prisma.systemEmailSettings.update({
      where: { id },
      data: { isDefault: true },
    });
  }

  async getDefaultConfig() {
    const config = await this.prisma.systemEmailSettings.findFirst({
      where: { isActive: true, isDefault: true },
    });

    if (!config) return null;

    return {
      ...config,
      password: this.encryption.decrypt(config.password),
    };
  }

  async testEmail(id: string, testEmail: string) {
    try {
      const setting = await this.prisma.systemEmailSettings.findUnique({
        where: { id },
      });

      if (!setting) {
        return { success: false, message: 'Configuração não encontrada' };
      }

      const decryptedPassword = this.encryption.decrypt(setting.password);

      const transporter = nodemailer.createTransport({
        host: setting.host,
        port: setting.port,
        secure: setting.secure,
        auth: {
          user: setting.user,
          pass: decryptedPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        from: `"${setting.fromName}" <${setting.fromEmail}>`,
        to: testEmail,
        subject: 'Teste de Configuração de Email - Mecânica365',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B6B;">✅ Teste de Email</h2>
            <p>Este é um email de teste enviado pelo sistema Mecânica365.</p>
            <p><strong>Configuração:</strong> ${setting.name}</p>
            <p><strong>Servidor SMTP:</strong> ${setting.host}:${setting.port}</p>
            <p><strong>De:</strong> ${setting.fromName} &lt;${setting.fromEmail}&gt;</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              Se você recebeu este email, a configuração está funcionando corretamente!
            </p>
          </div>
        `,
        text: `
          ✅ Teste de Email - Mecânica365
          
          Este é um email de teste enviado pelo sistema.
          
          Configuração: ${setting.name}
          Servidor SMTP: ${setting.host}:${setting.port}
          De: ${setting.fromName} <${setting.fromEmail}>
          
          Se você recebeu este email, a configuração está funcionando corretamente!
        `,
      });

      this.logger.log(`Email de teste enviado com sucesso para ${testEmail}`);
      return { success: true, message: 'Email de teste enviado com sucesso' };
    } catch (error: any) {
      this.logger.error(`Erro ao enviar email de teste: ${error.message}`);
      return { 
        success: false, 
        message: error.message || 'Erro ao enviar email de teste' 
      };
    }
  }
}
