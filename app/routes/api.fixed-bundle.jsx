import prisma, { resolveShop } from "../db.server";
import { authenticate } from "../shopify.server";

const FUNCTION_HANDLE = "fixed-bundle-discount";

const UPDATE_DISCOUNT = `#graphql
  mutation discountAutomaticAppUpdate($id: ID!, $automaticAppDiscount: DiscountAutomaticAppInput!) {
    discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $automaticAppDiscount) {
      automaticAppDiscount { discountId title status }
      userErrors { field message }
    }
  }
`;

const DELETE_DISCOUNT = `#graphql
  mutation discountAutomaticDelete($id: ID!) {
    discountAutomaticDelete(id: $id) {
      deletedAutomaticDiscountId
      userErrors { field message }
    }
  }
`;

const CREATE_DISCOUNT = `#graphql
  mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
    discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
      automaticAppDiscount { discountId title status }
      userErrors { field message }
    }
  }
`;

async function getShopId(shopDomain) {
  const shop = await resolveShop(shopDomain);
  return shop.id;
}

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shopId = await getShopId(session.shop);

  const bundles = await prisma.fixedBundleOffer.findMany({
    where: { shopId },
    include: { products: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ success: true, bundles });
}

export async function action({ request }) {
  try {
    const { session, admin } = await authenticate.admin(request);
    const method = request.method.toUpperCase();
    const shopId = await getShopId(session.shop);

  // ── DELETE ──────────────────────────────────────────────────────────────
  if (method === "DELETE") {
    const { id } = await request.json();

    const existing = await prisma.fixedBundleOffer.findUnique({
      where: { id },
    });
    if (!existing || existing.shopId !== shopId) {
      return Response.json(
        { success: false, error: "Bundle not found" },
        { status: 404 },
      );
    }

    if (existing.shopifyDiscountId) {
      const res = await admin.graphql(DELETE_DISCOUNT, {
        variables: { id: existing.shopifyDiscountId },
      });
      const { data } = await res.json();
      const errors = data?.discountAutomaticDelete?.userErrors;
      if (errors?.length) console.error("Shopify delete errors:", errors);
    }

    await prisma.fixedBundleOffer.delete({ where: { id } });
    return Response.json({ success: true });
  }

  const body = await request.json();
  const {
    id,
    title,
    description,
    startDate,
    endDate,
    status,
    giftProducts,
    offerPercentage,
    minQuantity,
  } = body;

  // ── Validation ──────────────────────────────────────────────────────────
  if (!title?.trim()) {
    return Response.json(
      { success: false, error: "Title is required" },
      { status: 400 },
    );
  }
  if (
    !giftProducts?.length ||
    giftProducts.length < 2 ||
    giftProducts.length > 4
  ) {
    return Response.json(
      { success: false, error: "Select between 2 and 4 products" },
      { status: 400 },
    );
  }
  const pct = parseFloat(offerPercentage);
  if (!offerPercentage || isNaN(pct) || pct <= 0 || pct > 100) {
    return Response.json(
      { success: false, error: "Offer percentage must be between 1 and 100" },
      { status: 400 },
    );
  }

  const discountPayload = {
    title,
    functionHandle: FUNCTION_HANDLE,
    discountClasses: ["PRODUCT"],
    startsAt: startDate
      ? new Date(startDate).toISOString()
      : new Date().toISOString(),
    endsAt: endDate ? new Date(endDate).toISOString() : null,
    combinesWith: { productDiscounts: true },
    metafields: [
      {
        namespace: "fixed-bundle",
        key: "config",
        type: "json",
        value: JSON.stringify({
          description,
          offerPercentage: pct,
          minQuantity: minQuantity,
          productIds: giftProducts.map((p) => p.id),
          status: status || "active",
        }),
      },
    ],
  };

  // ── UPDATE ──────────────────────────────────────────────────────────────
  if (id) {
    const existing = await prisma.fixedBundleOffer.findUnique({
      where: { id },
    });
    if (!existing || existing.shopId !== shopId) {
      return Response.json(
        { success: false, error: "Bundle not found" },
        { status: 404 },
      );
    }

    if (existing.shopifyDiscountId) {
      const res = await admin.graphql(UPDATE_DISCOUNT, {
        variables: {
          id: existing.shopifyDiscountId,
          automaticAppDiscount: {
            title,
            functionHandle: FUNCTION_HANDLE,
            discountClasses: ["PRODUCT"],
            startsAt: startDate
              ? new Date(startDate).toISOString()
              : new Date().toISOString(),
            endsAt: endDate ? new Date(endDate).toISOString() : null,
            combinesWith: { productDiscounts: true },
            // no metafields here
          },
        },
      });
      const { data } = await res.json();
      const errors = data?.discountAutomaticAppUpdate?.userErrors;
      if (errors?.length) {
        return Response.json(
          { success: false, error: errors[0].message },
          { status: 422 },
        );
      }

      // Set metafield separately after update
      await admin.graphql(
        `#graphql
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key namespace value }
        userErrors { field message }
      }
    }
  `,
        {
          variables: {
            metafields: [
              {
                ownerId: existing.shopifyDiscountId,
                namespace: "fixed-bundle",
                key: "config",
                type: "json",
                value: JSON.stringify({
                  offerPercentage: pct,
                  minQuantity: minQuantity,
                  productIds: giftProducts.map((p) => p.id),
                  status: status || "active",
                }),
              },
            ],
          },
        },
      );
    }

    const newStatus = (status || "active").toLowerCase();
    const currentStatus = existing.status?.toLowerCase();

    if (newStatus !== currentStatus && existing.shopifyDiscountId) {
      const statusMutation =
        newStatus === "active"
          ? `mutation discountAutomaticActivate($id: ID!) {
          discountAutomaticActivate(id: $id) {
            automaticDiscountNode { id }
            userErrors { field message }
          }
        }`
          : `mutation discountAutomaticDeactivate($id: ID!) {
          discountAutomaticDeactivate(id: $id) {
            automaticDiscountNode { id }
            userErrors { field message }
          }
        }`;

      const statusRes = await admin.graphql(statusMutation, {
        variables: { id: existing.shopifyDiscountId },
      });
      const statusData = await statusRes.json();
      const statusErrors =
        statusData?.data?.discountAutomaticActivate?.userErrors ||
        statusData?.data?.discountAutomaticDeactivate?.userErrors ||
        [];
      if (statusErrors.length)
        console.warn("Status sync error:", statusErrors[0].message);
    }

    await prisma.fixedBundleProduct.deleteMany({ where: { offerId: id } });

    const updated = await prisma.fixedBundleOffer.update({
      where: { id },
      data: {
        title,
        description,
        offerPercentage: pct,
        minQuantity: minQuantity,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status || "active",
        products: {
          create: giftProducts.map((p, i) => ({
            productId: p.id,
            title: p.title,
            vendor: p.vendor ?? null,
            productType: p.productType ?? null,
            imageUrl: p.featuredImage?.url ?? p.images?.[0]?.url ?? null,
            position: i,
          })),
        },
      },
      include: { products: { orderBy: { position: "asc" } } },
    });

    return Response.json({ success: true, bundle: updated });
  }

  // ── CREATE ──────────────────────────────────────────────────────────────
  let shopifyDiscountId = null;

  try {
    const res = await admin.graphql(CREATE_DISCOUNT, {
      variables: {
        automaticAppDiscount: {
          title,
          functionHandle: FUNCTION_HANDLE,
          discountClasses: ["PRODUCT"],
          startsAt: startDate
            ? new Date(startDate).toISOString()
            : new Date().toISOString(),
          endsAt: endDate ? new Date(endDate).toISOString() : null,
          combinesWith: { productDiscounts: true },
        },
      },
    });
    const { data } = await res.json();
    const errors = data?.discountAutomaticAppCreate?.userErrors;
    if (!errors?.length) {
      shopifyDiscountId =
        data.discountAutomaticAppCreate.automaticAppDiscount.discountId;
    } else {
      console.error("Shopify discount errors:", errors);
    }
  } catch (err) {
    console.error("Shopify discount creation failed:", err);
  }

  // ── SET METAFIELD SEPARATELY ─────────────────────────────────────────────
  if (shopifyDiscountId) {
    try {
      const metafieldRes = await admin.graphql(
        `#graphql
      mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { key namespace value }
          userErrors { field message }
        }
      }
    `,
        {
          variables: {
            metafields: [
              {
                ownerId: shopifyDiscountId,
                namespace: "fixed-bundle",
                key: "config",
                type: "json",
                value: JSON.stringify({
                  offerPercentage: pct,
                  minQuantity: minQuantity,
                  productIds: giftProducts.map((p) => p.id),
                  status: status || "active",
                }),
              },
            ],
          },
        },
      );
      const metafieldData = await metafieldRes.json();
      const metafieldErrors = metafieldData?.data?.metafieldsSet?.userErrors;
      if (metafieldErrors?.length) {
        console.error("Metafield errors:", metafieldErrors);
      }
    } catch (err) {
      console.error("Metafield set failed:", err);
    }
  }

  const bundle = await prisma.fixedBundleOffer.create({
    data: {
      shopId,
      title,
      description,
      offerPercentage: pct,
      minQuantity: minQuantity,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: status || "active",
      shopifyDiscountId,
      functionId: FUNCTION_HANDLE,
      products: {
        create: giftProducts.map((p, i) => ({
          productId: p.id,
          title: p.title,
          vendor: p.vendor ?? null,
          productType: p.productType ?? null,
          imageUrl: p.featuredImage?.url ?? p.images?.[0]?.url ?? null,
          position: i,
        })),
      },
    },
    include: { products: { orderBy: { position: "asc" } } },
  });

    return Response.json({ success: true, bundle });
  } catch (err) {
    console.error(err);
    return Response.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}
