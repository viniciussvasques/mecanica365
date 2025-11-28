-- AlterTable: Adicionar documentType e cnpj ao Customer
ALTER TABLE "customers" ADD COLUMN "document_type" VARCHAR(10) NOT NULL DEFAULT 'cpf';
ALTER TABLE "customers" ADD COLUMN "cnpj" VARCHAR(14);

-- CreateIndex: Índice para documentType
CREATE INDEX "customers_tenantId_document_type_idx" ON "customers"("tenantId", "document_type");

-- CreateIndex: Índice único para CNPJ por tenant
CREATE UNIQUE INDEX "customers_tenantId_cnpj_key" ON "customers"("tenantId", "cnpj") WHERE "cnpj" IS NOT NULL;

-- AlterTable: Adicionar campos de serviço ao ServiceOrderService
ALTER TABLE "service_order_services" ADD COLUMN "service_type" VARCHAR(50);
ALTER TABLE "service_order_services" ADD COLUMN "performed_at" TIMESTAMP(3);
ALTER TABLE "service_order_services" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex: Índices para ServiceOrderService
CREATE INDEX "service_order_services_serviceOrderId_idx" ON "service_order_services"("serviceOrderId");
CREATE INDEX "service_order_services_service_type_idx" ON "service_order_services"("service_type");

