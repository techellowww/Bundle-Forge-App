import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useNavigate, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useState, useRef } from "react";
import { getOfferStatus, getStatusColor, formatDate } from "../offer.utils.js";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const shop = await prisma.shop.findUnique({
    where: { domain: session.shop },
  });

  if (!shop) {
    return Response.json({ offers: [] }, { status: 404 });
  }

  const offers = await prisma.quantityBreakOffer.findMany({
    where: {
      shopId: shop.id,
    },
    include: {
      tiers: {
        orderBy: {
          quantity: "asc",
        },
      },
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
  const modalRef = useRef(null);

  const [deleteModal, setDeleteModal] = useState({
    id: null,
    title: "",
  });

  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (id) => {
    navigate(`/app/quantityBreak?id=${id}`);
  };

  const openDeleteModal = (id, title) => {
    setDeleteModal({
      id,
      title,
    });
    modalRef.current?.show();
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      id: null,
      title: "",
    });
    modalRef.current?.hide();
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch("/api/delete-quantity-discount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: deleteModal.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        shopify.toast.show("Offer deleted successfully");
        closeDeleteModal();
        window.location.reload();
      } else {
        shopify.toast.show(data.error || "Failed to delete offer", {
          isError: true,
        });
      }
    } catch (error) {
      console.error(error);
      shopify.toast.show("Something went wrong", {
        isError: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getProductNames = (products) => {
    if (!products?.length) return "All Products";

    if (products.length === 1) {
      return products[0].title;
    }

    return `${products.length} products`;
  };

  const getTierSummary = (tiers) => {
    if (!tiers?.length) return "—";

    return `${tiers.length} tier${tiers.length > 1 ? "s" : ""}`;
  };

  return (
    <s-page>
      <ui-title-bar title="Quantity Break Offers">
        <button variant="breadcrumb" onClick={() => navigate('/app')}>Dashboard</button>
        <button variant="primary" onClick={() => navigate('/app/quantityBreak')}>Create Offer</button>
      </ui-title-bar>

      <s-stack direction="block" gap="600">
        <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
          <s-stack direction="block" gap="large">
            <s-stack direction="inline" justifyContent="space-between">
              <s-text variant="bodyMd" tone="subdued">
                {offers.length} offer{offers.length !== 1 ? "s" : ""}
              </s-text>
            </s-stack>

            {offers.length === 0 ? (
              <s-box padding="800">
                <s-stack direction="block" alignItems="center" gap="large">
                  <s-text as="h2" variant="headingLg">No quantity break offers</s-text>
                  <s-text as="p" tone="subdued">Create your first quantity break offer.</s-text>
                  <s-button variant="primary" onClick={() => navigate("/app/quantityBreak")}>Create Offer</s-button>
                </s-stack>
              </s-box>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e1e3e5' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Title</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Applied To</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Products</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Tiers</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Start Date</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>End Date</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {offers.map((offer, index) => {
                      const status = getOfferStatus(offer);
                      const statusColor = getStatusColor(status);

                      return (
                        <tr key={offer.id} style={{ borderBottom: '1px solid #e1e3e5' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <s-text as="span" fontWeight="semibold">
                              {offer.title}
                            </s-text>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <s-badge>{offer.applyTo}</s-badge>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {getProductNames(offer.products)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div
                              title={offer.tiers
                                ?.map(
                                  (tier) =>
                                    `Qty ${tier.quantity}: ${tier.value}${tier.discountType === "percentage" ? "%" : "$"}`,
                                )
                                .join(", ")}
                            >
                              <s-badge tone="info">
                                {getTierSummary(offer.tiers)}
                              </s-badge>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <s-badge tone={statusColor}>{status}</s-badge>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {formatDate(offer.startDate)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {formatDate(offer.endDate)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <s-stack direction="inline" gap="small-200">
                              <s-button size="slim" onClick={() => handleEdit(offer.id)}>
                                Edit
                              </s-button>
                              <s-button size="slim" tone="critical" onClick={() => openDeleteModal(offer.id, offer.title)}>
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
      </s-stack>

      <ui-modal ref={modalRef} id="delete-modal">
        <ui-title-bar title="Delete Offer">
          <button variant="primary" tone="critical" onClick={handleConfirmDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button onClick={closeDeleteModal}>Cancel</button>
        </ui-title-bar>
        <s-box padding="large">
          <s-text as="p">
            Are you sure you want to delete <strong>{deleteModal.title}</strong>
            ? This action cannot be undone.
          </s-text>
        </s-box>
      </ui-modal>
    </s-page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
