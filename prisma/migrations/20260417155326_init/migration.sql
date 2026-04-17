-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'COMPLETED');

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "subscriptionType" TEXT NOT NULL DEFAULT 'free',
    "balance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "languageCode" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "term" INTEGER NOT NULL,
    "status" "RentalStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accessKey" TEXT,
    "lastNotifiedAt" TIMESTAMP(3),
    "clientId" TEXT,

    CONSTRAINT "rental_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_telegramId_key" ON "user"("telegramId");

-- CreateIndex
CREATE INDEX "rental_userId_status_idx" ON "rental"("userId", "status");

-- CreateIndex
CREATE INDEX "rental_status_endDate_idx" ON "rental"("status", "endDate");

-- CreateIndex
CREATE INDEX "rental_clientId_idx" ON "rental"("clientId");

-- AddForeignKey
ALTER TABLE "rental" ADD CONSTRAINT "rental_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
