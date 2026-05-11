import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData } from "react-router";
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

  return <QuantityBreak offer={offer} />;
}
