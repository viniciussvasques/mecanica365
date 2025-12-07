-- CreateTable
CREATE TABLE IF NOT EXISTS "reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "format" VARCHAR(10) NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500),
    "file_size" INTEGER,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "filters" JSONB,
    "summary" JSONB,
    "generated_by" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'completed',
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_tenant_id_idx" ON "reports"("tenant_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_tenant_id_type_idx" ON "reports"("tenant_id", "type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_tenant_id_created_at_idx" ON "reports"("tenant_id", "created_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_tenant_id_status_idx" ON "reports"("tenant_id", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_generated_by_idx" ON "reports"("generated_by");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_expires_at_idx" ON "reports"("expires_at");

-- AddForeignKey (only if tenants table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'reports_tenant_id_fkey'
        ) THEN
            ALTER TABLE "reports" 
            ADD CONSTRAINT "reports_tenant_id_fkey" 
            FOREIGN KEY ("tenant_id") 
            REFERENCES "tenants"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- AddForeignKey (only if users table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'reports_generated_by_fkey'
        ) THEN
            ALTER TABLE "reports" 
            ADD CONSTRAINT "reports_generated_by_fkey" 
            FOREIGN KEY ("generated_by") 
            REFERENCES "users"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

