/*
  Warnings:

  - The values [pending,active,expired] on the enum `RentalStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RentalStatus_new" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'COMPLETED');
ALTER TABLE "public"."rental" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "rental" ALTER COLUMN "status" TYPE "RentalStatus_new" USING ("status"::text::"RentalStatus_new");
ALTER TYPE "RentalStatus" RENAME TO "RentalStatus_old";
ALTER TYPE "RentalStatus_new" RENAME TO "RentalStatus";
DROP TYPE "public"."RentalStatus_old";
ALTER TABLE "rental" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropIndex
DROP INDEX "rental_userId_idx";

-- DropIndex
DROP INDEX "rental_userId_status_key";

-- AlterTable
ALTER TABLE "rental" ADD COLUMN     "accessKey" TEXT,
ADD COLUMN     "lastNotifiedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "languageCode" TEXT;

-- CreateIndex
CREATE INDEX "rental_userId_status_idx" ON "rental"("userId", "status");

-- CreateIndex
CREATE INDEX "rental_status_endDate_idx" ON "rental"("status", "endDate");
