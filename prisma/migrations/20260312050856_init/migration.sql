-- CreateEnum
CREATE TYPE "OfferType" AS ENUM ('BOGO', 'FREE_GIFT', 'VOLUME_DISCOUNT', 'BUNDLE');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DRAFT', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('FREE', 'PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('percentage', 'amount', 'fixedPrice');

-- CreateEnum
CREATE TYPE "ApplyToType" AS ENUM ('allProducts', 'excludeProducts', 'selectedProducts', 'exceptSelectedVendorTypeCollection', 'productsInSelectedVendorTypeCollection');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN DEFAULT false,
    "emailVerified" BOOLEAN DEFAULT false,
    "refreshToken" TEXT,
    "refreshTokenExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shop" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "plan" "PlanType" NOT NULL DEFAULT 'FREE',
    "billingStatus" "BillingStatus" NOT NULL DEFAULT 'INACTIVE',
    "subscriptionId" TEXT,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Shop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "discountType" "DiscountType" NOT NULL DEFAULT 'percentage',
    "discountValue" DOUBLE PRECISION,
    "minQuantity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bundle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BundleItem" (
    "id" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "BundleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "shopId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "OfferType" NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" INTEGER NOT NULL DEFAULT 1,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "shopifyDiscountId" TEXT,
    "functionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferCondition" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "collectionId" TEXT,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferReward" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "rewardType" "RewardType" NOT NULL,
    "value" DOUBLE PRECISION,
    "maxQuantity" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantityBreakOffer" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "applyTo" "ApplyToType" NOT NULL,
    "subTitle" TEXT,
    "label" TEXT,
    "tag" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuantityBreakOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantityBreakTier" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "discountType" "DiscountType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "offerId" TEXT NOT NULL,

    CONSTRAINT "QuantityBreakTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantityBreakProduct" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,

    CONSTRAINT "QuantityBreakProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantityBreakVendor" (
    "id" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,

    CONSTRAINT "QuantityBreakVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantityBreakType" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,

    CONSTRAINT "QuantityBreakType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuantityBreakCollection" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,

    CONSTRAINT "QuantityBreakCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shop_domain_key" ON "Shop"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Shop_subscriptionId_key" ON "Shop"("subscriptionId");

-- CreateIndex
CREATE INDEX "Shop_domain_idx" ON "Shop"("domain");

-- CreateIndex
CREATE INDEX "Shop_plan_idx" ON "Shop"("plan");

-- CreateIndex
CREATE INDEX "Shop_billingStatus_idx" ON "Shop"("billingStatus");

-- CreateIndex
CREATE INDEX "Bundle_discountType_idx" ON "Bundle"("discountType");

-- CreateIndex
CREATE INDEX "BundleItem_bundleId_idx" ON "BundleItem"("bundleId");

-- CreateIndex
CREATE INDEX "BundleItem_productId_idx" ON "BundleItem"("productId");

-- AddForeignKey
ALTER TABLE "Bundle" ADD CONSTRAINT "Bundle_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleItem" ADD CONSTRAINT "BundleItem_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferCondition" ADD CONSTRAINT "OfferCondition_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferReward" ADD CONSTRAINT "OfferReward_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuantityBreakTier" ADD CONSTRAINT "QuantityBreakTier_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "QuantityBreakOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuantityBreakProduct" ADD CONSTRAINT "QuantityBreakProduct_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "QuantityBreakOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuantityBreakVendor" ADD CONSTRAINT "QuantityBreakVendor_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "QuantityBreakOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuantityBreakType" ADD CONSTRAINT "QuantityBreakType_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "QuantityBreakOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuantityBreakCollection" ADD CONSTRAINT "QuantityBreakCollection_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "QuantityBreakOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
