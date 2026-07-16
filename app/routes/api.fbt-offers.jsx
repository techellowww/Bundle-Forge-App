import prisma, { resolveShop } from "../db.server";
import { authenticate } from "../shopify.server";

const FUNCTION_HANDLE = "fbt-discount";

const CREATE_DISCOUNT = `#graphql
  mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
    discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
      automaticAppDiscount { discountId title status }
      userErrors { field message }
    }
  }
`;

const UPDATE_DISCOUNT = `#graphql
  mutation discountAutomaticAppUpdate($id: ID!, $automaticAppDiscount: DiscountAutomaticAppInput!) {
    discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $automaticAppDiscount) {
      automaticAppDiscount { discountId title status }
      userErrors { field message }
    }
  }
`;

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = await resolveShop(session.shop);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id) {
    const offer = await prisma.frequentlyBoughtOffer.findFirst({
      where: { id, shopId: shop.id },
      include: {
        triggerProducts: true,
        bundledProducts: { orderBy: { position: "asc" } },
      },
    });
    if (!offer) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json({ offer });
  }

  const offers = await prisma.frequentlyBoughtOffer.findMany({
    where: { shopId: shop.id },
    include: {
      triggerProducts: true,
      bundledProducts: { orderBy: { position: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ offers });
}

export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const shop = await resolveShop(session.shop);

  const method = request.method.toUpperCase();
  const body = await request.json();

  if (method === "DELETE") {
    const { id } = body;
    if (!id) return Response.json({ error: "id required" }, { status: 400 });

    const offer = await prisma.frequentlyBoughtOffer.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!offer) return Response.json({ error: "Not found" }, { status: 404 });

    if (offer.shopifyDiscountId) {
      try {
        await deleteShopifyDiscount(admin, offer.shopifyDiscountId);
      } catch (e) {
        console.warn("Shopify discount delete failed:", e.message);
      }
    }

    await prisma.frequentlyBoughtOffer.delete({ where: { id } });
    return Response.json({ success: true });
  }

  const {
    id,
    title,
    discountTitle,
    discountDescription,
    startDate,
    endDate,
    applyTo,
    status,
    discountType,
    discountValue,
    triggerProducts = [],
    bundledProducts = [],
  } = body;

  if (!title?.trim() || typeof title !== "string") {
    return Response.json({ error: "title is required and must be a string" }, { status: 400 });
  }

  if (status && !["active", "inactive"].includes(status)) {
    return Response.json({ error: "status must be active or inactive" }, { status: 400 });
  }

  if (applyTo && !["allProducts", "selectedProducts", "excludeProducts", "exceptSelectedVendorTypeCollection", "productsInSelectedVendorTypeCollection"].includes(applyTo)) {
    return Response.json({ error: "invalid applyTo value" }, { status: 400 });
  }

  if (discountType && !["percentage", "amount", "fixedPrice", "freeShipping", "none"].includes(discountType)) {
    return Response.json({ error: "invalid discountType" }, { status: 400 });
  }

  if (discountValue != null && isNaN(Number(discountValue))) {
    return Response.json({ error: "discountValue must be a number" }, { status: 400 });
  }

  if (!Array.isArray(triggerProducts) || !Array.isArray(bundledProducts)) {
    return Response.json({ error: "triggerProducts and bundledProducts must be arrays" }, { status: 400 });
  }

  const offerData = {
    title: title.trim(),
    discountTitle: discountTitle?.trim() || null,
    status: status ?? "active",
    applyTo: applyTo ?? "allProducts",
    discountType: discountType || null,
    discountValue: discountValue != null ? Number(discountValue) : null,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
  };

  let offer;

  if (method === "PUT" && id) {
    const existing = await prisma.frequentlyBoughtOffer.findFirst({
      where: { id, shopId: shop.id },
    });
    if (!existing)
      return Response.json({ error: "Not found" }, { status: 404 });

    // ── Status-only update (no products in payload) ──
    if (!triggerProducts.length && !bundledProducts.length && status) {
      const updated = await prisma.frequentlyBoughtOffer.update({
        where: { id },
        data: { status },
      });
      return Response.json({ success: true, offer: updated });
    }

    // ── Full update — replace child rows ──
    const results = await prisma.$transaction([
      prisma.fbtTriggerProduct.deleteMany({ where: { offerId: id } }),
      prisma.fbtBundledProduct.deleteMany({ where: { offerId: id } }),
      prisma.frequentlyBoughtOffer.update({
        where: { id },
        data: {
          ...offerData,
          triggerProducts: {
            create: triggerProducts.map((p) => ({
              productId: extractId(p.productId ?? p.id),
              title: p.title,
            })),
          },
          bundledProducts: {
            create: bundledProducts.map((p, i) => ({
              productId: extractId(p.productId ?? p.id),
              title: p.title,
              position: p.position ?? i,
            })),
          },
        },
        include: { triggerProducts: true, bundledProducts: true },
      }),
    ]);
    offer = results[2];
  } else {
    offer = await prisma.frequentlyBoughtOffer.create({
      data: {
        ...offerData,
        shopId: shop.id,
        triggerProducts: {
          create: triggerProducts.map((p) => ({
            productId: extractId(p.productId ?? p.id),
            title: p.title,
          })),
        },
        bundledProducts: {
          create: bundledProducts.map((p, i) => ({
            productId: extractId(p.productId ?? p.id),
            title: p.title,
            position: p.position ?? i,
          })),
        },
      },
      include: { triggerProducts: true, bundledProducts: true },
    });
  }

  // GraphQL Sync
  let discountId = offer.shopifyDiscountId;
  const graphqlConfig = {
    title: offer.title,
    functionHandle: FUNCTION_HANDLE,
    discountClasses: ["PRODUCT"],
    startsAt: offer.startDate ? new Date(offer.startDate).toISOString() : new Date().toISOString(),
    endsAt: offer.endDate ? new Date(offer.endDate).toISOString() : null,
    combinesWith: { productDiscounts: true },
  };

  if (!discountId) {
    const res = await admin.graphql(CREATE_DISCOUNT, {
      variables: { automaticAppDiscount: graphqlConfig },
    });
    const { data } = await res.json();
    const createdId = data?.discountAutomaticAppCreate?.automaticAppDiscount?.discountId;
    
    if (createdId) {
      discountId = createdId;
      offer = await prisma.frequentlyBoughtOffer.update({
        where: { id: offer.id },
        data: { shopifyDiscountId: createdId },
        include: { triggerProducts: true, bundledProducts: true },
      });
    }
  } else {
    await admin.graphql(UPDATE_DISCOUNT, {
      variables: { id: discountId, automaticAppDiscount: graphqlConfig },
    });
  }

  // Sync Metafields
  if (discountId) {
    await admin.graphql(
      `#graphql
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { key namespace value }
          userErrors { field message }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              ownerId: discountId,
              namespace: "fbt",
              key: "config",
              type: "json",
              value: JSON.stringify({
                offerId: offer.id,
                discountType: offer.discountType,
                discountValue: offer.discountValue,
                triggerProductIds: offer.triggerProducts.map((p) => p.productId),
                bundledProductIds: offer.bundledProducts.map((p) => p.productId),
                status: offer.status,
              }),
            },
          ],
        },
      }
    );
  }

  return Response.json({ success: true, offer });
}

function extractId(gid = "") {
  return gid.includes("/") ? gid.split("/").pop() : gid;
}

async function deleteShopifyDiscount(admin, discountId) {
  await admin.graphql(
    `#graphql
    mutation discountAutomaticDelete($id: ID!) {
      discountAutomaticDelete(id: $id) {
        deletedDiscountId
        userErrors { field message }
      }
    }`,
    { variables: { id: discountId } },
  );
}
