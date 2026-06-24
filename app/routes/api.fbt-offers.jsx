import prisma from "../db.server";
import { authenticate } from "../shopify.server";

async function resolveShop(admin, session) {
  const domain = session.shop;
  let shop = await prisma.shop.findUnique({ where: { domain } });
  if (!shop) {
    shop = await prisma.shop.create({
      data: { domain, name: domain },
    });
  }
  return shop;
}

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = await resolveShop(null, session);

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
  const shop = await resolveShop(admin, session);

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

  if (!title?.trim())
    return Response.json({ error: "title is required" }, { status: 400 });

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
