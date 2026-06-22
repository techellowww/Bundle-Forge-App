/*
  Warnings:

  - The values [ACTIVE,PAUSED,DRAFT,EXPIRED] on the enum `BxgyStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACTIVE,PAUSED,DRAFT] on the enum `FbtStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ACTIVE,PAUSED,DRAFT,EXPIRED] on the enum `FixedBundleStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BxgyStatus_new" AS ENUM ('active', 'inactive');
ALTER TABLE "public"."BxgyOffer" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "BxgyOffer" ALTER COLUMN "status" TYPE "BxgyStatus_new" USING ("status"::text::"BxgyStatus_new");
ALTER TYPE "BxgyStatus" RENAME TO "BxgyStatus_old";
ALTER TYPE "BxgyStatus_new" RENAME TO "BxgyStatus";
DROP TYPE "public"."BxgyStatus_old";
ALTER TABLE "BxgyOffer" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "FbtStatus_new" AS ENUM ('active', 'inactive');
ALTER TABLE "public"."FrequentlyBoughtOffer" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "FrequentlyBoughtOffer" ALTER COLUMN "status" TYPE "FbtStatus_new" USING ("status"::text::"FbtStatus_new");
ALTER TYPE "FbtStatus" RENAME TO "FbtStatus_old";
ALTER TYPE "FbtStatus_new" RENAME TO "FbtStatus";
DROP TYPE "public"."FbtStatus_old";
ALTER TABLE "FrequentlyBoughtOffer" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "FixedBundleStatus_new" AS ENUM ('active', 'inactive');
ALTER TABLE "public"."FixedBundleOffer" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "FixedBundleOffer" ALTER COLUMN "status" TYPE "FixedBundleStatus_new" USING ("status"::text::"FixedBundleStatus_new");
ALTER TYPE "FixedBundleStatus" RENAME TO "FixedBundleStatus_old";
ALTER TYPE "FixedBundleStatus_new" RENAME TO "FixedBundleStatus";
DROP TYPE "public"."FixedBundleStatus_old";
ALTER TABLE "FixedBundleOffer" ALTER COLUMN "status" SET DEFAULT 'active';
COMMIT;

-- AlterTable
ALTER TABLE "BxgyOffer" ALTER COLUMN "status" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "FixedBundleOffer" ALTER COLUMN "status" SET DEFAULT 'active';

-- AlterTable
ALTER TABLE "FrequentlyBoughtOffer" ALTER COLUMN "status" SET DEFAULT 'active';
