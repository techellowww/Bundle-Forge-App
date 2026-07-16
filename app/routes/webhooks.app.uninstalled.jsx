import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { shop, session, topic } = await authenticate.webhook(request);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    await db.session.deleteMany({ where: { shop } });
  }

  // Flag the shop as uninstalled in the database instead of just deleting the session
  await db.shop.updateMany({
    where: { domain: shop },
    data: {
      uninstalledAt: new Date(),
      billingStatus: "inactive",
    },
  });

  return new Response(null, { status: 200 });
};
