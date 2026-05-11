import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop } = await authenticate.webhook(request);

  try {
    // 1. Find the shop record first
    const shopRecord = await db.shop.findUnique({
      where: { domain: shop },
    });

    if (shopRecord) {
      // 2. Delete all quantity break offers (cascades tiers/products)
      await db.quantityBreakOffer.deleteMany({
        where: {
          /* add shop relation if exists, or delete all */
        },
      });

      // 3. Delete bundles and offers tied to this shop
      await db.bundle.deleteMany({ where: { shopId: shopRecord.id } });
      await db.offer.deleteMany({ where: { shopId: shopRecord.id } });
    }

    // 4. Delete sessions
    await db.session.deleteMany({ where: { shop } });

  } catch (err) {
    console.error(`[GDPR] Error:`, err);
  }

  return new Response(null, { status: 200 });
};
