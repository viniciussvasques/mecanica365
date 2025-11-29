-- AlterTable: Adicionar campos de problema relatado/identificado e recomendações em ServiceOrder
ALTER TABLE "service_orders" 
  ADD COLUMN IF NOT EXISTS "reportedProblemCategory" TEXT,
  ADD COLUMN IF NOT EXISTS "reportedProblemDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "reportedProblemSymptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "identifiedProblemCategory" TEXT,
  ADD COLUMN IF NOT EXISTS "identifiedProblemDescription" TEXT,
  ADD COLUMN IF NOT EXISTS "identifiedProblemId" TEXT,
  ADD COLUMN IF NOT EXISTS "diagnosticNotes" TEXT,
  ADD COLUMN IF NOT EXISTS "recommendations" TEXT;

-- AlterTable: Adicionar campos symptoms e solutions em CommonProblem
ALTER TABLE "common_problems" 
  ADD COLUMN IF NOT EXISTS "symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "solutions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropColumn: Remover commonProblemId duplicado de ServiceOrder (se existir)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_orders' AND column_name = 'commonProblemId'
  ) THEN
    ALTER TABLE "service_orders" DROP COLUMN "commonProblemId";
  END IF;
END $$;

-- AddForeignKey: Relação entre ServiceOrder e CommonProblem via identifiedProblemId
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'service_orders_identifiedProblemId_fkey'
  ) THEN
    ALTER TABLE "service_orders" 
    ADD CONSTRAINT "service_orders_identifiedProblemId_fkey" 
    FOREIGN KEY ("identifiedProblemId") 
    REFERENCES "common_problems"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex: Índices para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS "service_orders_reportedProblemCategory_idx" ON "service_orders"("reportedProblemCategory");
CREATE INDEX IF NOT EXISTS "service_orders_identifiedProblemCategory_idx" ON "service_orders"("identifiedProblemCategory");
CREATE INDEX IF NOT EXISTS "service_orders_identifiedProblemId_idx" ON "service_orders"("identifiedProblemId");

