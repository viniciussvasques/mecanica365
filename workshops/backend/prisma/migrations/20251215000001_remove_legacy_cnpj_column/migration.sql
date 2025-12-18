-- Remove legacy cnpj column from tenants table
-- Data was already migrated to document column

-- Drop unique constraint on cnpj
DROP INDEX IF EXISTS "tenants_cnpj_key";

-- Drop the legacy cnpj column
ALTER TABLE "tenants" DROP COLUMN IF EXISTS "cnpj";
