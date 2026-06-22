-- AlterTable
ALTER TABLE "BxgyOffer" ADD COLUMN     "shopId" TEXT;

-- AlterTable
ALTER TABLE "FrequentlyBoughtOffer" ADD COLUMN     "applyTo" "ApplyToType" NOT NULL DEFAULT 'allProducts';

-- AlterTable
ALTER TABLE "QuantityBreakOffer" ADD COLUMN     "shopId" TEXT;

-- AddForeignKey
ALTER TABLE "QuantityBreakOffer" ADD CONSTRAINT "QuantityBreakOffer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BxgyOffer" ADD CONSTRAINT "BxgyOffer_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
