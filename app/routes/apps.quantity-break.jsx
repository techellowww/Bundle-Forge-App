import prisma from "../db.server";
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

// ── Reusable session resolver ─────────────────────────────────────────────────
async function getSession(shopDomain) {
  return (
    (await prisma.session.findFirst({
      where: { shop: shopDomain, expires: null },
    })) ??
    (await prisma.session.findFirst({
      where: { shop: shopDomain },
      orderBy: { id: "desc" },
    }))
  );
}

// ── Reusable admin GraphQL fetch ──────────────────────────────────────────────
async function adminGraphQL(shopDomain, accessToken, query, variables = {}) {
  const res = await fetch(
    `https://${shopDomain}/admin/api/2025-01/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  return res.json();
}

export async function loader({ request }) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  let shopDomain;
  try {
    const { session } = await authenticate.public.appProxy(request);
    shopDomain = session?.shop;
  } catch (err) {
    return Response.json(
      { tiers: [], discounts: [] },
      { headers: corsHeaders() },
    );
  }

  if (!shopDomain) {
    shopDomain = new URL(request.url).searchParams.get("shop");
  }

  const url = new URL(request.url);
  const rawId = url.searchParams.get("productId");
  const productId = normalizeProductId(rawId);
  const type = url.searchParams.get("type");

  if (!productId) {
    return Response.json(
      { tiers: [], discounts: [] },
      { headers: corsHeaders() },
    );
  }

  // ── FBT offers ───────────────────────────────────────────────────────────────
  if (type === "fbt" && productId) {
    const now = new Date();

    const shop = await prisma.shop.findUnique({
      where: { domain: shopDomain },
    });
    if (!shop) {
      return Response.json({ offer: null }, { headers: corsHeaders() });
    }

    // Fetch all active FBT offers for this shop within date range
    const allFbtOffers = await prisma.frequentlyBoughtOffer.findMany({
      where: {
        shopId: shop.id,
        status: "active",
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      include: {
        triggerProducts: true,
        bundledProducts: { orderBy: { position: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!allFbtOffers.length) {
      return Response.json({ offer: null }, { headers: corsHeaders() });
    }

    // Priority 1 — offer whose triggerProducts include this product
    // Priority 2 — offer with no triggerProducts (alwaysDisplay)
    const matched =
      allFbtOffers.find((o) =>
        o.triggerProducts.some(
          (p) => normalizeProductId(p.productId) === productId,
        ),
      ) || allFbtOffers.find((o) => o.triggerProducts.length === 0);

    if (!matched) {
      return Response.json({ offer: null }, { headers: corsHeaders() });
    }

    // Resolve bundled product handles + variant IDs via Admin API
    let bundledProducts = matched.bundledProducts.map((p) => ({
      productId: p.productId,
      title: p.title,
      position: p.position,
      handle: null,
      variantId: null,
      image: null,
      price: null,
    }));

    const sessionToUse = await getSession(shopDomain);

    if (sessionToUse?.accessToken && bundledProducts.length) {
      try {
        const gids = matched.bundledProducts.map(
          (p) => `gid://shopify/Product/${p.productId}`,
        );

        const data = await adminGraphQL(
          shopDomain,
          sessionToUse.accessToken,
          `query getBundledProducts($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product {
                id
                handle
                title
                featuredImage { url }
                variants(first: 1) {
                  edges {
                    node {
                      id
                      price
                    }
                  }
                }
              }
            }
          }`,
          { ids: gids },
        );

        const nodes = data?.data?.nodes ?? [];
        const productMap = {};

        nodes.forEach((node) => {
          if (!node) return;
          const numericId = node.id.replace("gid://shopify/Product/", "");
          productMap[numericId] = {
            handle: node.handle,
            title: node.title,
            image: node.featuredImage?.url ?? null,
            price: node.variants?.edges?.[0]?.node?.price ?? null,
            variantId:
              node.variants?.edges?.[0]?.node?.id?.replace(
                "gid://shopify/ProductVariant/",
                "",
              ) ?? null,
          };
        });

        bundledProducts = bundledProducts.map((p) => ({
          ...p,
          ...(productMap[p.productId] ?? {}),
        }));
      } catch (err) {
        console.error("[FBT] Bundled product enrichment failed:", err);
      }
    }

    return Response.json(
      {
        offer: {
          id: matched.id,
          discountTitle: matched.discountTitle,
          discountDescription: null, // add field to schema if needed
          discountType: matched.discountType,
          discountValue: matched.discountValue,
        },
        bundledProducts,
      },
      { headers: corsHeaders() },
    );
  }

  // ── Quantity break offer ──────────────────────────────────────────────────────
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const matchedOffer = await prisma.quantityBreakOffer.findFirst({
    where: {
      status: "active",

      OR: [
        { applyTo: "allProducts" },
        { applyTo: "excludeProducts" },
        {
          applyTo: "selectedProducts",
          products: { some: { productId, isExcluded: false } },
        },
        { applyTo: "exceptSelectedVendorTypeCollection" },
        { applyTo: "productsInSelectedVendorTypeCollection" },
      ],
    },
    include: {
      tiers: { orderBy: { quantity: "asc" } },
      vendors: true,
      types: true,
      collections: true,
    },
    orderBy: { createdAt: "desc" },
  });

  let finalOffer = matchedOffer;

  if (finalOffer?.endDate) {
    const endDate = new Date(finalOffer.endDate);
    endDate.setHours(0, 0, 0, 0);

    if (endDate < today) {
      finalOffer = null;
    }
  }

  if (matchedOffer?.applyTo === "excludeProducts") {
    const isExcluded = await prisma.quantityBreakProduct.findFirst({
      where: { offerId: matchedOffer.id, productId, isExcluded: true },
    });
    if (isExcluded) finalOffer = null;
  }

  if (
    matchedOffer?.applyTo === "exceptSelectedVendorTypeCollection" ||
    matchedOffer?.applyTo === "productsInSelectedVendorTypeCollection"
  ) {
    let productVendor = null;
    let productType = null;
    let productCollectionIds = [];

    try {
      const sessionToUse = await getSession(shopDomain);

      if (sessionToUse?.accessToken) {
        const data = await adminGraphQL(
          shopDomain,
          sessionToUse.accessToken,
          `query getProduct($id: ID!) {
            product(id: $id) {
              vendor
              productType
              collections(first: 50) {
                edges { node { id } }
              }
            }
          }`,
          { id: `gid://shopify/Product/${productId}` },
        );

        const product = data?.data?.product;
        if (product) {
          productVendor = product.vendor?.trim().toLowerCase() ?? null;
          productType = product.productType?.trim().toLowerCase() ?? null;
          productCollectionIds = product.collections.edges.map((e) =>
            e.node.id.replace("gid://shopify/Collection/", ""),
          );
        }
      }
    } catch (err) {}

    const offerVendors = matchedOffer.vendors.map((v) =>
      v.vendor.trim().toLowerCase(),
    );
    const offerTypes = matchedOffer.types.map((t) =>
      t.type.trim().toLowerCase(),
    );
    const offerCollectionIds = matchedOffer.collections.map((c) =>
      String(c.collectionId),
    );

    const vendorMatch =
      offerVendors.length > 0 && productVendor
        ? offerVendors.includes(productVendor)
        : false;

    const typeMatch =
      offerTypes.length > 0 && productType
        ? offerTypes.includes(productType)
        : false;

    const collectionMatch =
      offerCollectionIds.length > 0
        ? productCollectionIds.some((id) => offerCollectionIds.includes(id))
        : false;

    const isMatch = vendorMatch || typeMatch || collectionMatch;

    if (matchedOffer.applyTo === "exceptSelectedVendorTypeCollection") {
      if (isMatch) finalOffer = null;
    } else if (
      matchedOffer.applyTo === "productsInSelectedVendorTypeCollection"
    ) {
      if (!isMatch) finalOffer = null;
    }
  }

  // ── Native Shopify discounts ──────────────────────────────────────────────────
  let nativeDiscounts = [];

  if (shopDomain) {
    try {
      const sessionToUse = await getSession(shopDomain);

      if (sessionToUse?.accessToken) {
        const gqlData = await adminGraphQL(
          shopDomain,
          sessionToUse.accessToken,
          `query {
            automaticDiscountNodes(first: 50) {
              edges {
                node {
                  id
                  automaticDiscount {
                    ... on DiscountAutomaticBasic {
                      title status startsAt endsAt summary
                      customerGets {
                        value {
                          ... on DiscountPercentage { percentage }
                          ... on DiscountAmount {
                            amount { amount currencyCode }
                          }
                        }
                        items {
                          ... on AllDiscountItems { allItems }
                          ... on DiscountProducts {
                            products(first: 50) {
                              edges { node { id } }
                            }
                          }
                          ... on DiscountCollections {
                            collections(first: 20) {
                              edges { node { id } }
                            }
                          }
                        }
                      }
                    }
                    ... on DiscountAutomaticBxgy { title status startsAt endsAt summary }
                    ... on DiscountAutomaticFreeShipping { title status startsAt endsAt summary }
                    ... on DiscountAutomaticApp { title status startsAt endsAt }
                  }
                }
              }
            }
          }`,
        );

        const edges = gqlData?.data?.automaticDiscountNodes?.edges || [];
        const productGid = `gid://shopify/Product/${productId}`;

        nativeDiscounts = edges
          .map((e) => e.node.automaticDiscount)
          .filter((d) => d?.status === "active")
          .filter((d) => {
            if (!d.customerGets) return true;
            const items = d.customerGets?.items;
            if (!items) return true;
            if (items.allItems === true) return true;
            if (items.products?.edges?.length > 0) {
              return items.products.edges.some((e) => e.node.id === productGid);
            }
            if (items.collections?.edges?.length > 0) return true;
            return false;
          })
          .map((d) => ({
            title: d.title,
            summary: d.summary || null,
            startsAt: d.startsAt,
            endsAt: d.endsAt,
            discountValue:
              d?.customerGets?.value?.percentage != null
                ? {
                    type: "percentage",
                    value: +(d.customerGets.value.percentage * 100).toFixed(0),
                  }
                : d?.customerGets?.value?.amount
                  ? {
                      type: "amount",
                      value: d.customerGets.value.amount.amount,
                      currency: d.customerGets.value.amount.currencyCode,
                    }
                  : null,
          }));
      }
    } catch (err) {
      console.error("[QB] Native discount fetch failed:", err);
    }
  }

  // ── BXGY offers ───────────────────────────────────────────────────────────────
  if (type === "bxgy" && productId) {
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    console.log("DATABASE URL =", process.env.DATABASE_URL);
    console.log("NODE_ENV =", process.env.NODE_ENV);
    const allBxgyOffers = await prisma.bxgyOffer.findMany({
      where: {
        status: "active",
        AND: [
          {
            OR: [{ startDate: null }, { startDate: { lte: today } }],
          },
          {
            OR: [{ endDate: null }, { endDate: { gte: today } }],
          },
        ],
      },
      include: {
        products: true,
        vendors: true,
        productTypes: true,
        collections: true,
        productGift: { include: { giftProducts: true } },
        shippingGift: true,
      },
      orderBy: { createdAt: "desc" },
    });
    console.log(
      "ALL BXGY OFFERS",
      allBxgyOffers.map((o) => ({
        id: o.id,
        title: o.title,
        products: o.products.map((p) => p.productId),
      })),
    );

    const sessionToUse = await getSession(shopDomain);

    let productVendor = null;
    let productType = null;
    let productCollectionIds = [];

    const needsAdminLookup = allBxgyOffers.some(
      (o) => o.applyTo === "productsInSelectedVendorTypeCollection",
    );

    if (needsAdminLookup && sessionToUse?.accessToken) {
      try {
        const data = await adminGraphQL(
          shopDomain,
          sessionToUse.accessToken,
          `query getProduct($id: ID!) {
            product(id: $id) {
              vendor
              productType
              collections(first: 50) {
                edges { node { id } }
              }
            }
          }`,
          { id: `gid://shopify/Product/${productId}` },
        );

        const product = data?.data?.product;
        if (product) {
          productVendor = product.vendor?.trim().toLowerCase() ?? null;
          productType = product.productType?.trim().toLowerCase() ?? null;
          productCollectionIds = product.collections.edges.map((e) =>
            e.node.id.replace("gid://shopify/Collection/", ""),
          );
        }
      } catch (err) {
        console.error("[BXGY] Admin product lookup failed:", err);
      }
    }

    const matchedBxgy = allBxgyOffers.filter((offer) => {
      switch (offer.applyTo) {
        case "selectedProducts":
          return offer.products.some(
            (p) => p.productId === productId && !p.isExcluded,
          );

        case "productsInSelectedVendorTypeCollection": {
          const offerVendors = offer.vendors.map((v) =>
            v.vendor.trim().toLowerCase(),
          );
          const offerTypes = offer.productTypes.map((t) =>
            t.productType.trim().toLowerCase(),
          );
          const offerCollectionIds = offer.collections.map((c) =>
            String(c.collectionId),
          );

          const vendorMatch =
            offerVendors.length > 0 && productVendor
              ? offerVendors.includes(productVendor)
              : false;

          const typeMatch =
            offerTypes.length > 0 && productType
              ? offerTypes.includes(productType)
              : false;

          const collectionMatch =
            offerCollectionIds.length > 0
              ? productCollectionIds.some((id) =>
                  offerCollectionIds.includes(id),
                )
              : false;

          return vendorMatch || typeMatch || collectionMatch;
        }

        default:
          return false;
      }
    });

    // ── ENRICH GIFT PRODUCTS WITH VARIANT IDS ──────────────────────────────────
    if (matchedBxgy.length && sessionToUse?.accessToken) {
      const allGiftProductIds = [];
      matchedBxgy.forEach((offer) => {
        if (offer.productGift?.giftProducts) {
          offer.productGift.giftProducts.forEach((gp) => {
            const normalized = normalizeProductId(gp.productId);
            allGiftProductIds.push(normalized);
          });
        }
      });

      if (allGiftProductIds.length) {
        try {
          console.log(
            "[BXGY] Fetching variant data for gift products:",
            allGiftProductIds,
          );

          const gqlData = await adminGraphQL(
            shopDomain,
            sessionToUse.accessToken,
            `query getProducts($ids: [ID!]!) {
              nodes(ids: $ids) {
                ... on Product {
                  id
                  handle
                  variants(first: 1) {
                    edges { node { id } }
                  }
                }
              }
            }`,
            {
              ids: allGiftProductIds.map((id) => `gid://shopify/Product/${id}`),
            },
          );

          const nodes = gqlData?.data?.nodes || [];
          const productMap = {};

          nodes.forEach((node) => {
            if (!node) return;
            const numericId = node.id.replace("gid://shopify/Product/", "");
            const variantId = node.variants?.edges?.[0]?.node?.id?.replace(
              "gid://shopify/ProductVariant/",
              "",
            );

            console.log("[BXGY] Enriched gift product:", {
              productId: numericId,
              handle: node.handle,
              variantId: variantId || "MISSING",
            });

            productMap[numericId] = {
              handle: node.handle,
              variantId: variantId || null,
            };
          });

          console.log("[BXGY] Product map keys:", Object.keys(productMap));

          matchedBxgy.forEach((offer) => {
            if (offer.productGift?.giftProducts) {
              offer.productGift.giftProducts =
                offer.productGift.giftProducts.map((gp) => {
                  const normalizedId = normalizeProductId(gp.productId);
                  const info = productMap[normalizedId] || {};

                  console.log("[BXGY] Mapping gift product:", {
                    title: gp.title,
                    originalId: gp.productId,
                    normalizedId: normalizedId,
                    found: !!info.variantId,
                    variantId: info.variantId || "NOT FOUND",
                  });

                  return {
                    ...gp,
                    handle: info.handle || null,
                    variantId: info.variantId || null,
                  };
                });
            }
          });
        } catch (err) {
          console.error("[BXGY] Gift product enrichment failed:", err);
        }
      }
    }

    return Response.json({ offers: matchedBxgy }, { headers: corsHeaders() });
  }

  // ── Fixed bundle offers ───────────────────────────────────────────────────────
  if (type === "fixed-bundle" && productId) {
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

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

    const matchedBundles = allBundles.filter((bundle) =>
      bundle.products.some(
        (p) => normalizeProductId(p.productId) === productId,
      ),
    );

    const offers = matchedBundles.map((bundle) => ({
      id: bundle.id,
      title: bundle.title,
      description: bundle.description,
      offerPercentage: bundle.offerPercentage,
      products: bundle.products.map((p) => ({
        id: p.productId,
        title: p.title,
        imageUrl: p.imageUrl,
        vendor: p.vendor,
      })),
    }));

    return Response.json({ offers }, { headers: corsHeaders() });
  }

  return Response.json(
    {
      tiers: finalOffer?.tiers ?? [],
      offerId: finalOffer?.id ?? null,
      discounts: nativeDiscounts,
    },
    { headers: corsHeaders() },
  );
}
