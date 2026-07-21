/**
 * /app/routes/app.fbt-list.jsx
 */

import { useLoaderData, useNavigate, useRevalidator, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { formatDate } from "../offer.utils.js";
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
    <>
      <ui-title-bar title="Frequently Bought Together">
        <button variant="breadcrumb" onClick={() => navigate('/app')}>
          Dashboard
        </button>
        <button variant="primary" onClick={() => navigate('/app/fbt')}>
          Create FBT Offer
        </button>
      </ui-title-bar>
      <s-page>
        <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" justifyContent="space-between">
              <s-text variant="bodyMd" tone="subdued">
                {offers.length} offer{offers.length !== 1 ? "s" : ""}
              </s-text>
            </s-stack>

            {offers.length === 0 ? (
              <s-stack direction="block" gap="base" alignItems="center">
                <s-text as="h2" variant="headingMd">No offers yet</s-text>
                <s-text as="p" tone="subdued">Create your first Frequently Bought Together offer to increase AOV.</s-text>
                <s-button onClick={() => navigate("/app/fbt")}>Create FBT Offer</s-button>
              </s-stack>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e1e3e5' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Title</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Trigger products</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Bundled products</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Discount</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Start date</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>End date</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer, index) => {
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

                      const tone = offer.status === "ACTIVE" ? "success" : offer.status === "PAUSED" ? "attention" : "new";

                      return (
                        <tr key={offer.id} style={{ borderBottom: '1px solid #e1e3e5' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <s-text as="span" fontWeight="semibold">
                              {offer.discountTitle || offer.title}
                            </s-text>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <s-box maxWidth="250px" title={triggers}>
                              <s-text as="span" truncate="true">
                                {triggers}
                              </s-text>
                            </s-box>
                          </td>
                          <td style={{ padding: '12px 16px' }}>{bundled}</td>
                          <td style={{ padding: '12px 16px' }}>{discountLabel}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <s-badge tone={tone}>{offer.status}</s-badge>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {formatDate(offer.startDate)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {formatDate(offer.endDate)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <s-stack direction="inline" gap="small-200">
                              <s-button size="slim" onClick={() => navigate(`/app/fbt?id=${offer.id}`)}>
                                Edit
                              </s-button>
                              <s-button size="slim" onClick={() => handleToggleStatus(offer)}>
                                {offer.status === "ACTIVE" ? "Pause" : "Activate"}
                              </s-button>
                              <s-button size="slim" tone="critical" onClick={() => handleDelete(offer.id)}>
                                Delete
                              </s-button>
                            </s-stack>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </s-stack>
        </s-box>
      </s-page>
    </>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
