import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { CreateEmailSettingsDto } from './dto/create-email-settings.dto';
import { UpdateEmailSettingsDto } from './dto/update-email-settings.dto';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailSettingsService {
  private readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  private readonly ALGORITHM = 'aes-256-cbc';

  constructor(private readonly prisma: PrismaService) {}

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(this.ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  async findAll(tenantId: string) {
    const settings = await this.prisma.emailSettings.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Remove password from response
    return settings.map(({ password, ...setting }) => setting);
  }

  async findOne(id: string, tenantId: string) {
    const setting = await this.prisma.emailSettings.findFirst({
      where: { id, tenantId },
    });

    if (!setting) {
      throw new NotFoundException('Configuração de email não encontrada');
    }

    // Remove password from response
    const { password, ...settingWithoutPassword } = setting;
    return settingWithoutPassword;
  }

  async findActive(tenantId: string) {
    return this.prisma.emailSettings.findFirst({
      where: {
        tenantId,
        isActive: true,
        isDefault: true,
      },
    });
  }

  async create(tenantId: string, createDto: CreateEmailSettingsDto) {
    // Encrypt password
    const encryptedPassword = this.encrypt(createDto.password);

    // If this is the first email setting or isActive is true, make it default
    const existingCount = await this.prisma.emailSettings.count({
      where: { tenantId },
    });

    const isDefault = existingCount === 0 || createDto.isActive === true;

    // If setting as default, unset other defaults
    if (isDefault) {
      await this.prisma.emailSettings.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const setting = await this.prisma.emailSettings.create({
      data: {
        ...createDto,
        password: encryptedPassword,
        tenantId,
        isDefault,
        isActive: createDto.isActive ?? true,
      },
    });

    // Remove password from response
    const { password, ...settingWithoutPassword } = setting;
    return settingWithoutPassword;
  }

  async update(id: string, tenantId: string, updateDto: UpdateEmailSettingsDto) {
    const existing = await this.prisma.emailSettings.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Configuração de email não encontrada');
    }

    const updateData: any = { ...updateDto };

    // Encrypt password if provided
    if (updateDto.password) {
      updateData.password = this.encrypt(updateDto.password);
    } else {
      delete updateData.password;
    }

    const setting = await this.prisma.emailSettings.update({
      where: { id },
      data: updateData,
    });

    // Remove password from response
    const { password, ...settingWithoutPassword } = setting;
    return settingWithoutPassword;
  }

  async setDefault(id: string, tenantId: string) {
    const setting = await this.prisma.emailSettings.findFirst({
      where: { id, tenantId },
    });

    if (!setting) {
      throw new NotFoundException('Configuração de email não encontrada');
    }

    // Unset other defaults
    await this.prisma.emailSettings.updateMany({
      where: { tenantId, isDefault: true },
      data: { isDefault: false },
    });

    // Set this one as default
    const updated = await this.prisma.emailSettings.update({
      where: { id },
      data: { isDefault: true, isActive: true },
    });

    // Remove password from response
    const { password, ...settingWithoutPassword } = updated;
    return settingWithoutPassword;
  }

  async remove(id: string, tenantId: string) {
    const setting = await this.prisma.emailSettings.findFirst({
      where: { id, tenantId },
    });

    if (!setting) {
      throw new NotFoundException('Configuração de email não encontrada');
    }

    if (setting.isDefault) {
      throw new ConflictException('Não é possível remover a configuração padrão');
    }

    await this.prisma.emailSettings.delete({
      where: { id },
    });

    return { message: 'Configuração removida com sucesso' };
  }

  async testConnection(id: string, tenantId: string, testEmail: string) {
    const setting = await this.prisma.emailSettings.findFirst({
      where: { id, tenantId },
    });

    if (!setting) {
      throw new NotFoundException('Configuração de email não encontrada');
    }

    try {
      // Decrypt password
      const decryptedPassword = this.decrypt(setting.password);

      // Create transporter
      const transporter = nodemailer.createTransport({
        host: setting.host,
        port: setting.port,
        secure: setting.secure,
        auth: {
          user: setting.user,
          pass: decryptedPassword,
        },
      });

      // Verify connection
      await transporter.verify();

      // Send test email
      await transporter.sendMail({
        from: `"${setting.fromName}" <${setting.fromEmail}>`,
        to: testEmail,
        subject: 'Email de Teste - Mecânica365',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>✅ Teste de Configuração de Email</h2>
            <p>Parabéns! A configuração de email <strong>${setting.name}</strong> está funcionando corretamente.</p>
            <p><strong>Detalhes da configuração:</strong></p>
            <ul>
              <li>Host: ${setting.host}</li>
              <li>Porta: ${setting.port}</li>
              <li>SSL/TLS: ${setting.secure ? 'Sim' : 'Não'}</li>
              <li>Usuário: ${setting.user}</li>
              <li>Remetente: ${setting.fromEmail}</li>
            </ul>
            <p>Este é um email de teste automático gerado pelo sistema Mecânica365.</p>
          </div>
        `,
      });

      return {
        success: true,
        message: 'Email de teste enviado com sucesso!',
      };
    } catch (error) {
      console.error('Erro ao testar configuração de email:', error);
      return {
        success: false,
        message: error.message || 'Falha ao enviar email de teste',
      };
    }
  }
}
