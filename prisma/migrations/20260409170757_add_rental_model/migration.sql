-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('pending', 'active', 'expired');

-- CreateTable
CREATE TABLE "rental" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "term" INTEGER NOT NULL,
    "status" "RentalStatus" NOT NULL DEFAULT 'pending',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rental_userId_idx" ON "rental"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "rental_userId_status_key" ON "rental"("userId", "status");

-- AddForeignKey
ALTER TABLE "rental" ADD CONSTRAINT "rental_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
