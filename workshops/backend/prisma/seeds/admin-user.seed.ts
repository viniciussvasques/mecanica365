import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function seedAdminUser() {
  console.log('🔐 Creating super admin user...');

  // Criar tenant especial "system" para o super admin
  const systemTenant = await prisma.tenant.upsert({
    where: { subdomain: 'system' },
    update: {},
    create: {
      name: 'Sistema Mecânica365',
      subdomain: 'system',
      documentType: 'cnpj',
      document: '00000000000000',
      plan: 'enterprise',
      status: 'active',
    },
  });

  console.log(`✅ System tenant: ${systemTenant.id}`);

  // Criar usuário super admin
  // Email: admin@mecanica365.com
  // Senha: Admin123!@#
  const hashedPassword = await bcrypt.hash('Admin123!@#', 10);

  const adminUser = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: systemTenant.id,
        email: 'admin@mecanica365.com',
      },
    },
    update: {
      password: hashedPassword, // Atualiza a senha se o usuário já existir
      isActive: true,
    },
    create: {
      tenantId: systemTenant.id,
      email: 'admin@mecanica365.com',
      name: 'Super Administrador',
      password: hashedPassword,
      role: 'superadmin', // Role especial para super admin
      isActive: true,
    },
  });

  console.log(`✅ Super admin user created: ${adminUser.email}`);
  console.log('📧 Email: admin@mecanica365.com');
  console.log('🔑 Senha: Admin123!@#');
  console.log('⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');
}


