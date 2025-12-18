-- AlterTable
ALTER TABLE "users" ADD COLUMN "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "onboardingBotGameCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "onboardingQuickGameCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "onboardingCityViewed" BOOLEAN NOT NULL DEFAULT false;

