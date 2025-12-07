-- CreateTable
CREATE TABLE IF NOT EXISTS "backups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'in_progress',
    "size" BIGINT,
    "path" VARCHAR(500),
    "s3_key" VARCHAR(500),
    "encrypted" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "metadata" JSONB,
    "error" TEXT,

    CONSTRAINT "backups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "restore_operations" (
    "id" TEXT NOT NULL,
    "backup_id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "error" TEXT,

    CONSTRAINT "restore_operations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "backups_tenant_id_started_at_idx" ON "backups"("tenant_id", "started_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "backups_status_idx" ON "backups"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "backups_expires_at_idx" ON "backups"("expires_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "backups_type_idx" ON "backups"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "restore_operations_tenant_id_started_at_idx" ON "restore_operations"("tenant_id", "started_at");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "restore_operations_status_idx" ON "restore_operations"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "restore_operations_backup_id_idx" ON "restore_operations"("backup_id");

-- AddForeignKey para backups_tenant_id_fkey (apenas se tenants existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tenants'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'backups_tenant_id_fkey'
    ) THEN
        ALTER TABLE "backups" ADD CONSTRAINT "backups_tenant_id_fkey" 
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey para restore_operations_backup_id_fkey
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'restore_operations_backup_id_fkey'
    ) THEN
        ALTER TABLE "restore_operations" ADD CONSTRAINT "restore_operations_backup_id_fkey" 
        FOREIGN KEY ("backup_id") REFERENCES "backups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey para restore_operations_tenant_id_fkey (apenas se tenants existir)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tenants'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'restore_operations_tenant_id_fkey'
    ) THEN
        ALTER TABLE "restore_operations" ADD CONSTRAINT "restore_operations_tenant_id_fkey" 
        FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

