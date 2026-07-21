
import { useLoaderData, useRouteError, useNavigate } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import FixedBundle from "../components/FixedBundles/FixedBundle";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request); // only once

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return Response.json({ offer: null });
  }

  const shop = await prisma.shop.findUnique({
    where: { domain: session.shop },
  });

  const offer = await prisma.fixedBundleOffer.findUnique({
    where: { id, shopId: shop.id },
    include: { products: { orderBy: { position: "asc" } } },
  });

  return Response.json({ offer });
}

export default function FixedBundlePage() {
  const { offer } = useLoaderData();
  const navigate = useNavigate();

  return (
    <>
      
          <FixedBundle offer={offer} />
        
    </>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
