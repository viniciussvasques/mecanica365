// Setup para testes E2E - Configurar variáveis de ambiente necessárias
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-e2e-tests-minimum-32-characters';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://mecanica365:mecanica365@localhost:5432/mecanica365_db';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT || '3001';

