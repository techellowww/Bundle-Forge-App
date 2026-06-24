import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  const { admin } = await authenticate.admin(request);

  try {
    const { id } = await request.json();

    const offer = await prisma.bxgyOffer.findUnique({
      where: { id },
    });

    if (!offer) {
      return Response.json(
        { success: false, error: "Offer not found" },
        { status: 404 },
      );
    }

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

      const result = await admin.graphql(DELETE_MUTATION, {
        variables: { id: offer.shopifyDiscountId },
      });

      const data = await result.json();
      if (data.errors) {
        console.warn(
          "Shopify discount delete warning:",
          data.errors[0]?.message,
        );
      }
    }

    await prisma.bxgyOffer.delete({
      where: {
        id,
      },
    });

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.log(error);

    return Response.json({
      success: false,
      error: error.message,
    });
  }
}
