import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);
  // Delete this customer's data from your database
  // payload.customer.id contains the customer ID
  return new Response(null, { status: 200 });
};
