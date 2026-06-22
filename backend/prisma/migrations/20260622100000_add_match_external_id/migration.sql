-- Add the football-data.org match identifier used by the sync service.
ALTER TABLE "matches" ADD COLUMN "externalId" TEXT;

CREATE UNIQUE INDEX "matches_externalId_key" ON "matches"("externalId");
