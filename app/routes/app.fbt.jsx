/**
 * /app/routes/app.upsell-fbt.jsx
 */

import { useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import UpsellFbt from "../components/Fbt/UpsellFbt";

export async function loader({ request }) {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) return Response.json({ offer: null });

  const offer = await prisma.frequentlyBoughtOffer.findUnique({
    where: { id },
    include: {
      triggerProducts: true,
      bundledProducts: { orderBy: { position: "asc" } },
    },
  });

  return Response.json({ offer: offer ?? null });
}

export default function UpsellFbtPage() {
  const { offer } = useLoaderData();
  return <UpsellFbt offer={offer} />;
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
