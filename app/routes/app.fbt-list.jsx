/**
 * /app/routes/app.fbt-list.jsx
 */

import { useLoaderData, useNavigate, useRevalidator } from "react-router";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { useState } from "react";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const shop = await prisma.shop.findUnique({
    where: { domain: session.shop },
  });
  if (!shop) return Response.json({ offers: [] });

  const offers = await prisma.frequentlyBoughtOffer.findMany({
    where: { shopId: shop.id },
    include: { triggerProducts: true, bundledProducts: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ offers });
}

const STATUS_COLOR = {
  ACTIVE: "#00a651",
  PAUSED: "#f5a623",
  DRAFT: "#8c9196",
};

export default function FbtListPage() {
  const { offers } = useLoaderData();
  const navigate = useNavigate();
  const { revalidate } = useRevalidator();
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);

  const handleDelete = async (id) => {
    if (!confirm("Delete this offer? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch("/api/fbt-offers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.success) {
        shopify.toast.show("Offer deleted");
        revalidate();
      } else {
        shopify.toast.show(data.error || "Delete failed", { isError: true });
      }
    } catch {
      shopify.toast.show("Something went wrong", { isError: true });
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (offer) => {
    const newStatus = offer.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setToggling(offer.id);
    try {
      const res = await fetch("/api/fbt-offers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: offer.id,
          title: offer.title,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        shopify.toast.show(
          `Offer ${newStatus === "ACTIVE" ? "activated" : "paused"}`,
        );
        revalidate();
      }
    } catch {
      shopify.toast.show("Status update failed", { isError: true });
    } finally {
      setToggling(null);
    }
  };

  return (
    <s-page heading="Frequently Bought Together">
      <s-box paddingBlockEnd="400">
        <s-stack
          direction="inline"
          blockAlignment="center"
          inlineAlignment="end"
        >
          <s-button
            variant="primary"
            onClick={() => navigate("/app/fbt")}
          >
            + Create FBT Offer
          </s-button>
        </s-stack>
      </s-box>

      <s-section>
        {offers.length === 0 ? (
          <s-box padding="800" style={{ textAlign: "center" }}>
            <s-stack direction="block" gap="base" blockAlignment="center">
              <s-heading>No offers yet</s-heading>
              <s-text tone="subdued">
                Create your first Frequently Bought Together offer to increase
                AOV.
              </s-text>
              <s-button
                variant="primary"
                onClick={() => navigate("/app/fbt")}
              >
                Create FBT Offer
              </s-button>
            </s-stack>
          </s-box>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>Title</s-table-header>
              <s-table-header>Trigger products</s-table-header>
              <s-table-header>Bundled products</s-table-header>
              <s-table-header>Discount</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header>Start date</s-table-header>
              <s-table-header>End date</s-table-header>
              <s-table-header>Actions</s-table-header>
            </s-table-header-row>

            <s-table-body>
              {offers.map((offer) => {
                const triggers =
                  offer.triggerProducts?.map((p) => p.title).join(", ") ||
                  "All products";
                const bundledCount = offer.bundledProducts?.length ?? 0;
                const bundled = bundledCount
                  ? `${bundledCount} product${bundledCount !== 1 ? "s" : ""}`
                  : "-";

                let discountLabel = "-";
                if (offer.discountType === "free") discountLabel = "Free";
                else if (offer.discountType === "percentage")
                  discountLabel = `${offer.discountValue}% off`;
                else if (offer.discountType === "amount")
                  discountLabel = `$${offer.discountValue} off`;

                return (
                  <s-table-row key={offer.id}>
                    <s-table-cell>
                      <s-text variant="bodyMd" fontWeight="semibold">
                        {offer.discountTitle || offer.title}
                      </s-text>
                    </s-table-cell>
                    <s-table-cell>
                      <s-text tone="subdued" style={{ fontSize: "13px" }}>
                        {triggers.length > 40
                          ? triggers.slice(0, 40) + "…"
                          : triggers}
                      </s-text>
                    </s-table-cell>
                    <s-table-cell>{bundled}</s-table-cell>
                    <s-table-cell>{discountLabel}</s-table-cell>
                    <s-table-cell>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: STATUS_COLOR[offer.status] ?? "#8c9196",
                        }}
                      >
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: STATUS_COLOR[offer.status] ?? "#8c9196",
                            display: "inline-block",
                          }}
                        />
                        {offer.status}
                      </span>
                    </s-table-cell>
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
                      <s-stack direction="inline" gap="small">
                        <s-button
                          size="slim"
                          onClick={() =>
                            navigate(`/app/fbt?id=${offer.id}`)
                          }
                        >
                          Edit
                        </s-button>
                        <s-button
                          size="slim"
                          onClick={() => handleToggleStatus(offer)}
                          disabled={toggling === offer.id}
                        >
                          {offer.status === "ACTIVE" ? "Pause" : "Activate"}
                        </s-button>
                        <s-button
                          size="slim"
                          tone="critical"
                          onClick={() => handleDelete(offer.id)}
                          disabled={deleting === offer.id}
                        >
                          Delete
                        </s-button>
                      </s-stack>
                    </s-table-cell>
                  </s-table-row>
                );
              })}
            </s-table-body>
          </s-table>
        )}
      </s-section>
    </s-page>
  );
}
