import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useNavigate } from "react-router";
import { Button, ButtonGroup } from "@shopify/polaris";

export async function loader({ request }) {
  await authenticate.admin(request);

  const offers = await prisma.bxgyOffer.findMany({
    include: {
      products: true,
      vendors: true,
      productTypes: true,
      collections: true,
      productGift: true,
      shippingGift: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json({ offers });
}

export default function BxgyListPage() {
  const { offers } = useLoaderData();
  const navigate = useNavigate();

  const handleEdit = (id) => {
    navigate(`/app/buyXgetY?id=${id}`);
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch("/api/delete-bxgy-offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (data.success) {
        shopify.toast.show("Offer deleted");
        window.location.reload();
      } else {
        shopify.toast.show(data.error || "Delete failed", {
          isError: true,
        });
      }
    } catch (err) {
      console.error(err);

      shopify.toast.show("Something went wrong", {
        isError: true,
      });
    }
  };

  return (
    <s-page heading="BXGY Offers">
      <s-section>
        <s-table>
          <s-table-header-row>
            <s-table-header>Title</s-table-header>
            <s-table-header>Apply To</s-table-header>
            <s-table-header>Gift Type</s-table-header>
            <s-table-header>Gift Details</s-table-header>
            <s-table-header>Status</s-table-header>
            <s-table-header>Start Date</s-table-header>
            <s-table-header>End Date</s-table-header>
            <s-table-header>Actions</s-table-header>
          </s-table-header-row>

          <s-table-body>
            {offers?.map((offer) => {
              let appliedTo = "All Products";

              if (offer.products?.length > 0) {
                appliedTo = offer.products.map((p) => p.title).join(", ");
              } else if (offer.vendors?.length > 0) {
                appliedTo = offer.vendors.map((v) => v.vendor).join(", ");
              } else if (offer.productTypes?.length > 0) {
                appliedTo = offer.productTypes
                  .map((t) => t.productType)
                  .join(", ");
              } else if (offer.collections?.length > 0) {
                appliedTo = offer.collections.map((c) => c.title).join(", ");
              }

              let giftDetails = "-";

              if (offer.productGift) {
                giftDetails =
                  offer.productGift.discountType === "free"
                    ? "Free Gift"
                    : `${offer.productGift.discountValue}% OFF`;
              }

              if (offer.shippingGift) {
                giftDetails = offer.shippingGift.enableFreeShipping
                  ? "Free Shipping"
                  : `${offer.shippingGift.discountValue}% Shipping OFF`;
              }

              return (
                <s-table-row key={offer.id}>
                  <s-table-cell>
                    {offer.discountTitle || offer.title}
                  </s-table-cell>

                  <s-table-cell>{appliedTo}</s-table-cell>

                  <s-table-cell>
                    {offer.giftMode === "PRODUCT_GIFT"
                      ? "Product Gift"
                      : "Shipping Discount"}
                  </s-table-cell>

                  <s-table-cell>{giftDetails}</s-table-cell>

                  <s-table-cell>{offer.status}</s-table-cell>

                  <s-table-cell>
                    {offer.startDate
                      ? new Date(offer.startDate).toLocaleDateString()
                      : "-"}
                  </s-table-cell>

                  <s-table-cell>
                    {offer.endDate
                      ? new Date(offer.endDate).toLocaleDateString()
                      : "-"}
                  </s-table-cell>

                  <s-table-cell>
                    <ButtonGroup>
                      <Button size="slim" onClick={() => handleEdit(offer.id)}>
                        Edit
                      </Button>

                      <Button
                        size="slim"
                        tone="critical"
                        onClick={() => handleDelete(offer.id)}
                      >
                        Delete
                      </Button>
                    </ButtonGroup>
                  </s-table-cell>
                </s-table-row>
              );
            })}
          </s-table-body>
        </s-table>
      </s-section>
    </s-page>
  );
}
