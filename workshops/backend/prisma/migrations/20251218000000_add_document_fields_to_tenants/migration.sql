-- Add document_type and document columns to tenants table
-- These fields are required for tenant identification

-- Add document_type column (cpf or cnpj)
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "document_type" VARCHAR(10) NOT NULL DEFAULT 'cnpj';

-- Add document column (the actual document number)
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "document" VARCHAR(20);

-- Update existing tenants to have valid document if they don't have one
UPDATE "tenants" 
SET "document" = CONCAT('00000000000000', SUBSTRING(id, 1, 6))
WHERE "document" IS NULL;

-- Now make document NOT NULL after setting defaults
ALTER TABLE "tenants" ALTER COLUMN "document" SET NOT NULL;

-- Create unique index on document
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_document_key" ON "tenants"("document");

-- Create index on document_type for faster queries
CREATE INDEX IF NOT EXISTS "tenants_document_type_idx" ON "tenants"("document_type");
