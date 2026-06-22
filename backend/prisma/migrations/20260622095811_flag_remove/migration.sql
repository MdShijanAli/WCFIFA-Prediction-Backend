/*
  Warnings:

  - You are about to drop the column `awayTeamFlag` on the `matches` table. All the data in the column will be lost.
  - You are about to drop the column `homeTeamFlag` on the `matches` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "matches" DROP COLUMN "awayTeamFlag",
DROP COLUMN "homeTeamFlag";
