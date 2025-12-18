-- Migração de sincronização completa do schema
-- Esta migração alinha o banco de dados com o schema.prisma atual

-- 1. Remover colunas obsoletas de service_orders
ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "diagnosticNotes";
ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "identifiedProblemCategory";
ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "identifiedProblemDescription";
ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "identifiedProblemId";
ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "recommendations";
ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "reportedProblemCategory";
ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "reportedProblemDescription";
ALTER TABLE "service_orders" DROP COLUMN IF EXISTS "reportedProblemSymptoms";

-- 2. Remover colunas obsoletas de service_order_services
ALTER TABLE "service_order_services" DROP COLUMN IF EXISTS "performed_at";
ALTER TABLE "service_order_services" DROP COLUMN IF EXISTS "service_type";
ALTER TABLE "service_order_services" DROP COLUMN IF EXISTS "updated_at";

-- 3. Atualizar customers (remover cnpj e document_type)
ALTER TABLE "customers" DROP COLUMN IF EXISTS "cnpj";
ALTER TABLE "customers" DROP COLUMN IF EXISTS "document_type";

-- 4. Atualizar customer_vehicles
ALTER TABLE "customer_vehicles" DROP COLUMN IF EXISTS "renavan";

-- 5. Atualizar parts para novo schema
ALTER TABLE "parts" DROP COLUMN IF EXISTS "brand";
ALTER TABLE "parts" DROP COLUMN IF EXISTS "cost_price";
ALTER TABLE "parts" DROP COLUMN IF EXISTS "is_active";
ALTER TABLE "parts" DROP COLUMN IF EXISTS "min_quantity";
ALTER TABLE "parts" DROP COLUMN IF EXISTS "name";
ALTER TABLE "parts" DROP COLUMN IF EXISTS "part_number";
ALTER TABLE "parts" DROP COLUMN IF EXISTS "sell_price";
ALTER TABLE "parts" DROP COLUMN IF EXISTS "supplier_id";

-- Renomear created_at/updated_at para camelCase
ALTER TABLE "parts" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "parts" RENAME COLUMN "updated_at" TO "updatedAt";

-- Adicionar novas colunas em parts
ALTER TABLE "parts" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "parts" ADD COLUMN IF NOT EXISTS "minQuantity" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "parts" ADD COLUMN IF NOT EXISTS "partNumber" TEXT;
ALTER TABLE "parts" ADD COLUMN IF NOT EXISTS "supplier" TEXT;
ALTER TABLE "parts" ADD COLUMN IF NOT EXISTS "unitCost" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "parts" ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- 6. Atualizar part_movements
ALTER TABLE "part_movements" DROP COLUMN IF EXISTS "movement_type";
ALTER TABLE "part_movements" DROP COLUMN IF EXISTS "reference_type";
ALTER TABLE "part_movements" DROP COLUMN IF EXISTS "unit_cost";

-- Renomear colunas
ALTER TABLE "part_movements" RENAME COLUMN "created_at" TO "createdAt";
ALTER TABLE "part_movements" RENAME COLUMN "part_id" TO "partId";
ALTER TABLE "part_movements" RENAME COLUMN "reference_id" TO "referenceId";
ALTER TABLE "part_movements" RENAME COLUMN "tenant_id" TO "tenantId";

-- Adicionar nova coluna type
ALTER TABLE "part_movements" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'purchase';
ALTER TABLE "part_movements" ADD COLUMN IF NOT EXISTS "unitCost" DECIMAL(65,30);

-- 7. Atualizar invoices
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "customer_id";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "due_date";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "invoice_number";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "issued_at";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "nfe_key";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "nfe_pdf_url";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "nfe_status";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "nfe_xml_url";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "paid_at";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "payment_gateway_id";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "payment_method";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "payment_preference";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "payment_status";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "service_order_id";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "tax_amount";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "tenant_id";
ALTER TABLE "invoices" DROP COLUMN IF EXISTS "type";

-- Adicionar novas colunas
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "issuedAt" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "nfeKey" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "nfePdfUrl" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "nfeStatus" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "nfeXmlUrl" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "serviceOrderId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "tenantId" TEXT NOT NULL DEFAULT '';

-- 8. Atualizar common_problems
ALTER TABLE "common_problems" DROP COLUMN IF EXISTS "solutions";
ALTER TABLE "common_problems" DROP COLUMN IF EXISTS "symptoms";

-- 9. Adicionar updatedAt em elevator_usages se não existir
ALTER TABLE "elevator_usages" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 10. Remover colunas de quotes
ALTER TABLE "quotes" DROP COLUMN IF EXISTS "approvalMethod";
ALTER TABLE "quotes" DROP COLUMN IF EXISTS "estimatedHours";
ALTER TABLE "quotes" DROP COLUMN IF EXISTS "publicToken";
ALTER TABLE "quotes" DROP COLUMN IF EXISTS "publicTokenExpiresAt";

-- 11. Criar índices
CREATE INDEX IF NOT EXISTS "parts_tenantId_partNumber_idx" ON "parts"("tenantId", "partNumber");
CREATE INDEX IF NOT EXISTS "part_movements_tenantId_partId_idx" ON "part_movements"("tenantId", "partId");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_nfeKey_key" ON "invoices"("nfeKey");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_serviceOrderId_key" ON "invoices"("serviceOrderId");
CREATE INDEX IF NOT EXISTS "invoices_tenantId_customerId_idx" ON "invoices"("tenantId", "customerId");
CREATE INDEX IF NOT EXISTS "invoices_tenantId_status_idx" ON "invoices"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "quotes_identifiedProblemCategory_idx" ON "quotes"("identifiedProblemCategory");
CREATE INDEX IF NOT EXISTS "quotes_identifiedProblemId_idx" ON "quotes"("identifiedProblemId");
CREATE INDEX IF NOT EXISTS "quotes_reportedProblemCategory_idx" ON "quotes"("reportedProblemCategory");

-- 12. Tornar document e document_type nullable em tenants
ALTER TABLE "tenants" ALTER COLUMN "document_type" DROP NOT NULL;
ALTER TABLE "tenants" ALTER COLUMN "document" DROP NOT NULL;
