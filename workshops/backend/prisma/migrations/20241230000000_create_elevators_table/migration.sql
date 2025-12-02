-- Criar tabela elevators se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'elevators') THEN
        CREATE TABLE "elevators" (
            "id" TEXT NOT NULL,
            "tenantId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "number" TEXT NOT NULL,
            "type" TEXT NOT NULL DEFAULT 'hydraulic',
            "capacity" DECIMAL(65,30) NOT NULL,
            "status" TEXT NOT NULL DEFAULT 'free',
            "location" TEXT,
            "notes" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "elevators_pkey" PRIMARY KEY ("id")
        );

        -- Criar índices
        CREATE UNIQUE INDEX "elevators_tenantId_number_key" ON "elevators"("tenantId", "number");
        CREATE INDEX "elevators_tenantId_status_idx" ON "elevators"("tenantId", "status");

        -- Adicionar foreign key para tenants se a tabela existir
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenants') THEN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'elevators_tenantId_fkey'
            ) THEN
                ALTER TABLE "elevators" 
                ADD CONSTRAINT "elevators_tenantId_fkey" 
                FOREIGN KEY ("tenantId") 
                REFERENCES "tenants"("id") 
                ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
        END IF;
    END IF;
END $$;

-- Criar tabela elevator_usages se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'elevator_usages') THEN
        CREATE TABLE "elevator_usages" (
            "id" TEXT NOT NULL,
            "elevatorId" TEXT NOT NULL,
            "serviceOrderId" TEXT,
            "vehicleId" TEXT,
            "startTime" TIMESTAMP(3) NOT NULL,
            "endTime" TIMESTAMP(3),
            "notes" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "elevator_usages_pkey" PRIMARY KEY ("id")
        );

        -- Criar índices
        CREATE INDEX "elevator_usages_elevatorId_idx" ON "elevator_usages"("elevatorId");
        CREATE INDEX "elevator_usages_serviceOrderId_idx" ON "elevator_usages"("serviceOrderId");
        CREATE INDEX "elevator_usages_vehicleId_idx" ON "elevator_usages"("vehicleId");

        -- Adicionar foreign keys se as tabelas existirem
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'elevators') THEN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'elevator_usages_elevatorId_fkey'
            ) THEN
                ALTER TABLE "elevator_usages" 
                ADD CONSTRAINT "elevator_usages_elevatorId_fkey" 
                FOREIGN KEY ("elevatorId") 
                REFERENCES "elevators"("id") 
                ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_orders') THEN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'elevator_usages_serviceOrderId_fkey'
            ) THEN
                ALTER TABLE "elevator_usages" 
                ADD CONSTRAINT "elevator_usages_serviceOrderId_fkey" 
                FOREIGN KEY ("serviceOrderId") 
                REFERENCES "service_orders"("id") 
                ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_vehicles') THEN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'elevator_usages_vehicleId_fkey'
            ) THEN
                ALTER TABLE "elevator_usages" 
                ADD CONSTRAINT "elevator_usages_vehicleId_fkey" 
                FOREIGN KEY ("vehicleId") 
                REFERENCES "customer_vehicles"("id") 
                ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
        END IF;
    END IF;
END $$;

-- Criar tabela elevator_maintenances se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'elevator_maintenances') THEN
        CREATE TABLE "elevator_maintenances" (
            "id" TEXT NOT NULL,
            "elevatorId" TEXT NOT NULL,
            "scheduledDate" TIMESTAMP(3) NOT NULL,
            "completedDate" TIMESTAMP(3),
            "notes" TEXT,
            "technicianId" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "elevator_maintenances_pkey" PRIMARY KEY ("id")
        );

        -- Criar índices
        CREATE INDEX "elevator_maintenances_elevatorId_idx" ON "elevator_maintenances"("elevatorId");
        CREATE INDEX "elevator_maintenances_scheduledDate_idx" ON "elevator_maintenances"("scheduledDate");

        -- Adicionar foreign key para elevators se a tabela existir
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'elevators') THEN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint 
                WHERE conname = 'elevator_maintenances_elevatorId_fkey'
            ) THEN
                ALTER TABLE "elevator_maintenances" 
                ADD CONSTRAINT "elevator_maintenances_elevatorId_fkey" 
                FOREIGN KEY ("elevatorId") 
                REFERENCES "elevators"("id") 
                ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
        END IF;
    END IF;
END $$;

