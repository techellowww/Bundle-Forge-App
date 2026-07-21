import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function normalizeProductId(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  const match = str.match(/(\d+)$/);
  return match ? match[1] : str;
}

async function check() {
  const productId = "15053644792176";
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  const allBundles = await prisma.fixedBundleOffer.findMany({
    where: {
      status: "active",
      OR: [{ startDate: null }, { startDate: { lte: today } }],
      AND: [{ OR: [{ endDate: null }, { endDate: { gte: today } }] }],
    },
    include: {
      products: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
  
  console.log("All active bundles count:", allBundles.length);

  const matchedBundles = allBundles.filter((bundle) =>
    bundle.products.some(
      (p) => normalizeProductId(p.productId) === productId,
    ),
  );
  
  console.log("Matched bundles count:", matchedBundles.length);

  const offers = matchedBundles.map((bundle) => ({
    id: bundle.id,
    title: bundle.title,
    description: bundle.description,
    offerPercentage: bundle.offerPercentage,
    minQuantity: bundle.minQuantity,
    products: bundle.products.map((p) => ({
      id: p.productId,
      title: p.title,
      imageUrl: p.imageUrl,
      vendor: p.vendor,
    })),
  }));
  
  console.log("Final offers:", JSON.stringify(offers, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
