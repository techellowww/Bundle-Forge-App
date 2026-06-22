import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "react-router";

import BuyXGetY from "../components/BuyOneGetOne/BuyXGetY";

export async function loader({ request }) {
  await authenticate.admin(request);

  const url = new URL(request.url);

  const id = url.searchParams.get("id");

  const offer = await prisma.bxgyOffer.findUnique({
    where: { id },

    include: {
      products: true,
      vendors: true,
      productTypes: true,
      collections: true,

      productGift: {
        include: {
          giftProducts: true,
        },
      },

      shippingGift: true,
    },
  });

  return Response.json({
    offer,
  });
}

export default function EditBxgyPage() {
  const { offer } = useLoaderData();

  return <BuyXGetY initialData={offer} />;
}
