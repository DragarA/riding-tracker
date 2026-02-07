-- AlterTable
ALTER TABLE "BoardingLog" ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "LessonLog" ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false;
