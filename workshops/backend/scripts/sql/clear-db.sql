-- Limpar dados de teste
DELETE FROM "RefreshToken";
DELETE FROM "User";
DELETE FROM "Subscription";
DELETE FROM "Tenant";

-- Resetar sequências
ALTER SEQUENCE "Tenant_id_seq" RESTART WITH 1;
ALTER SEQUENCE "User_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Subscription_id_seq" RESTART WITH 1;
