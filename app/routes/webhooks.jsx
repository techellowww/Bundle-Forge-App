import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  console.log(`[Webhook] ${topic} from ${shop}`);

  switch (topic) {
    case "CUSTOMERS_DATA_REQUEST":
      // Customer requested their data — just acknowledge
      console.log(`[GDPR] Data request for customer: ${payload?.customer?.id}`);
      break;

    case "CUSTOMERS_REDACT":
      // Delete customer data — your app doesn't store personal customer data
      console.log(`[GDPR] Redact customer: ${payload?.customer?.id}`);
      break;

    case "SHOP_REDACT":
      // Merchant uninstalled — delete all their data
      try {
        const shopRecord = await db.shop.findUnique({
          where: { domain: shop },
        });
        if (shopRecord) {
          await db.bundle.deleteMany({ where: { shopId: shopRecord.id } });
          await db.offer.deleteMany({ where: { shopId: shopRecord.id } });
          await db.quantityBreakOffer.deleteMany({ where: { shopId: shopRecord.id } });
          await db.fixedBundleOffer.deleteMany({ where: { shopId: shopRecord.id } });
          await db.frequentlyBoughtOffer.deleteMany({ where: { shopId: shopRecord.id } });
          await db.bxgyOffer.deleteMany({ where: { shopId: shopRecord.id } });
        }
        await db.session.deleteMany({ where: { shop } });
        console.log(`[GDPR] All data deleted for: ${shop}`);
      } catch (err) {
        console.error(`[GDPR] Error:`, err);
      }
      break;

    default:
      console.warn(`[Webhook] Unhandled topic: ${topic}`);
  }

  return new Response(null, { status: 200 });
};
