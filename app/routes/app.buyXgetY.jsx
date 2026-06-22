import { Page, Layout } from "@shopify/polaris";
import { useLoaderData } from "react-router";

import prisma from "../db.server";
import { authenticate } from "../shopify.server";

import BuyXGetY from "../components/BuyOneGetOne/BuyXGetY";

export async function loader({ request }) {
  await authenticate.admin(request);

  const url = new URL(request.url);

  const id = url.searchParams.get("id");

  // Create mode
  if (!id) {
    return Response.json({
      offer: null,
    });
  }

  // Edit mode
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

export default function BuyXGetYPage() {
  const { offer } = useLoaderData();

  return (
    <Page title={offer ? "Edit Buy X Get Y Offer" : "Create Buy X Get Y Offer"}>
      <Layout>
        <Layout.Section>
          <BuyXGetY offer={offer} />
        </Layout.Section>
      </Layout>
    </Page>
  );
}
