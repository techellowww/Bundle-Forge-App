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
    return Response.json({ bundles: [] }, { status: 404 });
  }

  const bundles = await prisma.fixedBundleOffer.findMany({
    where: { shopId: shop.id },
    include: { products: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json({ bundles });
}

export default function FixedBundlesListPage() {
  const { bundles } = useLoaderData();
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: null,
    title: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = (id) => {
    navigate(`/app/fixed-bundle?id=${id}`);
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
      const res = await fetch("/api/fixed-bundle", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await res.json();

      if (data.success) {
        shopify.toast.show("Bundle deleted successfully");
        closeDeleteModal();
        window.location.reload();
      } else {
        shopify.toast.show(data.error || "Failed to delete bundle", {
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

  return (
    <s-page heading="Fixed Bundle Offers">
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
            {bundles?.length || 0} bundle{bundles?.length !== 1 ? "s" : ""}
          </div>
          <Button
            variant="primary"
            onClick={() => navigate("/app/fixed-bundle")}
          >
            Create Bundle
          </Button>
        </div>

        {bundles?.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              borderRadius: "8px",
              backgroundColor: "#f9fafb",
            }}
          >
            <h3 style={{ marginBottom: "8px" }}>No bundles yet</h3>
            <p style={{ color: "#666", marginBottom: "16px" }}>
              Create your first fixed bundle to get started.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/app/fixed-bundle")}
            >
              Create Your First Bundle
            </Button>
          </div>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>Title</s-table-header>
              <s-table-header>Description</s-table-header>
              <s-table-header>Products</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header>Start Date</s-table-header>
              <s-table-header>End Date</s-table-header>
              <s-table-header>Actions</s-table-header>
            </s-table-header-row>

            <s-table-body>
              {bundles.map((bundle) => {
                const status = getOfferStatus(bundle);
                const statusColor = getStatusColor(status);

                return (
                  <s-table-row key={bundle.id}>
                    <s-table-cell>
                      <strong>{bundle.title}</strong>
                    </s-table-cell>

                    <s-table-cell>
                      {bundle.description ? (
                        <span
                          title={bundle.description}
                          style={{
                            display: "inline-block",
                            maxWidth: "200px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {bundle.description}
                        </span>
                      ) : (
                        "—"
                      )}
                    </s-table-cell>

                    <s-table-cell>
                      {bundle.products?.length > 0
                        ? bundle.products.length > 2
                          ? `${bundle.products
                              .slice(0, 2)
                              .map((p) => p.title)
                              .join(", ")}...`
                          : bundle.products.map((p) => p.title).join(", ")
                        : "—"}
                    </s-table-cell>

                    <s-table-cell>
                      <Badge tone={statusColor}>{status}</Badge>
                    </s-table-cell>

                    <s-table-cell>{formatDate(bundle.startDate)}</s-table-cell>

                    <s-table-cell>{formatDate(bundle.endDate)}</s-table-cell>

                    <s-table-cell>
                      <ButtonGroup>
                        <Button
                          size="slim"
                          onClick={() => handleEdit(bundle.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="slim"
                          tone="critical"
                          onClick={() =>
                            openDeleteModal(bundle.id, bundle.title)
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
        title="Delete Bundle"
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
