import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    const body = await request.json();

    const { id, title, applyTo, tiers, products, startDate, endDate } = body;

    const offer = await prisma.quantityBreakOffer.findUnique({
      where: { id },
    });

    if (!offer?.shopifyDiscountId) {
      throw new Error("No Shopify discount linked");
    }

    const normalizedProducts = (products || []).map((p) => ({
      productId: String(p.productId),
      title: p.title,
    }));

    const config = {
      applyTo,
      productIds: normalizedProducts.map(
        (p) => `gid://shopify/Product/${p.productId}`,
      ),
      tiers: tiers.map((tier) => ({
        quantity: Number(tier.quantity),
        value: Number(tier.value),
        discountType: tier.discountType,
      })),
    };

    const UPDATE_MUTATION = `
      mutation discountAutomaticAppUpdate($id: ID!, $discount: DiscountAutomaticAppInput!) {
        discountAutomaticAppUpdate(id: $id, automaticAppDiscount: $discount) {
          automaticAppDiscount {
            discountId
            title
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await admin.graphql(UPDATE_MUTATION, {
      variables: {
        id: offer.shopifyDiscountId,
        discount: {
          title,
          startsAt: startDate,
          endsAt: endDate,
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

    if (result.data.discountAutomaticAppUpdate.userErrors.length) {
      return Response.json({ success: false, error: result });
    }

    await prisma.quantityBreakOffer.update({
      where: { id },
      data: {
        title,
        applyTo,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        tiers: {
          deleteMany: {},
          create: tiers.map((tier) => ({
            quantity: tier.quantity,
            discountType: tier.discountType,
            value: tier.value,
          })),
        },
        products: {
          deleteMany: {},
          create: normalizedProducts,
        },
      },
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
