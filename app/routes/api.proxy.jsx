// import prisma from "../db.server.js";

// export async function loader({ request }) {
//   const url = new URL(request.url);
//   const productId = url.searchParams.get("productId");

//   const normalizedId = `gid://shopify/Product/${productId}`;

//   const offer = await prisma.quantityBreakOffer.findFirst({
//     where: {
//       products: {
//         some: { id: normalizedId },
//       },
//     },
//     include: { tiers: true },
//   });

//   return new Response(JSON.stringify(offer || {}), {
//     headers: { "Content-Type": "application/json" },
//   });
// }

import prisma from "../db.server.js";
import { authenticate } from "../shopify.server";

function normalizeProductId(raw) {
  if (!raw) return null;
  const str = String(raw).trim();
  const match = str.match(/(\d+)$/);
  return match ? match[1] : str;
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    await authenticate.public.appProxy(request);
  } catch (err) {
    return Response.json(
      { tiers: [], offerId: null },
      { headers: corsHeaders() },
    );
  }

  const url = new URL(request.url);
  const rawId = url.searchParams.get("productId");
  const productId = normalizeProductId(rawId);

  if (!productId) {
    return Response.json(
      { tiers: [], offerId: null },
      { headers: corsHeaders() },
    );
  }

  const selectedOffer = await prisma.quantityBreakOffer.findFirst({
    where: {
      applyTo: "selectedProducts",
      status: "active",
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      products: { some: { productId, isExcluded: false } },
    },
    include: { tiers: { orderBy: { quantity: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  if (selectedOffer) {
    return Response.json(
      { tiers: selectedOffer.tiers, offerId: selectedOffer.id },
      { headers: corsHeaders() },
    );
  }

  const allProductsOffer = await prisma.quantityBreakOffer.findFirst({
    where: {
      applyTo: "allProducts",
      status: "active",
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
    },
  });

  if (allProductsOffer) {
    return Response.json(
      { tiers: allProductsOffer.tiers, offerId: allProductsOffer.id },
      { headers: corsHeaders() },
    );
  }

  const excludeOffer = await prisma.quantityBreakOffer.findFirst({
    where: {
      applyTo: "excludeProducts",
      status: "active",
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      products: { none: { productId, isExcluded: true } },
    },
    include: { tiers: { orderBy: { quantity: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  if (excludeOffer) {
    return Response.json(
      { tiers: excludeOffer.tiers, offerId: excludeOffer.id },
      { headers: corsHeaders() },
    );
  }

  return Response.json(
    { tiers: [], offerId: null },
    { headers: corsHeaders() },
  );
}
