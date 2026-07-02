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

  const offers = await prisma.bxgyOffer.findMany({
    where: { shopId: shop.id },
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
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    title: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (id) => {
    navigate(`/app/buyXgetY?id=${id}`);
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
      const res = await fetch("/api/delete-bxgy-offer", {
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
        // Refresh data
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

  const getAppliedTo = (offer) => {
    if (offer.products?.length > 0) {
      return offer.products.map((p) => p.title).join(", ");
    } else if (offer.vendors?.length > 0) {
      return offer.vendors.map((v) => v.vendor).join(", ");
    } else if (offer.productTypes?.length > 0) {
      return offer.productTypes.map((t) => t.productType).join(", ");
    } else if (offer.collections?.length > 0) {
      return offer.collections.map((c) => c.title).join(", ");
    }
    return "All Products";
  };

  const getGiftDetails = (offer) => {
    if (offer.productGift) {
      return offer.productGift.discountType === "free"
        ? "Free Gift"
        : `${offer.productGift.discountValue}% OFF`;
    }

    if (offer.shippingGift) {
      return offer.shippingGift.enableFreeShipping
        ? "Free Shipping"
        : `${offer.shippingGift.discountValue}% Shipping OFF`;
    }

    return "—";
  };
  console.log("mmmmmmmmmmmmm", offers);

  return (
    <s-page heading="Buy X Get Y Offers">
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
          <Button variant="primary" onClick={() => navigate("/app/buyXgetY")}>
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
              Create your first Buy X Get Y offer to get started.
            </p>
            <Button variant="primary" onClick={() => navigate("/app/buyXgetY")}>
              Create Your First Offer
            </Button>
          </div>
        ) : (
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
              {offers.map((offer) => {
                const status = getOfferStatus(offer);
                const statusColor = getStatusColor(status);

                return (
                  <s-table-row key={offer.id}>
                    <s-table-cell>
                      <strong>{offer.discountTitle || offer.title}</strong>
                    </s-table-cell>

                    <s-table-cell>{getAppliedTo(offer)}</s-table-cell>

                    <s-table-cell>
                      {offer.giftMode === "PRODUCT_GIFT"
                        ? "Product Gift"
                        : "Shipping Discount"}
                    </s-table-cell>

                    <s-table-cell>{getGiftDetails(offer)}</s-table-cell>

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
                          onClick={() =>
                            openDeleteModal(
                              offer.id,
                              offer.discountTitle || offer.title,
                            )
                          }
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
