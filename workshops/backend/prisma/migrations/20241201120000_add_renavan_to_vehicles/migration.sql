-- AlterTable: Adicionar coluna renavan se a tabela existir
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customer_vehicles') THEN
        -- Verificar se a coluna já existe antes de adicionar
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_vehicles' AND column_name = 'renavan') THEN
            ALTER TABLE "customer_vehicles" ADD COLUMN "renavan" VARCHAR(11);
        END IF;
        
        -- Criar índice se não existir
        IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'customer_vehicles' AND indexname = 'customer_vehicles_renavan_idx') THEN
            CREATE INDEX "customer_vehicles_renavan_idx" ON "customer_vehicles"("renavan");
        END IF;
    END IF;
END $$;

