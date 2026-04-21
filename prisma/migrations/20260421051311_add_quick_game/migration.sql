-- CreateEnum
CREATE TYPE "QuickGameStatus" AS ENUM ('waiting', 'active', 'complete');

-- AlterTable
ALTER TABLE "Tournament" ALTER COLUMN "joinCode" DROP DEFAULT;

-- CreateTable
CREATE TABLE "QuickGame" (
    "id" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "opponentId" TEXT,
    "winnerId" TEXT,
    "status" "QuickGameStatus" NOT NULL DEFAULT 'waiting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuickGame_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuickGame_joinCode_key" ON "QuickGame"("joinCode");

-- AddForeignKey
ALTER TABLE "QuickGame" ADD CONSTRAINT "QuickGame_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickGame" ADD CONSTRAINT "QuickGame_opponentId_fkey" FOREIGN KEY ("opponentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuickGame" ADD CONSTRAINT "QuickGame_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
