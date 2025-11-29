-- AlterTable: Adicionar campos de problema relatado/identificado e recomendações em ServiceOrder
-- Apenas se a tabela service_orders existir
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_orders') THEN
    -- Adicionar colunas apenas se não existirem
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'reportedProblemCategory') THEN
      ALTER TABLE "service_orders" ADD COLUMN "reportedProblemCategory" TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'reportedProblemDescription') THEN
      ALTER TABLE "service_orders" ADD COLUMN "reportedProblemDescription" TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'reportedProblemSymptoms') THEN
      ALTER TABLE "service_orders" ADD COLUMN "reportedProblemSymptoms" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'identifiedProblemCategory') THEN
      ALTER TABLE "service_orders" ADD COLUMN "identifiedProblemCategory" TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'identifiedProblemDescription') THEN
      ALTER TABLE "service_orders" ADD COLUMN "identifiedProblemDescription" TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'identifiedProblemId') THEN
      ALTER TABLE "service_orders" ADD COLUMN "identifiedProblemId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'diagnosticNotes') THEN
      ALTER TABLE "service_orders" ADD COLUMN "diagnosticNotes" TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'service_orders' AND column_name = 'recommendations') THEN
      ALTER TABLE "service_orders" ADD COLUMN "recommendations" TEXT;
    END IF;
  END IF;
END $$;

-- AlterTable: Adicionar campos de problema relatado/identificado e recomendações em Quote
-- Apenas se a tabela quotes existir
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes') THEN
    -- Adicionar colunas apenas se não existirem
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'reportedProblemCategory') THEN
      ALTER TABLE "quotes" ADD COLUMN "reportedProblemCategory" TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'reportedProblemDescription') THEN
      ALTER TABLE "quotes" ADD COLUMN "reportedProblemDescription" TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'reportedProblemSymptoms') THEN
      ALTER TABLE "quotes" ADD COLUMN "reportedProblemSymptoms" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'identifiedProblemCategory') THEN
      ALTER TABLE "quotes" ADD COLUMN "identifiedProblemCategory" TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'identifiedProblemDescription') THEN
      ALTER TABLE "quotes" ADD COLUMN "identifiedProblemDescription" TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'identifiedProblemId') THEN
      ALTER TABLE "quotes" ADD COLUMN "identifiedProblemId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'recommendations') THEN
      ALTER TABLE "quotes" ADD COLUMN "recommendations" TEXT;
    END IF;
  END IF;
END $$;

-- AlterTable: Adicionar campos symptoms e solutions em CommonProblem
-- Apenas se a tabela common_problems existir
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'common_problems') THEN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'common_problems' AND column_name = 'symptoms') THEN
      ALTER TABLE "common_problems" ADD COLUMN "symptoms" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'common_problems' AND column_name = 'solutions') THEN
      ALTER TABLE "common_problems" ADD COLUMN "solutions" TEXT[] DEFAULT ARRAY[]::TEXT[];
    END IF;
  END IF;
END $$;

-- DropColumn: Remover commonProblemId duplicado de ServiceOrder (se existir)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_orders') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'service_orders' AND column_name = 'commonProblemId'
    ) THEN
      ALTER TABLE "service_orders" DROP COLUMN "commonProblemId";
    END IF;
  END IF;
END $$;

-- AddForeignKey: Relação entre ServiceOrder e CommonProblem via identifiedProblemId
-- Apenas se ambas as tabelas existirem
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_orders')
     AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'common_problems') THEN
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
  END IF;
END $$;

-- AddForeignKey: Relação entre Quote e CommonProblem via identifiedProblemId
-- Apenas se ambas as tabelas existirem
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quotes')
     AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'common_problems') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'quotes_identifiedProblemId_fkey'
    ) THEN
      ALTER TABLE "quotes" 
      ADD CONSTRAINT "quotes_identifiedProblemId_fkey" 
      FOREIGN KEY ("identifiedProblemId") 
      REFERENCES "common_problems"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- CreateIndex: Índices para melhorar performance nas consultas
-- Apenas se as tabelas existirem
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_orders') THEN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'service_orders' AND indexname = 'service_orders_reportedProblemCategory_idx') THEN
      CREATE INDEX "service_orders_reportedProblemCategory_idx" ON "service_orders"("reportedProblemCategory");
    END IF;
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'service_orders' AND indexname = 'service_orders_identifiedProblemCategory_idx') THEN
      CREATE INDEX "service_orders_identifiedProblemCategory_idx" ON "service_orders"("identifiedProblemCategory");
    END IF;
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'service_orders' AND indexname = 'service_orders_identifiedProblemId_idx') THEN
      CREATE INDEX "service_orders_identifiedProblemId_idx" ON "service_orders"("identifiedProblemId");
    END IF;
  END IF;
END $$;

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
