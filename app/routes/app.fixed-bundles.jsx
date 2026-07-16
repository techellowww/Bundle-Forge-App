import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useNavigate, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
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

              {bundles.length === 0 ? (
                <EmptyState
                  heading="No fixed bundles"
                  image=""
                  action={{
                    content: "Create Bundle",
                    onAction: () => navigate("/app/fixed-bundle"),
                  }}
                >
                  <p>Create your first fixed bundle offer.</p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={{
                    singular: "bundle",
                    plural: "bundles",
                  }}
                  itemCount={bundles.length}
                  selectable={false}
                  headings={[
                    { title: "Title" },
                    { title: "Description" },
                    { title: "Products" },
                    { title: "Status" },
                    { title: "Start Date" },
                    { title: "End Date" },
                    { title: "Actions" },
                  ]}
                >
                  {bundles.map((bundle, index) => {
                    const status = getOfferStatus(bundle);
                    const statusColor = getStatusColor(status);

                    return (
                      <IndexTable.Row
                        id={bundle.id}
                        key={bundle.id}
                        position={index}
                      >
                        <IndexTable.Cell>
                          <Text as="span" fontWeight="semibold">
                            {bundle.title}
                          </Text>
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          {bundle.description ? (
                            <Box maxWidth="220px" title={bundle.description}>
                              <Text as="span" truncate>
                                {bundle.description}
                              </Text>
                            </Box>
                          ) : (
                            "—"
                          )}
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          <Text
                            as="span"
                            title={bundle.products
                              ?.map((p) => p.title)
                              .join(", ")}
                          >
                            {getProductSummary(bundle.products)}
                          </Text>
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          <Badge tone={statusColor}>{status}</Badge>
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          {formatDate(bundle.startDate)}
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          {formatDate(bundle.endDate)}
                        </IndexTable.Cell>

                        <IndexTable.Cell>
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
                        </IndexTable.Cell>
                      </IndexTable.Row>
                    );
                  })}
                </IndexTable>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
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
        <Modal.Section>
          <Text as="p">
            Are you sure you want to delete <strong>{deleteModal.title}</strong>
            ? This action cannot be undone.
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
