import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const bundles = await prisma.fixedBundleOffer.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  
  for (const bundle of bundles) {
    console.log("Bundle in DB:", bundle.title);
    console.log("- minQuantity:", bundle.minQuantity);
    console.log("- shopifyDiscountId:", bundle.shopifyDiscountId);
  }
}
check().catch(console.error).finally(() => prisma.$disconnect());
