/*
  Warnings:

  - The values [FREE] on the enum `DiscountType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DiscountType_new" AS ENUM ('percentage', 'amount', 'fixedPrice', 'free');
ALTER TABLE "public"."Bundle" ALTER COLUMN "discountType" DROP DEFAULT;
ALTER TABLE "Bundle" ALTER COLUMN "discountType" TYPE "DiscountType_new" USING ("discountType"::text::"DiscountType_new");
ALTER TABLE "QuantityBreakTier" ALTER COLUMN "discountType" TYPE "DiscountType_new" USING ("discountType"::text::"DiscountType_new");
ALTER TABLE "BxgyProductGift" ALTER COLUMN "discountType" TYPE "DiscountType_new" USING ("discountType"::text::"DiscountType_new");
ALTER TABLE "BxgyShippingGift" ALTER COLUMN "discountType" TYPE "DiscountType_new" USING ("discountType"::text::"DiscountType_new");
ALTER TABLE "FrequentlyBoughtOffer" ALTER COLUMN "discountType" TYPE "DiscountType_new" USING ("discountType"::text::"DiscountType_new");
ALTER TYPE "DiscountType" RENAME TO "DiscountType_old";
ALTER TYPE "DiscountType_new" RENAME TO "DiscountType";
DROP TYPE "public"."DiscountType_old";
ALTER TABLE "Bundle" ALTER COLUMN "discountType" SET DEFAULT 'percentage';
COMMIT;
