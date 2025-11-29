-- CreateTable
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
            "diagnosticNotes" TEXT,
            "inspectionNotes" TEXT,
            "inspectionPhotos" TEXT[],
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- CreateTable
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

-- CreateIndex
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_tenantId_number_key') THEN
            CREATE UNIQUE INDEX "quotes_tenantId_number_key" ON "quotes"("tenantId", "number");
        END IF;
    END IF;
END $$;

-- CreateIndex
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_tenantId_status_idx') THEN
            CREATE INDEX "quotes_tenantId_status_idx" ON "quotes"("tenantId", "status");
        END IF;
    END IF;
END $$;

-- CreateIndex
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_tenantId_customerId_idx') THEN
            CREATE INDEX "quotes_tenantId_customerId_idx" ON "quotes"("tenantId", "customerId");
        END IF;
    END IF;
END $$;

-- CreateIndex
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_tenantId_vehicleId_idx') THEN
            CREATE INDEX "quotes_tenantId_vehicleId_idx" ON "quotes"("tenantId", "vehicleId");
        END IF;
    END IF;
END $$;

-- CreateIndex
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_elevatorId_idx') THEN
            CREATE INDEX "quotes_elevatorId_idx" ON "quotes"("elevatorId");
        END IF;
    END IF;
END $$;

-- CreateIndex
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quote_items' AND indexname = 'quote_items_quoteId_idx') THEN
            CREATE INDEX "quote_items_quoteId_idx" ON "quote_items"("quoteId");
        END IF;
    END IF;
END $$;

-- CreateIndex
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quote_items' AND indexname = 'quote_items_type_idx') THEN
            CREATE INDEX "quote_items_type_idx" ON "quote_items"("type");
        END IF;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_tenantId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_customerId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_vehicleId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "customer_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_elevatorId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_elevatorId_fkey" FOREIGN KEY ("elevatorId") REFERENCES "elevators"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_serviceOrderId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_serviceOrderId_fkey" FOREIGN KEY ("serviceOrderId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quotes_parentQuoteId_fkey') THEN
            ALTER TABLE "quotes" ADD CONSTRAINT "quotes_parentQuoteId_fkey" FOREIGN KEY ("parentQuoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_items_quoteId_fkey') THEN
            ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_items') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_items_partId_fkey') THEN
            ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

