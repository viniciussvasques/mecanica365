-- Migration: Adicionar campos de atribuição de mecânico e sistema de notificações
-- Adiciona assignedMechanicId, assignedAt ao Quote
-- Cria tabelas QuoteAssignmentHistory e Notification

-- Adicionar campos de atribuição ao Quote
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
        -- Adicionar assignedMechanicId se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'assignedMechanicId') THEN
            ALTER TABLE "quotes" ADD COLUMN "assignedMechanicId" TEXT;
        END IF;

        -- Adicionar assignedAt se não existir
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'assignedAt') THEN
            ALTER TABLE "quotes" ADD COLUMN "assignedAt" TIMESTAMP(3);
        END IF;

        -- Criar índices
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_assignedMechanicId_idx') THEN
            CREATE INDEX "quotes_assignedMechanicId_idx" ON "quotes"("assignedMechanicId");
        END IF;

        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'quotes' AND indexname = 'quotes_tenantId_status_assignedMechanicId_idx') THEN
            CREATE INDEX "quotes_tenantId_status_assignedMechanicId_idx" ON "quotes"("tenantId", "status", "assignedMechanicId");
        END IF;

        -- Adicionar foreign key para users se a tabela existir
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'quotes_assignedMechanicId_fkey'
            ) THEN
                ALTER TABLE "quotes" 
                ADD CONSTRAINT "quotes_assignedMechanicId_fkey" 
                FOREIGN KEY ("assignedMechanicId") 
                REFERENCES "users"("id") 
                ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
        END IF;
    END IF;
END $$;

-- Criar tabela quote_assignment_history
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quote_assignment_history') THEN
        CREATE TABLE "quote_assignment_history" (
            "id" TEXT NOT NULL,
            "quoteId" TEXT NOT NULL,
            "mechanicId" TEXT NOT NULL,
            "assignedBy" TEXT NOT NULL,
            "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "unassignedAt" TIMESTAMP(3),
            "reason" TEXT,

            CONSTRAINT "quote_assignment_history_pkey" PRIMARY KEY ("id")
        );

        -- Criar índices
        CREATE INDEX "quote_assignment_history_quoteId_idx" ON "quote_assignment_history"("quoteId");
        CREATE INDEX "quote_assignment_history_mechanicId_idx" ON "quote_assignment_history"("mechanicId");
        CREATE INDEX "quote_assignment_history_assignedAt_idx" ON "quote_assignment_history"("assignedAt");

        -- Adicionar foreign keys
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
            ALTER TABLE "quote_assignment_history" 
            ADD CONSTRAINT "quote_assignment_history_quoteId_fkey" 
            FOREIGN KEY ("quoteId") 
            REFERENCES "quotes"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
            ALTER TABLE "quote_assignment_history" 
            ADD CONSTRAINT "quote_assignment_history_mechanicId_fkey" 
            FOREIGN KEY ("mechanicId") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;

            ALTER TABLE "quote_assignment_history" 
            ADD CONSTRAINT "quote_assignment_history_assignedBy_fkey" 
            FOREIGN KEY ("assignedBy") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Criar tabela notifications
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        CREATE TABLE "notifications" (
            "id" TEXT NOT NULL,
            "tenantId" TEXT NOT NULL,
            "userId" TEXT,
            "type" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "message" TEXT NOT NULL,
            "data" JSONB,
            "read" BOOLEAN NOT NULL DEFAULT false,
            "readAt" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
        );

        -- Criar índices
        CREATE INDEX "notifications_tenantId_userId_idx" ON "notifications"("tenantId", "userId");
        CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");
        CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

        -- Adicionar foreign keys
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
            ALTER TABLE "notifications" 
            ADD CONSTRAINT "notifications_tenantId_fkey" 
            FOREIGN KEY ("tenantId") 
            REFERENCES "tenants"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
            ALTER TABLE "notifications" 
            ADD CONSTRAINT "notifications_userId_fkey" 
            FOREIGN KEY ("userId") 
            REFERENCES "users"("id") 
            ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;

-- Adicionar índices aos users para otimizar consultas
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'users' AND indexname = 'users_tenantId_role_idx') THEN
            CREATE INDEX "users_tenantId_role_idx" ON "users"("tenantId", "role");
        END IF;

        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'users' AND indexname = 'users_role_idx') THEN
            CREATE INDEX "users_role_idx" ON "users"("role");
        END IF;
    END IF;
END $$;

