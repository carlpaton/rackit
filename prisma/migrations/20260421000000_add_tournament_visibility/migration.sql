-- Add isPublic with default true
ALTER TABLE "Tournament" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- Add joinCode with a temporary default so existing rows get a value
ALTER TABLE "Tournament" ADD COLUMN "joinCode" TEXT NOT NULL DEFAULT '';

-- Assign unique codes to any existing rows
UPDATE "Tournament" SET "joinCode" = LOWER(SUBSTRING(MD5(RANDOM()::TEXT || id), 1, 4)) WHERE "joinCode" = '';

-- Ensure uniqueness (retry on collision is handled at app level; for existing rows this is sufficient)
CREATE UNIQUE INDEX "Tournament_joinCode_key" ON "Tournament"("joinCode");
