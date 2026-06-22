import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function action({ request }) {
  await authenticate.admin(request);

  try {
    const { id } = await request.json();

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
