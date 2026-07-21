import { PrismaClient } from '@prisma/client';

async function check() {
  const prisma = new PrismaClient();
  const session = await prisma.session.findFirst({
    orderBy: { id: 'desc' }
  });
  
  if (!session) {
    console.log("No session found");
    return;
  }
  
  const bundles = await prisma.fixedBundleOffer.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  const validBundle = bundles.find(b => b.shopifyDiscountId);
  if (!validBundle) return;
  
  console.log("Found bundle with shopifyDiscountId:", validBundle.title, validBundle.shopifyDiscountId);
  
  const res = await fetch(`https://${session.shop}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": session.accessToken,
    },
    body: JSON.stringify({
      query: `query {
        discountNode(id: "${validBundle.shopifyDiscountId}") {
          metafield(namespace: "fixed-bundle", key: "config") {
            value
          }
        }
      }`
    })
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

check().catch(console.error);
