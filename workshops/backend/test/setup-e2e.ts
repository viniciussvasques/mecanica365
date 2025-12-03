// Setup para testes E2E - Configurar variáveis de ambiente necessárias
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-e2e-tests';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
process.env.NODE_ENV = 'test';

