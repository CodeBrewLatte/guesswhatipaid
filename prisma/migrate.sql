-- Migration script to add missing fields to match frontend code expectations

-- Add missing fields to Contract table
ALTER TABLE "Contract" 
ADD COLUMN IF NOT EXISTS "priceCents" INTEGER,
ADD COLUMN IF NOT EXISTS "unit" TEXT,
ADD COLUMN IF NOT EXISTS "quantity" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "thumbKey" TEXT,
ADD COLUMN IF NOT EXISTS "vendorName" TEXT,
ADD COLUMN IF NOT EXISTS "takenOn" TIMESTAMP;

-- Convert existing amount data to priceCents (multiply by 100 to convert to cents)
UPDATE "Contract" 
SET "priceCents" = "amount" * 100 
WHERE "amount" IS NOT NULL AND "priceCents" IS NULL;

-- Add missing fields to Review table
ALTER TABLE "Review" 
ADD COLUMN IF NOT EXISTS "userId" TEXT,
ADD COLUMN IF NOT EXISTS "email" TEXT;

-- Copy reviewerEmail to email for existing reviews
UPDATE "Review" 
SET "email" = "reviewerEmail" 
WHERE "reviewerEmail" IS NOT NULL AND "email" IS NULL;

-- Set userId to a default value for existing reviews (you may want to update this based on your needs)
UPDATE "Review" 
SET "userId" = 'legacy-review-' || id 
WHERE "userId" IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "Contract_category_region_idx" ON "Contract"("category", "region");
CREATE INDEX IF NOT EXISTS "Contract_priceCents_idx" ON "Contract"("priceCents");
CREATE INDEX IF NOT EXISTS "Review_contractId_idx" ON "Review"("contractId");
CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "Review_contractId_userId_idx" ON "Review"("contractId", "userId");
