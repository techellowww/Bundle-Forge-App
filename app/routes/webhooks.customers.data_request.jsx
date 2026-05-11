import { authenticate } from "../shopify.server";

export const action = async ({ request }) => {
  const { topic, shop } = await authenticate.webhook(request);
  // Customer requested their data - log it, you don't need to send data back
  return new Response(null, { status: 200 });
};
