-- Add dealRating field to Contract table
ALTER TABLE "Contract" ADD COLUMN IF NOT EXISTS "dealRating" INTEGER CHECK ("dealRating" >= 1 AND "dealRating" <= 5);

-- Create index on dealRating for efficient filtering
CREATE INDEX IF NOT EXISTS "Contract_dealRating_idx" ON "Contract"("dealRating");

-- Create RedactionMetadata table to store redaction information
CREATE TABLE IF NOT EXISTS "RedactionMetadata" (
  id TEXT PRIMARY KEY,
  "contractId" TEXT REFERENCES "Contract"(id) ON DELETE CASCADE,
  "redactionData" JSONB NOT NULL, -- Store redaction coordinates and metadata
  "originalFileName" TEXT, -- Name of original file for reference
  "redactedFileName" TEXT NOT NULL, -- Name of redacted file that was uploaded
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create index on contractId for efficient lookups
CREATE INDEX IF NOT EXISTS "RedactionMetadata_contractId_idx" ON "RedactionMetadata"("contractId");

-- Add comment to explain the table purpose
COMMENT ON TABLE "RedactionMetadata" IS 'Stores metadata about redacted files to maintain audit trail without storing sensitive data';
