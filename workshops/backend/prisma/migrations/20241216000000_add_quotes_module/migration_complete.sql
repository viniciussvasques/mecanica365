-- CreateTable: Quotes
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        CREATE TABLE "quotes" (
            "id" TEXT NOT NULL,
            "tenantId" TEXT NOT NULL,
            "number" TEXT NOT NULL,
            "customerId" TEXT,
            "vehicleId" TEXT,
            "elevatorId" TEXT,
            "serviceOrderId" TEXT,
            "status" TEXT NOT NULL DEFAULT 'draft',
            "version" INTEGER NOT NULL DEFAULT 1,
            "parentQuoteId" TEXT,
            "laborCost" DECIMAL(65,30),
            "partsCost" DECIMAL(65,30),
            "totalCost" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "taxAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
            "expiresAt" TIMESTAMP(3),
            "validUntil" TIMESTAMP(3),
            "sentAt" TIMESTAMP(3),
            "viewedAt" TIMESTAMP(3),
            "acceptedAt" TIMESTAMP(3),
            "rejectedAt" TIMESTAMP(3),
            "rejectedReason" TEXT,
            "customerSignature" TEXT,
            "convertedAt" TIMESTAMP(3),
            "convertedToServiceOrderId" TEXT,
            
            -- Problema relatado pelo cliente
            "reportedProblemCategory" TEXT,
            "reportedProblemDescription" TEXT,
            "reportedProblemSymptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
            
            -- Problema identificado pelo mecânico
            "identifiedProblemCategory" TEXT,
            "identifiedProblemDescription" TEXT,
            "identifiedProblemId" TEXT,
            
            -- Diagnóstico e observações do mecânico
            "diagnosticNotes" TEXT,
            "inspectionNotes" TEXT,
            "inspectionPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
            
            -- Recomendações
            "recommendations" TEXT,
            
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Adicionar campos novos se a tabela já existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        -- Problema relatado
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'reportedProblemCategory') THEN
            ALTER TABLE "quotes" ADD COLUMN "reportedProblemCategory" TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'reportedProblemDescription') THEN
            ALTER TABLE "quotes" ADD COLUMN "reportedProblemDescription" TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'reportedProblemSymptoms') THEN
            ALTER TABLE "quotes" ADD COLUMN "reportedProblemSymptoms" TEXT[] DEFAULT ARRAY[]::TEXT[];
        END IF;
        
        -- Problema identificado
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'identifiedProblemCategory') THEN
            ALTER TABLE "quotes" ADD COLUMN "identifiedProblemCategory" TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'identifiedProblemDescription') THEN
            ALTER TABLE "quotes" ADD COLUMN "identifiedProblemDescription" TEXT;
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'identifiedProblemId') THEN
            ALTER TABLE "quotes" ADD COLUMN "identifiedProblemId" TEXT;
        END IF;
        
        -- Recomendações
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'recommendations') THEN
            ALTER TABLE "quotes" ADD COLUMN "recommendations" TEXT;
        END IF;
    END IF;
END $$;

-- CreateTable: Quote Items
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
        CREATE TABLE "quote_items" (
            "id" TEXT NOT NULL,
            "quoteId" TEXT NOT NULL,
            "type" TEXT NOT NULL,
            "serviceId" TEXT,
            "partId" TEXT,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "quantity" INTEGER NOT NULL DEFAULT 1,
            "unitCost" DECIMAL(65,30) NOT NULL,
            "totalCost" DECIMAL(65,30) NOT NULL,
            "hours" DECIMAL(65,30),

            CONSTRAINT "quote_items_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- CreateIndex: Unique constraint tenantId + number
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_tenantId_number_key') THEN
            CREATE UNIQUE INDEX "quotes_tenantId_number_key" ON "quotes"("tenantId", "number");
        END IF;
    END IF;
END $$;

-- CreateIndex: Status
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_tenantId_status_idx') THEN
            CREATE INDEX "quotes_tenantId_status_idx" ON "quotes"("tenantId", "status");
        END IF;
    END IF;
END $$;

-- CreateIndex: Customer
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_tenantId_customerId_idx') THEN
            CREATE INDEX "quotes_tenantId_customerId_idx" ON "quotes"("tenantId", "customerId");
        END IF;
    END IF;
END $$;

-- CreateIndex: Vehicle
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_tenantId_vehicleId_idx') THEN
            CREATE INDEX "quotes_tenantId_vehicleId_idx" ON "quotes"("tenantId", "vehicleId");
        END IF;
    END IF;
END $$;

-- CreateIndex: Elevator
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_elevatorId_idx') THEN
            CREATE INDEX "quotes_elevatorId_idx" ON "quotes"("elevatorId");
        END IF;
    END IF;
END $$;

-- CreateIndex: Problem Categories
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_reportedProblemCategory_idx') THEN
            CREATE INDEX "quotes_reportedProblemCategory_idx" ON "quotes"("reportedProblemCategory");
        END IF;
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_identifiedProblemCategory_idx') THEN
            CREATE INDEX "quotes_identifiedProblemCategory_idx" ON "quotes"("identifiedProblemCategory");
        END IF;
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_identifiedProblemId_idx') THEN
            CREATE INDEX "quotes_identifiedProblemId_idx" ON "quotes"("identifiedProblemId");
        END IF;
    END IF;
END $$;

-- AddForeignKey: Customer
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'quotes_customerId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customerId_fkey" 
            FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey: Vehicle
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'quotes_vehicleId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vehicleId_fkey" 
            FOREIGN KEY ("vehicleId") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey: Elevator (apenas se tabela elevators existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'elevators') THEN
        IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'quotes_elevatorId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_elevatorId_fkey" 
            FOREIGN KEY ("elevatorId") REFERENCES "elevators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey: ServiceOrder
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'quotes_serviceOrderId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_serviceOrderId_fkey" 
            FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey: Parent Quote (Versioning)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'quotes_parentQuoteId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_parentQuoteId_fkey" 
            FOREIGN KEY ("parentQuoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey: CommonProblem (Identified Problem) - apenas se tabela existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'common_problems') THEN
        IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'quotes_identifiedProblemId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_identifiedProblemId_fkey" 
            FOREIGN KEY ("identifiedProblemId") REFERENCES "common_problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey: Tenant
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'quotes_tenantId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenantId_fkey" 
            FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey: Quote Items
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
        IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'quote_items_quoteId_fkey') THEN
            ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" 
            FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- CreateIndex: Quote Items
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quote_items' AND indexname = 'quote_items_quoteId_idx') THEN
            CREATE INDEX "quote_items_quoteId_idx" ON "quote_items"("quoteId");
        END IF;
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quote_items' AND indexname = 'quote_items_type_idx') THEN
            CREATE INDEX "quote_items_type_idx" ON "quote_items"("type");
        END IF;
    END IF;
END $$;

