import { authenticate } from "../shopify.server";
import db from "../db.server";

const badRequest = (error) =>
  Response.json({ success: false, error }, { status: 400 });
const serverError = (error) =>
  Response.json({ success: false, error }, { status: 500 });

// Helper to generate unique Shopify discount titles
function generateUniqueTitle(title, offerId = null, discountTitle = null) {
  const base = discountTitle?.trim() || title.trim();
  const suffix = offerId ? ` (${offerId.slice(-6)})` : " (new)";
  return `${base}${suffix}`;
}

async function replaceRelations(
  tx,
  offerId,
  { products, vendors, productTypes, collections },
) {
  await tx.bxgyProduct.deleteMany({ where: { offerId } });
  if (products?.length)
    await tx.bxgyProduct.createMany({
      data: products.map((p) => ({ ...p, offerId })),
    });

  await tx.bxgyVendor.deleteMany({ where: { offerId } });
  if (vendors?.length)
    await tx.bxgyVendor.createMany({
      data: vendors.map((v) => ({ ...v, offerId })),
    });

  await tx.bxgyProductType.deleteMany({ where: { offerId } });
  if (productTypes?.length)
    await tx.bxgyProductType.createMany({
      data: productTypes.map((pt) => ({ ...pt, offerId })),
    });

  await tx.bxgyCollection.deleteMany({ where: { offerId } });
  if (collections?.length)
    await tx.bxgyCollection.createMany({
      data: collections.map((c) => ({ ...c, offerId })),
    });
}

async function upsertGiftConfig(
  tx,
  offerId,
  { giftMode, productGift, shippingGift },
) {
  if (giftMode === "PRODUCT_GIFT" && productGift) {
    await tx.bxgyShippingGift.deleteMany({ where: { offerId } });

    const { giftProducts, discountType, discountValue, giftQuantity, ...rest } =
      productGift;
    const giftScalars = {
      discountType: discountType || "free", // Requires schema update
      discountValue: discountValue ?? null,
      giftQuantity: Number(giftQuantity) || 1,
      ...rest,
    };

    // Upsert FIRST, then manage relations
    const gift = await tx.bxgyProductGift.upsert({
      where: { offerId },
      create: { offerId, ...giftScalars },
      update: { ...giftScalars },
    });

    // Now safe to delete/create relations
    await tx.bxgyGiftProduct.deleteMany({ where: { giftId: gift.id } });
    if (giftProducts?.length) {
      await tx.bxgyGiftProduct.createMany({
        data: giftProducts.map((p) => ({ ...p, giftId: gift.id })),
      });
    }
  } else if (giftMode === "SHIPPING_DISCOUNT" && shippingGift) {
    await tx.bxgyProductGift.deleteMany({ where: { offerId } });
    await tx.bxgyShippingGift.upsert({
      where: { offerId },
      create: { offerId, ...shippingGift },
      update: { ...shippingGift },
    });
  }
}

function buildShopifyConfig(body) {
  const {
    applyTo,
    requiredQuantity,
    trackBy,
    giftMode,
    products = [],
    vendors = [],
    productTypes = [],
    collections = [],
    productGift,
    shippingGift,
    status = "active",
  } = body;

  const includedProducts = products.filter((p) => !p.isExcluded);
  const excludedProducts = products.filter((p) => p.isExcluded);

  let resolvedProductGift = null;
  if (productGift) {
    const { discountType, discountValue, giftQuantity, giftProducts } =
      productGift;

    // Normalize: free → 100% so your Shopify Function only needs to handle
    // "percentage" and "fixedPrice" as distinct cases.
    let normalizedType = discountType;
    let normalizedValue = discountValue ?? null;

    if (discountType === "free") {
      normalizedType = "percentage";
      normalizedValue = 100;
    }

    resolvedProductGift = {
      discountType: normalizedType, // "percentage" | "fixedPrice"
      discountValue: normalizedValue, // number (100 for free, N for %, price for fixed)
      giftQuantity: Number(giftQuantity) || 1,
      giftProducts: (giftProducts || []).map((p) => ({
        productId: `gid://shopify/Product/${p.productId}`,
        title: p.title,
      })),
    };
  }

  return {
    applyTo,
    requiredQuantity: Number(requiredQuantity) || 1,
    trackBy,
    giftMode,
    productIds: includedProducts.map(
      (p) => `gid://shopify/Product/${p.productId}`,
    ),
    excludedProductIds: excludedProducts.map(
      (p) => `gid://shopify/Product/${p.productId}`,
    ),
    vendors: vendors.map((v) => v.vendor),
    productTypes: productTypes.map((pt) => pt.productType),
    collectionIds: collections.map(
      (c) => `gid://shopify/Collection/${c.collectionId}`,
    ),
    productGift: resolvedProductGift,
    shippingGift: shippingGift
      ? {
          discountType: shippingGift.discountType,
          discountValue: shippingGift.discountValue ?? null,
          enableFreeShipping: shippingGift.enableFreeShipping ?? false,
          freeShippingLabel: shippingGift.freeShippingLabel ?? null,
        }
      : null,
    status,
  };
}

const fullInclude = {
  products: true,
  vendors: true,
  productTypes: true,
  collections: true,
  productGift: { include: { giftProducts: true } },
  shippingGift: true,
};

// ── GET ───────────────────────────────────────────────────────────────────────
export async function loader({ request }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  const { session } = await authenticate.admin(request);
  const shop = await db.shop.findUnique({ where: { domain: session.shop } });

  if (id) {
    const offer = await db.bxgyOffer.findFirst({
      where: { id, shopId: shop.id },
      include: fullInclude,
    });
    if (!offer)
      return Response.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    return Response.json({ success: true, offer });
  }

  const offers = await db.bxgyOffer.findMany({
    where: { shopId: shop.id },
    orderBy: { createdAt: "desc" },
    include: fullInclude,
  });

  return Response.json({ success: true, offers });
}

// ── POST / PUT / DELETE ───────────────────────────────────────────────────────
export async function action({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const shop = await db.shop.findUnique({
    where: {
      domain: session.shop,
    },
  });

  if (!shop) {
    return badRequest("Shop not found");
  }

  const method = request.method.toUpperCase();

  // ── DELETE ──────────────────────────────────────────────────────────────────
  if (method === "DELETE") {
    const { id } = await request.json();
    if (!id) return badRequest("Missing offer id");

    const offer = await db.bxgyOffer.findFirst({ where: { id } });
    if (!offer || offer.shopId !== shop?.id) {
      return Response.json(
        { success: false, error: "Offer not found" },
        { status: 404 },
      );
    }

    if (offer.shopifyDiscountId) {
      try {
        await admin.graphql(
          `mutation discountAutomaticDelete($id: ID!) {
            discountAutomaticDelete(id: $id) {
              deletedAutomaticDiscountId
              userErrors { field message }
            }
          }`,
          { variables: { id: offer.shopifyDiscountId } },
        );
      } catch (e) {
        console.warn("Shopify discount delete failed:", e.message);
      }
    }

    await db.bxgyOffer.delete({ where: { id } });
    return Response.json({ success: true });
  }

  if (method !== "POST" && method !== "PUT") {
    return Response.json(
      { success: false, error: "Method not allowed" },
      { status: 405 },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const {
    id,
    title,
    discountTitle,
    startDate,
    endDate,
    applyTo,
    requiredQuantity,
    trackBy,
    sameAsGift,
    giftMode,
    products,
    vendors,
    productTypes,
    collections,
    productGift,
    shippingGift,
    status,
  } = body;

  if (!title?.trim()) return badRequest("title is required");
  if (!applyTo) return badRequest("applyTo is required");
  if (!giftMode) return badRequest("giftMode is required");
  if (giftMode === "PRODUCT_GIFT" && !productGift)
    return badRequest(
      "productGift config required when giftMode is PRODUCT_GIFT",
    );
  if (giftMode === "SHIPPING_DISCOUNT" && !shippingGift)
    return badRequest(
      "shippingGift config required when giftMode is SHIPPING_DISCOUNT",
    );

  const offerScalars = {
    title: title.trim(),
    discountTitle: discountTitle || null,
    startDate: startDate ? new Date(startDate) : null,
    endDate: endDate ? new Date(endDate) : null,
    applyTo,
    requiredQuantity: Number(requiredQuantity) || 1,
    trackBy: trackBy || "PRODUCT",
    sameAsGift: Boolean(sameAsGift),
    giftMode,
    status: status || "active",
  };

  const shopifyConfig = buildShopifyConfig(body);
  const discountClasses =
    giftMode === "SHIPPING_DISCOUNT" ? ["SHIPPING"] : ["PRODUCT"];

  let dbOffer = null;

  try {
    // ── CREATE ────────────────────────────────────────────────────────────────
    if (method === "POST") {
      dbOffer = await db.$transaction(async (tx) => {
        const created = await tx.bxgyOffer.create({
          data: {
            ...offerScalars,
            shopId: shop.id,
          },
        });
        await replaceRelations(tx, created.id, {
          products,
          vendors,
          productTypes,
          collections,
        });
        await upsertGiftConfig(tx, created.id, {
          giftMode,
          productGift,
          shippingGift,
        });
        return tx.bxgyOffer.findFirst({
          where: { id: created.id },
          include: fullInclude,
        });
      });

      // ✅ FIXED: Generate unique Shopify title
      const uniqueTitle = generateUniqueTitle(title, null, discountTitle);

      const createRes = await admin.graphql(
        `mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
          discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
            automaticAppDiscount { discountId title status }
            userErrors { field message }
          }
        }`,
        {
          variables: {
            automaticAppDiscount: {
              title: uniqueTitle, // ← UNIQUE TITLE
              functionHandle: "bxgy-discount",
              discountClasses,
              startsAt: startDate
                ? new Date(startDate).toISOString()
                : new Date().toISOString(),
              endsAt: endDate ? new Date(endDate).toISOString() : null,
              metafields: [
                {
                  namespace: "bxgy",
                  key: "config",
                  type: "json",
                  value: JSON.stringify(shopifyConfig),
                },
              ],
            },
          },
        },
      );

      const createResult = await createRes.json();
      const userErrors =
        createResult?.data?.discountAutomaticAppCreate?.userErrors || [];
      if (userErrors.length) throw new Error(userErrors[0].message);

      const shopifyDiscountId =
        createResult?.data?.discountAutomaticAppCreate?.automaticAppDiscount
          ?.discountId;

      await db.bxgyOffer.update({
        where: { id: dbOffer.id },
        data: { shopifyDiscountId },
      });

      return Response.json(
        { success: true, offer: { ...dbOffer, shopifyDiscountId } },
        { status: 201 },
      );
    }

    // ── UPDATE ────────────────────────────────────────────────────────────────
    if (!id) return badRequest("id is required for update");

    const existing = await db.bxgyOffer.findFirst({ where: { id } });
    if (!existing || existing.shopId !== shop.id) {
      return Response.json(
        { success: false, error: "Offer not found" },
        { status: 404 },
      );
    }

    dbOffer = await db.$transaction(async (tx) => {
      await tx.bxgyOffer.update({
        where: { id },
        data: {
          ...offerScalars,
          shopId: shop.id,
        },
      });
      await replaceRelations(tx, id, {
        products,
        vendors,
        productTypes,
        collections,
      });
      await upsertGiftConfig(tx, id, { giftMode, productGift, shippingGift });
      return tx.bxgyOffer.findFirst({
        where: { id },
        include: fullInclude,
      });
    });

    // ✅ FIXED: Generate unique Shopify title for updates
    if (existing.shopifyDiscountId) {
      const uniqueTitle = generateUniqueTitle(title, id, discountTitle);

      const updateRes = await admin.graphql(
        `mutation discountAutomaticAppUpdate($id: ID!, $automaticAppDiscount: DiscountAutomaticAppInput!) {
          discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $automaticAppDiscount) {
            automaticAppDiscount { discountId title status }
            userErrors { field message }
          }
        }`,
        {
          variables: {
            id: existing.shopifyDiscountId,
            automaticAppDiscount: {
              title: uniqueTitle, // ← UNIQUE TITLE
              startsAt: startDate
                ? new Date(startDate).toISOString()
                : new Date().toISOString(),
              endsAt: endDate ? new Date(endDate).toISOString() : null,
              metafields: [
                {
                  namespace: "bxgy",
                  key: "config",
                  type: "json",
                  value: JSON.stringify(shopifyConfig),
                },
              ],
            },
          },
        },
      );

      // After the existing discountAutomaticAppUpdate call...
      const updateResult = await updateRes.json();
      const userErrors =
        updateResult?.data?.discountAutomaticAppUpdate?.userErrors || [];
      if (userErrors.length) throw new Error(userErrors[0].message);

      // ── SYNC STATUS TO SHOPIFY ──────────────────────────────────────────────
      const newStatus = (status || "active").toLowerCase();
      const currentStatus = existing.status?.toLowerCase();

      if (newStatus !== currentStatus) {
        if (newStatus === "active") {
          const activateRes = await admin.graphql(
            `mutation discountAutomaticActivate($id: ID!) {
        discountAutomaticActivate(id: $id) {
          automaticDiscountNode { id }
          userErrors { field message }
        }
      }`,
            { variables: { id: existing.shopifyDiscountId } },
          );
          const activateResult = await activateRes.json();
          const activateErrors =
            activateResult?.data?.discountAutomaticActivate?.userErrors || [];
          if (activateErrors.length)
            console.warn("Activate error:", activateErrors[0].message);
        } else {
          const deactivateRes = await admin.graphql(
            `mutation discountAutomaticDeactivate($id: ID!) {
        discountAutomaticDeactivate(id: $id) {
          automaticDiscountNode { id }
          userErrors { field message }
        }
      }`,
            { variables: { id: existing.shopifyDiscountId } },
          );
          const deactivateResult = await deactivateRes.json();
          const deactivateErrors =
            deactivateResult?.data?.discountAutomaticDeactivate?.userErrors ||
            [];
          if (deactivateErrors.length)
            console.warn("Deactivate error:", deactivateErrors[0].message);
        }
      }
      if (userErrors.length) throw new Error(userErrors[0].message);
    }

    return Response.json({ success: true, offer: dbOffer });
  } catch (err) {
    console.error("[api.bxgy-offers] error:", err);
    if (method === "POST" && dbOffer?.id) {
      await db.bxgyOffer.delete({ where: { id: dbOffer.id } }).catch(() => {});
    }
    return serverError("Error: " + err.message);
  }
}
