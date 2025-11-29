-- AlterTable: Adicionar coluna vehicleId ao ElevatorUsage (se a tabela existir)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'elevator_usages') THEN
        -- Verificar se a coluna já existe antes de adicionar
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'elevator_usages' AND column_name = 'vehicleId') THEN
            ALTER TABLE "elevator_usages" ADD COLUMN "vehicleId" TEXT;

            -- Criar índice se não existir
            IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'elevator_usages' AND indexname = 'elevator_usages_vehicleId_idx') THEN
                CREATE INDEX "elevator_usages_vehicleId_idx" ON "elevator_usages"("vehicleId");
            END IF;

            -- Adicionar foreign key se a tabela customer_vehicles existir
            IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_vehicles') THEN
                -- Verificar se a constraint já existe
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
    END IF;
END $$;

