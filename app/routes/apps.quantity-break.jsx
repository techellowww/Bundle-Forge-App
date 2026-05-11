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

  if (!productId) {
    return Response.json(
      { tiers: [], discounts: [] },
      { headers: corsHeaders() },
    );
  }

  const matchedOffer = await prisma.quantityBreakOffer.findFirst({
    where: {
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
      const sessionToUse =
        (await prisma.session.findFirst({
          where: { shop: shopDomain, expires: null },
        })) ??
        (await prisma.session.findFirst({
          where: { shop: shopDomain },
          orderBy: { id: "desc" },
        }));

      if (sessionToUse?.accessToken) {
        const res = await fetch(
          `https://${shopDomain}/admin/api/2025-01/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": sessionToUse.accessToken,
            },
            body: JSON.stringify({
              query: `query getProduct($id: ID!) {
                product(id: $id) {
                  vendor
                  productType
                  collections(first: 50) {
                    edges { node { id } }
                  }
                }
              }`,
              variables: {
                id: `gid://shopify/Product/${productId}`,
              },
            }),
          },
        );

        const data = await res.json();
        const product = data?.data?.product;

        if (product) {
          productVendor = product.vendor?.trim().toLowerCase() ?? null;
          productType = product.productType?.trim().toLowerCase() ?? null;
          productCollectionIds = product.collections.edges.map((e) =>
            e.node.id.replace("gid://shopify/Collection/", ""),
          );
        }
      }
    } catch (err) {
    }

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

  let nativeDiscounts = [];

  if (shopDomain) {
    try {
      const sessionToUse =
        (await prisma.session.findFirst({
          where: { shop: shopDomain, expires: null },
        })) ??
        (await prisma.session.findFirst({
          where: { shop: shopDomain },
          orderBy: { id: "desc" },
        }));

      if (sessionToUse?.accessToken) {
        const gqlRes = await fetch(
          `https://${shopDomain}/admin/api/2025-01/graphql.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": sessionToUse.accessToken,
            },
            body: JSON.stringify({
              query: `query {
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
            }),
          },
        );

        const gqlData = await gqlRes.json();
        const edges = gqlData?.data?.automaticDiscountNodes?.edges || [];
        const productGid = `gid://shopify/Product/${productId}`;

        nativeDiscounts = edges
          .map((e) => e.node.automaticDiscount)
          .filter((d) => d?.status === "ACTIVE")
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

  return Response.json(
    {
      tiers: finalOffer?.tiers ?? [],
      offerId: finalOffer?.id ?? null,
      discounts: nativeDiscounts,
    },
    { headers: corsHeaders() },
  );
}
