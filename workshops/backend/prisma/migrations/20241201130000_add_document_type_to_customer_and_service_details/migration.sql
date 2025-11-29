-- AlterTable: Adicionar documentType e cnpj ao Customer (se a tabela existir)
DO $$
BEGIN
    -- Verificar se a tabela customers existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
        -- Adicionar document_type se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'document_type') THEN
            ALTER TABLE "customers" ADD COLUMN "document_type" VARCHAR(10) NOT NULL DEFAULT 'cpf';
        END IF;
        
        -- Adicionar cnpj se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'cnpj') THEN
            ALTER TABLE "customers" ADD COLUMN "cnpj" VARCHAR(14);
        END IF;
        
        -- Criar índice para documentType se não existir
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'customers' AND indexname = 'customers_tenantId_document_type_idx') THEN
            CREATE INDEX "customers_tenantId_document_type_idx" ON "customers"("tenantId", "document_type");
        END IF;
        
        -- Criar índice único para CNPJ se não existir
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'customers' AND indexname = 'customers_tenantId_cnpj_key') THEN
            CREATE UNIQUE INDEX "customers_tenantId_cnpj_key" ON "customers"("tenantId", "cnpj") WHERE "cnpj" IS NOT NULL;
        END IF;
    END IF;
    
    -- Verificar se a tabela service_order_services existe
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_order_services') THEN
        -- Adicionar service_type se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_order_services' AND column_name = 'service_type') THEN
            ALTER TABLE "service_order_services" ADD COLUMN "service_type" VARCHAR(50);
        END IF;
        
        -- Adicionar performed_at se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_order_services' AND column_name = 'performed_at') THEN
            ALTER TABLE "service_order_services" ADD COLUMN "performed_at" TIMESTAMP(3);
        END IF;
        
        -- Adicionar updated_at se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'service_order_services' AND column_name = 'updated_at') THEN
            ALTER TABLE "service_order_services" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        -- Criar índices se não existirem
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'service_order_services' AND indexname = 'service_order_services_serviceOrderId_idx') THEN
            CREATE INDEX "service_order_services_serviceOrderId_idx" ON "service_order_services"("serviceOrderId");
        END IF;
        
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'service_order_services' AND indexname = 'service_order_services_service_type_idx') THEN
            CREATE INDEX "service_order_services_service_type_idx" ON "service_order_services"("service_type");
        END IF;
    END IF;
END $$;

