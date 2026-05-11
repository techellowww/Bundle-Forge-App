import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useNavigate } from "react-router";
import { Button, ButtonGroup } from "@shopify/polaris";

export async function loader({ request }) {
  await authenticate.admin(request);
  const offers = await prisma.quantityBreakOffer.findMany({
    include: {
      tiers: true,
      products: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json({ offers });
}

export default function QuantityBreakList() {
  const { offers } = useLoaderData();
  const navigate = useNavigate();

  const handleEdit = (item) => {
    navigate(`/app/quantityBreak?id=${item.id}`);
  };

  const handleDelete = async (id) => {
    const res = await fetch("/api/delete-quantity-discount", {
      method: "POST",
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (data.success) {
      window.location.reload();
    }
  };

  return (
    <s-section padding="none">
      <s-table>
        <s-table-header-row>
          <s-table-header>Title</s-table-header>
          <s-table-header>Applied To</s-table-header>
          <s-table-header>Product Name</s-table-header>
          <s-table-header>Discount Type</s-table-header>
          <s-table-header>Quantity</s-table-header>
          <s-table-header>Value</s-table-header>
          <s-table-header>Status</s-table-header>
          <s-table-header>Start Date</s-table-header>
          <s-table-header>End Date</s-table-header>
          <s-table-header>Action</s-table-header>
        </s-table-header-row>

        <s-table-body>
          {offers?.flatMap((item) =>
            item.tiers.map((tier) => {
              const productNames =
                item.products?.map((p) => p.title).join(", ") || "Products";

              return (
                <s-table-row key={`${item.id}-${tier.id}`}>
                  <s-table-cell>{item.title}</s-table-cell>
                  <s-table-cell>{item.applyTo}</s-table-cell>
                  <s-table-cell>{productNames}</s-table-cell>
                  <s-table-cell>{tier.discountType}</s-table-cell>
                  <s-table-cell>{tier.quantity}</s-table-cell>
                  <s-table-cell>{tier.value}</s-table-cell>
                  <s-table-cell>Active</s-table-cell>
                  <s-table-cell>
                    {item.startDate
                      ? new Date(item.startDate).toLocaleDateString()
                      : "—"}
                  </s-table-cell>
                  <s-table-cell>
                    {item.endDate
                      ? new Date(item.endDate).toLocaleDateString()
                      : "—"}
                  </s-table-cell>
                  <s-table-cell>
                    <ButtonGroup>
                      <Button size="slim" onClick={() => handleEdit(item)}>
                        Edit
                      </Button>
                      <Button
                        size="slim"
                        tone="critical"
                        onClick={() => handleDelete(item.id)}
                      >
                        Delete
                      </Button>
                    </ButtonGroup>
                  </s-table-cell>
                </s-table-row>
              );
            }),
          )}
        </s-table-body>
      </s-table>
    </s-section>
  );
}
