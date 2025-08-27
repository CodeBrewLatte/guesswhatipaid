-- Add status field to Contract table for approval workflow
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PENDING';

-- Create index on status for efficient filtering
CREATE INDEX IF NOT EXISTS "Contract_status_idx" ON "Contract"("status");

-- Update existing contracts to have PENDING status
UPDATE "Contract" SET "status" = 'PENDING' WHERE "status" IS NULL;
