-- CreateEnum
CREATE TYPE "BxgyStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAFT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "GiftModeType" AS ENUM ('PRODUCT_GIFT', 'SHIPPING_DISCOUNT');

-- CreateEnum
CREATE TYPE "TrackByType" AS ENUM ('PRODUCT', 'VARIANT');

-- CreateEnum
CREATE TYPE "FbtStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAFT');

-- CreateTable
CREATE TABLE "BxgyOffer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discountTitle" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "BxgyStatus" NOT NULL DEFAULT 'ACTIVE',
    "shopifyDiscountId" TEXT,
    "applyTo" "ApplyToType" NOT NULL,
    "requiredQuantity" INTEGER NOT NULL DEFAULT 1,
    "trackBy" "TrackByType" NOT NULL DEFAULT 'PRODUCT',
    "sameAsGift" BOOLEAN NOT NULL DEFAULT false,
    "giftMode" "GiftModeType" NOT NULL DEFAULT 'PRODUCT_GIFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BxgyOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BxgyProduct" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT,
    "isExcluded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BxgyProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BxgyVendor" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,

    CONSTRAINT "BxgyVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BxgyProductType" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productType" TEXT NOT NULL,

    CONSTRAINT "BxgyProductType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BxgyCollection" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "BxgyCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BxgyProductGift" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DOUBLE PRECISION,
    "giftQuantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "BxgyProductGift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BxgyGiftProduct" (
    "id" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "BxgyGiftProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BxgyShippingGift" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "discountValue" DOUBLE PRECISION,
    "enableFreeShipping" BOOLEAN NOT NULL DEFAULT false,
    "freeShippingLabel" TEXT,

    CONSTRAINT "BxgyShippingGift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrequentlyBoughtOffer" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "discountTitle" TEXT,
    "status" "FbtStatus" NOT NULL DEFAULT 'ACTIVE',
    "discountType" "DiscountType",
    "discountValue" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "shopifyDiscountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FrequentlyBoughtOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FbtTriggerProduct" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "FbtTriggerProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FbtBundledProduct" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FbtBundledProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BxgyOffer_status_idx" ON "BxgyOffer"("status");

-- CreateIndex
CREATE INDEX "BxgyProduct_offerId_idx" ON "BxgyProduct"("offerId");

-- CreateIndex
CREATE INDEX "BxgyProduct_productId_idx" ON "BxgyProduct"("productId");

-- CreateIndex
CREATE INDEX "BxgyVendor_offerId_idx" ON "BxgyVendor"("offerId");

-- CreateIndex
CREATE INDEX "BxgyProductType_offerId_idx" ON "BxgyProductType"("offerId");

-- CreateIndex
CREATE INDEX "BxgyCollection_offerId_idx" ON "BxgyCollection"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "BxgyProductGift_offerId_key" ON "BxgyProductGift"("offerId");

-- CreateIndex
CREATE INDEX "BxgyGiftProduct_giftId_idx" ON "BxgyGiftProduct"("giftId");

-- CreateIndex
CREATE UNIQUE INDEX "BxgyShippingGift_offerId_key" ON "BxgyShippingGift"("offerId");

-- CreateIndex
CREATE INDEX "FrequentlyBoughtOffer_shopId_idx" ON "FrequentlyBoughtOffer"("shopId");

-- CreateIndex
CREATE INDEX "FrequentlyBoughtOffer_status_idx" ON "FrequentlyBoughtOffer"("status");

-- CreateIndex
CREATE INDEX "FbtTriggerProduct_offerId_idx" ON "FbtTriggerProduct"("offerId");

-- CreateIndex
CREATE INDEX "FbtBundledProduct_offerId_idx" ON "FbtBundledProduct"("offerId");

-- AddForeignKey
ALTER TABLE "BxgyProduct" ADD CONSTRAINT "BxgyProduct_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "BxgyOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BxgyVendor" ADD CONSTRAINT "BxgyVendor_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "BxgyOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BxgyProductType" ADD CONSTRAINT "BxgyProductType_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "BxgyOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BxgyCollection" ADD CONSTRAINT "BxgyCollection_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "BxgyOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BxgyProductGift" ADD CONSTRAINT "BxgyProductGift_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "BxgyOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BxgyGiftProduct" ADD CONSTRAINT "BxgyGiftProduct_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "BxgyProductGift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BxgyShippingGift" ADD CONSTRAINT "BxgyShippingGift_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "BxgyOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrequentlyBoughtOffer" ADD CONSTRAINT "FrequentlyBoughtOffer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FbtTriggerProduct" ADD CONSTRAINT "FbtTriggerProduct_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "FrequentlyBoughtOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FbtBundledProduct" ADD CONSTRAINT "FbtBundledProduct_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "FrequentlyBoughtOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
