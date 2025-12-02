-- Add public token fields to quotes table
ALTER TABLE "quotes" 
ADD COLUMN IF NOT EXISTS "publicToken" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "publicTokenExpiresAt" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "approvalMethod" TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "quotes_publicToken_idx" ON "quotes"("publicToken");

