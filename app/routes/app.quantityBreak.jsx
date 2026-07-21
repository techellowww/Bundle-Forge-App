import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useRouteError, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
<<<<<<< HEAD

=======
import { Page } from "@shopify/polaris";
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
import QuantityBreak from "../components/QuantityBreak/QuantityBreak";

export async function loader({ request }) {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return Response.json({ offer: null });

  const offer = await prisma.quantityBreakOffer.findUnique({
    where: { id },
    include: {
      tiers: { orderBy: { quantity: "asc" } },
      products: true,
      vendors: true,
      types: true,
      collections: true,
    },
  });

  return Response.json({ offer });
}

export default function QuantityBreakPage() {
  const { offer } = useLoaderData();
  const navigate = useNavigate();

  return (
<<<<<<< HEAD
    <>
      <QuantityBreak offer={offer} />
    </>
=======
    <Page 
      backAction={{ content: 'Quantity Breaks', onAction: () => navigate('/app/quantity-breaks') }}
      title={offer ? "Edit Quantity Break" : "Create Quantity Break"}
    >
      <QuantityBreak offer={offer} />
    </Page>
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
