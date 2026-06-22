-- CreateEnum
CREATE TYPE "FixedBundleStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAFT', 'EXPIRED');

-- CreateTable
CREATE TABLE "FixedBundleOffer" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "FixedBundleStatus" NOT NULL DEFAULT 'ACTIVE',
    "discountType" "DiscountType",
    "discountValue" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "shopifyDiscountId" TEXT,
    "functionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedBundleOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedBundleProduct" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT,
    "vendor" TEXT,
    "productType" TEXT,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FixedBundleProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FixedBundleOffer_shopId_idx" ON "FixedBundleOffer"("shopId");

-- CreateIndex
CREATE INDEX "FixedBundleOffer_status_idx" ON "FixedBundleOffer"("status");

-- CreateIndex
CREATE INDEX "FixedBundleProduct_offerId_idx" ON "FixedBundleProduct"("offerId");

-- AddForeignKey
ALTER TABLE "FixedBundleOffer" ADD CONSTRAINT "FixedBundleOffer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedBundleProduct" ADD CONSTRAINT "FixedBundleProduct_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "FixedBundleOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
