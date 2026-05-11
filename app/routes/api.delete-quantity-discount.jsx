import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  try {
    const { admin } = await authenticate.admin(request);
    const { id } = await request.json();

    const offer = await prisma.quantityBreakOffer.findUnique({
      where: { id },
    });

    if (!offer) throw new Error("Offer not found");

    if (offer.shopifyDiscountId) {
      const DELETE_MUTATION = `
        mutation discountAutomaticDelete($id: ID!) {
          discountAutomaticDelete(id: $id) {
            deletedAutomaticDiscountId
            userErrors {
              field
              message
            }
          }
        }
      `;

      await admin.graphql(DELETE_MUTATION, {
        variables: { id: offer.shopifyDiscountId },
      });
    }

    await prisma.quantityBreakOffer.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: err.message });
  }
}
