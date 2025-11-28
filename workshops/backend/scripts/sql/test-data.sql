-- Dados de teste para módulo Auth

-- Criar tenant de teste
INSERT INTO tenants (id, name, cnpj, subdomain, plan, status, "createdAt", "updatedAt")
VALUES (
  'test-tenant-001',
  'Oficina Teste',
  '12345678000199',
  'teste',
  'workshops_starter',
  'active',
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar usuário de teste (senha: TestPassword123)
INSERT INTO users (id, "tenantId", email, name, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  'test-user-001',
  'test-tenant-001',
  'teste@oficina.com',
  'Usuário Teste',
  '$2b$10$EOmsFdw.kEI83ZsRwTXhMezP92p/0aOSLpbg1x71v6JpNW5pNWZim',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

