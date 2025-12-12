-- CreateTable
CREATE TABLE "sieges" (
    "id" SERIAL NOT NULL,
    "districtId" INTEGER NOT NULL,
    "attackingClanId" INTEGER NOT NULL,
    "defendingClanId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "attackingWins" INTEGER NOT NULL DEFAULT 0,
    "defendingWins" INTEGER NOT NULL DEFAULT 0,
    "requiredWins" INTEGER NOT NULL DEFAULT 5,
    "winnerClanId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sieges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "siege_games" (
    "id" SERIAL NOT NULL,
    "siegeId" INTEGER NOT NULL,
    "whitePlayerId" INTEGER NOT NULL,
    "blackPlayerId" INTEGER NOT NULL,
    "winnerId" INTEGER,
    "gameHistoryId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "siege_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tournament_passes" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardsClaimed" JSONB,

    CONSTRAINT "tournament_passes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_passes_userId_tournamentId_key" ON "tournament_passes"("userId", "tournamentId");

-- AddForeignKey
ALTER TABLE "sieges" ADD CONSTRAINT "sieges_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sieges" ADD CONSTRAINT "sieges_attackingClanId_fkey" FOREIGN KEY ("attackingClanId") REFERENCES "clans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sieges" ADD CONSTRAINT "sieges_defendingClanId_fkey" FOREIGN KEY ("defendingClanId") REFERENCES "clans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "siege_games" ADD CONSTRAINT "siege_games_siegeId_fkey" FOREIGN KEY ("siegeId") REFERENCES "sieges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_passes" ADD CONSTRAINT "tournament_passes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tournament_passes" ADD CONSTRAINT "tournament_passes_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

