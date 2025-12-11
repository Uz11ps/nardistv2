-- AlterTable
ALTER TABLE "quests" ADD COLUMN     "durationType" TEXT,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "holidayName" TEXT,
ADD COLUMN     "isHoliday" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInfinite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startDate" TIMESTAMP(3);
