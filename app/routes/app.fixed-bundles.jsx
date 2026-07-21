import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useNavigate, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
<<<<<<< HEAD
import { useState, useRef, useEffect } from "react";
=======
import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  ButtonGroup,
  Badge,
  Modal,
  IndexTable,
  Text,
  InlineStack,
  BlockStack,
  EmptyState,
  Box,
} from "@shopify/polaris";
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
import { getOfferStatus, getStatusColor, formatDate } from "../offer.utils.js";

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);

  const shop = await prisma.shop.findUnique({
    where: { domain: session.shop },
  });

  if (!shop) {
    return Response.json({ bundles: [] }, { status: 404 });
  }

  const bundles = await prisma.fixedBundleOffer.findMany({
    where: {
      shopId: shop.id,
    },
    include: {
      products: {
        orderBy: {
          position: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return Response.json({ bundles });
}

const CustomModal = ({ open, onClose, title, primaryAction, secondaryActions, children }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      if (open) {
        ref.current.show();
      } else {
        ref.current.hide();
      }
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handleClose = () => onClose();
    el.addEventListener('hide', handleClose);
    return () => el.removeEventListener('hide', handleClose);
  }, [onClose]);

  return (
    <ui-modal ref={ref}>
      <s-box padding="large">
        <s-stack direction="block" gap="large">
          <s-text as="h2" variant="headingMd">{title}</s-text>
          {children}
          <s-stack direction="inline" justifyContent="end" gap="base">
            {secondaryActions.map((action, i) => (
              <s-button key={i} onClick={action.onAction}>{action.content}</s-button>
            ))}
            <s-button 
              tone={primaryAction.tone === 'critical' ? 'critical' : 'primary'}
              onClick={primaryAction.onAction}
            >
              {primaryAction.loading ? "Loading..." : primaryAction.content}
            </s-button>
          </s-stack>
        </s-stack>
      </s-box>
    </ui-modal>
  );
};

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
    setDeleteModal({
      isOpen: true,
      id,
      title,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      id: null,
      title: "",
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);

    try {
      const res = await fetch("/api/fixed-bundle", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: deleteModal.id,
        }),
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
    } catch (error) {
      console.error(error);
      shopify.toast.show("Something went wrong", {
        isError: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const getProductSummary = (products) => {
    if (!products?.length) return "—";

    if (products.length <= 2) {
      return products.map((product) => product.title).join(", ");
    }

    return `${products
      .slice(0, 2)
      .map((product) => product.title)
      .join(", ")} +${products.length - 2} more`;
  };

  return (
<<<<<<< HEAD
    <>
      <ui-title-bar title="Fixed Bundle Offers">
        <button variant="breadcrumb" onClick={() => navigate('/app')}>
          Dashboard
        </button>
        <button variant="primary" onClick={() => navigate('/app/fixed-bundle')}>
          Create Bundle
        </button>
      </ui-title-bar>
      <s-page>
        <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
          <s-stack direction="block" gap="base">
            <s-stack direction="inline" justifyContent="space-between">
              <s-text variant="bodyMd" tone="subdued">
                {bundles.length} bundle{bundles.length !== 1 ? "s" : ""}
              </s-text>
            </s-stack>
=======
    <Page
      backAction={{ content: 'Dashboard', onAction: () => navigate('/app') }}
      title="Fixed Bundle Offers"
      primaryAction={{
        content: "Create Bundle",
        onAction: () => navigate("/app/fixed-bundle"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="bodyMd" tone="subdued">
                  {bundles.length} bundle{bundles.length !== 1 ? "s" : ""}
                </Text>
              </InlineStack>
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be

            {bundles.length === 0 ? (
              <s-stack direction="block" gap="base" alignItems="center">
                <s-text as="h2" variant="headingMd">No fixed bundles</s-text>
                <s-text as="p" tone="subdued">Create your first fixed bundle offer.</s-text>
                <s-button onClick={() => navigate("/app/fixed-bundle")}>Create Bundle</s-button>
              </s-stack>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e1e3e5' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Title</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Description</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Products</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Start Date</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>End Date</th>
                      <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundles.map((bundle, index) => {
                      const status = getOfferStatus(bundle);
                      const statusColor = getStatusColor(status);

                      return (
                        <tr key={bundle.id} style={{ borderBottom: '1px solid #e1e3e5' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <s-text as="span" fontWeight="semibold">
                              {bundle.title}
                            </s-text>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <s-box maxWidth="200px" title={bundle.description}>
                              <s-text as="span" truncate="true">
                                {bundle.description || "—"}
                              </s-text>
                            </s-box>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <s-box maxWidth="250px" title={bundle.products?.map((p) => p.title).join(", ")}>
                              <s-text as="span" truncate="true">
                                {getProductSummary(bundle.products)}
                              </s-text>
                            </s-box>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <s-badge tone={statusColor}>{status}</s-badge>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {formatDate(bundle.startDate)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {formatDate(bundle.endDate)}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <s-stack direction="inline" gap="small-200">
                              <s-button size="slim" onClick={() => handleEdit(bundle.id)}>
                                Edit
                              </s-button>
                              <s-button size="slim" tone="critical" onClick={() => openDeleteModal(bundle.id, bundle.title)}>
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

        <CustomModal
          open={deleteModal.isOpen}
          onClose={closeDeleteModal}
          title="Delete Bundle"
          primaryAction={{
            content: "Delete",
            tone: "critical",
            loading: isDeleting,
            onAction: handleConfirmDelete,
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: closeDeleteModal,
            },
          ]}
        >
          <s-text as="p">
            Are you sure you want to delete <strong>{deleteModal.title}</strong>? This action cannot be undone.
          </s-text>
        </CustomModal>
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
