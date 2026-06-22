-- CreateEnum
CREATE TYPE "QuantityBreakStatus" AS ENUM ('active', 'inactive');

-- AlterTable
ALTER TABLE "QuantityBreakOffer" ADD COLUMN     "status" "QuantityBreakStatus" NOT NULL DEFAULT 'active';
