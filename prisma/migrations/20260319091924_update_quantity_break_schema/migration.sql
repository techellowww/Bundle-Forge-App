/*
  Warnings:

  - You are about to drop the column `label` on the `QuantityBreakOffer` table. All the data in the column will be lost.
  - You are about to drop the column `subTitle` on the `QuantityBreakOffer` table. All the data in the column will be lost.
  - You are about to drop the column `tag` on the `QuantityBreakOffer` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "QuantityBreakOffer" DROP COLUMN "label",
DROP COLUMN "subTitle",
DROP COLUMN "tag",
ADD COLUMN     "discountDescription" TEXT,
ADD COLUMN     "discountTitle" TEXT;

-- AlterTable
ALTER TABLE "QuantityBreakTier" ADD COLUMN     "labelText" TEXT,
ADD COLUMN     "preSelect" BOOLEAN,
ADD COLUMN     "subTitleText" TEXT,
ADD COLUMN     "tagText" TEXT,
ADD COLUMN     "tierTitle" TEXT;
