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

  try {
    await authenticate.public.appProxy(request);
  } catch (err) {
    return Response.json(
      { tiers: [], discounts: [] },
      { headers: corsHeaders() },
    );
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

  if (matchedOffer?.applyTo === "excludeProducts") {
    const isExcluded = await prisma.quantityBreakProduct.findFirst({
      where: { offerId: matchedOffer.id, productId, isExcluded: true },
    });
    if (isExcluded) finalOffer = null;
  }

  return Response.json(
    {
      tiers: finalOffer?.tiers ?? [],
      offerId: finalOffer?.id ?? null,
      discounts: [],
    },
    { headers: corsHeaders() },
  );
}

export async function action({ request }) {
  let offer = null;

  try {
    const { admin } = await authenticate.admin(request);
    const body = await request.json();

    // ── UPDATE path ──────────────────────────────────────────────
    if (body.id) {
      const {
        id,
        title,
        applyTo,
        discountTitle,
        discountDescription,
        status,
        tiers,
        products,
        excludedProducts,
        startDate,
        endDate,
        vendors = [],
        productTypes = [],
        collections = [],
      } = body;

      const normalizedProducts = (products || []).map((p) => ({
        productId: String(p.productId),
        title: p.title,
        isExcluded: false,
      }));

      const normalizedExcluded = (excludedProducts || []).map((p) => ({
        productId: String(p.productId),
        title: p.title,
        isExcluded: true,
      }));

      const allProducts = [...normalizedProducts, ...normalizedExcluded];

      // Delete all related records first, then recreate
      await prisma.quantityBreakTier.deleteMany({ where: { offerId: id } });
      await prisma.quantityBreakProduct.deleteMany({ where: { offerId: id } });
      await prisma.quantityBreakVendor.deleteMany({ where: { offerId: id } });
      await prisma.quantityBreakType.deleteMany({ where: { offerId: id } });
      await prisma.quantityBreakCollection.deleteMany({
        where: { offerId: id },
      });

      const updatedOffer = await prisma.quantityBreakOffer.update({
        where: { id },
        data: {
          title,
          applyTo,
          discountTitle,
          discountDescription,
          status,
          startDate: startDate ? new Date(startDate) : null,
          endDate: endDate ? new Date(endDate) : null,
          tiers: {
            create: tiers.map((tier) => ({
              tierTitle: tier.tierTitle || null,
              quantity: Number(tier.quantity),
              discountType: tier.discountType,
              value: Number(tier.value),
              subTitleText: tier.subTitleEnabled ? tier.subTitleText : null,
              labelText: tier.labelEnabled ? tier.labelText : null,
              tagText: tier.tagEnabled ? tier.tagText : null,
              preSelect: tier.preSelect ?? false,
            })),
          },
          products: { create: allProducts },
          vendors: { create: vendors.map((v) => ({ vendor: v })) },
          types: { create: productTypes.map((t) => ({ type: t })) },
          collections: {
            create: collections.map((c) => ({
              collectionId: String(c.collectionId),
            })),
          },
        },
        include: {
          tiers: true,
          products: true,
          vendors: true,
          types: true,
          collections: true,
        },
      });

      // Update Shopify discount if one exists
      if (updatedOffer?.shopifyDiscountId) {
        const config = {
          applyTo,
          productIds: normalizedProducts.map(
            (p) => `gid://shopify/Product/${p.productId}`,
          ),
          excludedProductIds: normalizedExcluded.map(
            (p) => `gid://shopify/Product/${p.productId}`,
          ),
          vendors,
          productTypes,
          collectionIds: collections.map(
            (c) => `gid://shopify/Collection/${c.collectionId}`,
          ),
          tiers: tiers.map((tier) => ({
            quantity: Number(tier.quantity),
            value: Number(tier.value),
            discountType: tier.discountType,
          })),
          status: status || "active",
        };

        const UPDATE_DISCOUNT = `
          mutation discountAutomaticAppUpdate($id: ID!, $automaticAppDiscount: DiscountAutomaticAppInput!) {
            discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $automaticAppDiscount) {
              automaticAppDiscount { discountId title status }
              userErrors { field message }
            }
          }
        `;

        const updateRes = await admin.graphql(UPDATE_DISCOUNT, {
          variables: {
            id: updatedOffer.shopifyDiscountId,
            automaticAppDiscount: {
              title,
              startsAt: startDate
                ? new Date(startDate).toISOString()
                : new Date().toISOString(),
              endsAt: endDate ? new Date(endDate).toISOString() : null,
              metafields: [
                {
                  namespace: "quantity_break",
                  key: "tiers",
                  type: "json",
                  value: JSON.stringify(config),
                },
              ],
            },
          },
        });

        const updateResult = await updateRes.json();
        const userErrors =
          updateResult?.data?.discountAutomaticAppUpdate?.userErrors || [];
        if (userErrors.length) {
          throw new Error(userErrors[0].message);
        }
      }

      return Response.json({ success: true, offer: updatedOffer });
    }

    // ── CREATE path ──────────────────────────────────────────────
    const {
      title,
      applyTo,
      discountTitle,
      discountDescription,
      status,
      tiers,
      products,
      excludedProducts,
      startDate,
      endDate,
      vendors = [],
      productTypes = [],
      collections = [],
    } = body;

    const normalizedProducts = (products || []).map((p) => ({
      productId: String(p.productId),
      title: p.title,
      isExcluded: false,
    }));

    const normalizedExcluded = (excludedProducts || []).map((p) => ({
      productId: String(p.productId),
      title: p.title,
      isExcluded: true,
    }));

    const allProducts = [...normalizedProducts, ...normalizedExcluded];

    offer = await prisma.quantityBreakOffer.create({
      data: {
        title,
        applyTo,
        discountTitle,
        discountDescription,
        status,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        tiers: {
          create: tiers.map((tier) => ({
            tierTitle: tier.tierTitle || null,
            quantity: Number(tier.quantity),
            discountType: tier.discountType,
            value: Number(tier.value),
            subTitleText: tier.subTitleEnabled ? tier.subTitleText : null,
            labelText: tier.labelEnabled ? tier.labelText : null,
            tagText: tier.tagEnabled ? tier.tagText : null,
            preSelect: tier.preSelect ?? false,
          })),
        },
        products: { create: allProducts },
        vendors: { create: vendors.map((v) => ({ vendor: v })) },
        types: { create: productTypes.map((t) => ({ type: t })) },
        collections: {
          create: collections.map((c) => ({
            collectionId: String(c.collectionId),
          })),
        },
      },
      include: {
        tiers: true,
        products: true,
        vendors: true,
        types: true,
        collections: true,
      },
    });

    const config = {
      applyTo,
      productIds: normalizedProducts.map(
        (p) => `gid://shopify/Product/${p.productId}`,
      ),
      excludedProductIds: normalizedExcluded.map(
        (p) => `gid://shopify/Product/${p.productId}`,
      ),
      vendors,
      productTypes,
      collectionIds: collections.map(
        (c) => `gid://shopify/Collection/${c.collectionId}`,
      ),
      tiers: tiers.map((tier) => ({
        quantity: Number(tier.quantity),
        value: Number(tier.value),
        discountType: tier.discountType,
      })),
      status: status || "active",
    };

    const CREATE_AUTOMATIC_DISCOUNT = `
      mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
        discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
          automaticAppDiscount {
            discountId
            title
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(CREATE_AUTOMATIC_DISCOUNT, {
      variables: {
        automaticAppDiscount: {
          title,
          functionHandle: "quantity-break-discount",
          discountClasses: ["PRODUCT"],
          startsAt: startDate
            ? new Date(startDate).toISOString()
            : new Date().toISOString(),
          endsAt: endDate ? new Date(endDate).toISOString() : null,
          metafields: [
            {
              namespace: "quantity_break",
              key: "tiers",
              type: "json",
              value: JSON.stringify(config),
            },
          ],
        },
      },
    });

    const result = await response.json();
    const userErrors =
      result?.data?.discountAutomaticAppCreate?.userErrors || [];

    if (userErrors.length) {
      throw new Error(userErrors[0].message);
    }

    const discountId =
      result?.data?.discountAutomaticAppCreate?.automaticAppDiscount
        ?.discountId;

    await prisma.quantityBreakOffer.update({
      where: { id: offer.id },
      data: { shopifyDiscountId: discountId },
    });

    return Response.json({ success: true, offer, shopify: result });
  } catch (error) {

    if (offer?.id) {
      await prisma.quantityBreakOffer.delete({ where: { id: offer.id } });
    }

    return Response.json({ success: false, error: error.message });
  }
}
