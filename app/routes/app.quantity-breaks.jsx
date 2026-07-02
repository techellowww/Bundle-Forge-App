import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useNavigate } from "react-router";
import { Button, ButtonGroup, Badge, Modal } from "@shopify/polaris";
import { useState } from "react";
import { getOfferStatus, getStatusColor, formatDate } from "../offer.utils.js";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  // Get shop context for multi-tenant filtering
  const shop = await prisma.shop.findUnique({
    where: { domain: session.shop },
  });

  if (!shop) {
    return Response.json({ offers: [] }, { status: 404 });
  }

  const offers = await prisma.quantityBreakOffer.findMany({
    where: { shopId: shop.id },
    include: {
      tiers: { orderBy: { quantity: "asc" } },
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
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    title: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (id) => {
    navigate(`/app/quantityBreak?id=${id}`);
  };

  const openDeleteModal = (id, title) => {
    setDeleteModal({ isOpen: true, id, title });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, id: null, title: "" });
  };

  const handleConfirmDelete = async () => {
    const id = deleteModal.id;
    setIsDeleting(true);

    try {
      const res = await fetch("/api/delete-quantity-discount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
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
    } catch (err) {
      console.error("Delete error:", err);
      shopify.toast.show("Something went wrong", { isError: true });
    } finally {
      setIsDeleting(false);
    }
  };

  const getProductNames = (products) => {
    if (!products || products.length === 0) return "All Products";
    if (products.length === 1) return products[0].title;
    return `${products.length} products`;
  };

  const getTierSummary = (tiers) => {
    if (!tiers || tiers.length === 0) return "—";
    return `${tiers.length} tier${tiers.length !== 1 ? "s" : ""}`;
  };

  return (
    <s-page heading="Quantity Break Offers">
      <s-section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "14px", color: "#666" }}>
            {offers?.length || 0} offer{offers?.length !== 1 ? "s" : ""}
          </div>
          <Button
            variant="primary"
            onClick={() => navigate("/app/quantityBreak")}
          >
            Create Offer
          </Button>
        </div>

        {offers?.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              borderRadius: "8px",
              backgroundColor: "#f9fafb",
            }}
          >
            <h3 style={{ marginBottom: "8px" }}>No offers yet</h3>
            <p style={{ color: "#666", marginBottom: "16px" }}>
              Create your first quantity break offer to get started.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/app/quantityBreak")}
            >
              Create Your First Offer
            </Button>
          </div>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>Title</s-table-header>
              <s-table-header>Applied To</s-table-header>
              <s-table-header>Products</s-table-header>
              <s-table-header>Tiers</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header>Start Date</s-table-header>
              <s-table-header>End Date</s-table-header>
              <s-table-header>Actions</s-table-header>
            </s-table-header-row>

            <s-table-body>
              {offers.map((offer) => {
                const status = getOfferStatus(offer);
                const statusColor = getStatusColor(status);

                return (
                  <s-table-row key={offer.id}>
                    <s-table-cell>
                      <strong>{offer.title}</strong>
                    </s-table-cell>

                    <s-table-cell>
                      <span
                        style={{
                          backgroundColor: "#f0f0f0",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          textTransform: "uppercase",
                          fontWeight: "500",
                        }}
                      >
                        {offer.applyTo}
                      </span>
                    </s-table-cell>

                    <s-table-cell>
                      {getProductNames(offer.products)}
                    </s-table-cell>

                    <s-table-cell>
                      <span
                        title={offer.tiers
                          ?.map(
                            (t) =>
                              `Qty ${t.quantity}: ${t.value}${t.discountType === "percentage" ? "%" : "$"}`,
                          )
                          .join(", ")}
                        style={{
                          backgroundColor: "#e3f2fd",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                        }}
                      >
                        {getTierSummary(offer.tiers)}
                      </span>
                    </s-table-cell>

                    <s-table-cell>
                      <Badge tone={statusColor}>{status}</Badge>
                    </s-table-cell>

                    <s-table-cell>{formatDate(offer.startDate)}</s-table-cell>

                    <s-table-cell>{formatDate(offer.endDate)}</s-table-cell>

                    <s-table-cell>
                      <ButtonGroup>
                        <Button
                          size="slim"
                          onClick={() => handleEdit(offer.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="slim"
                          tone="critical"
                          onClick={() => openDeleteModal(offer.id, offer.title)}
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
        )}
      </s-section>

      <Modal
        open={deleteModal.isOpen}
        onClose={closeDeleteModal}
        title="Delete Offer"
        primaryAction={{
          content: "Delete",
          onAction: handleConfirmDelete,
          loading: isDeleting,
          tone: "critical",
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: closeDeleteModal,
          },
        ]}
      >
        <Modal.Section>
          <p>
            Are you sure you want to delete <strong>{deleteModal.title}</strong>
            ? This action cannot be undone.
          </p>
        </Modal.Section>
      </Modal>
    </s-page>
  );
}
