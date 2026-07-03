import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useNavigate } from "react-router";
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
  Box,
  EmptyState,
} from "@shopify/polaris";
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
    <Page
      title="Quantity Break Offers"
      primaryAction={{
        content: "Create Offer",
        onAction: () => navigate("/app/quantityBreak"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card padding="400">
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="bodyMd" tone="subdued">
                  {offers.length} offer{offers.length !== 1 ? "s" : ""}
                </Text>
              </InlineStack>

              {offers.length === 0 ? (
                <EmptyState
                  heading="No quantity break offers"
                  image=""
                  action={{
                    content: "Create Offer",
                    onAction: () => navigate("/app/quantityBreak"),
                  }}
                >
                  <p>Create your first quantity break offer.</p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={{
                    singular: "offer",
                    plural: "offers",
                  }}
                  itemCount={offers.length}
                  selectable={false}
                  headings={[
                    { title: "Title" },
                    { title: "Applied To" },
                    { title: "Products" },
                    { title: "Tiers" },
                    { title: "Status" },
                    { title: "Start Date" },
                    { title: "End Date" },
                    { title: "Actions" },
                  ]}
                >
                  {offers.map((offer, index) => {
                    const status = getOfferStatus(offer);
                    const statusColor = getStatusColor(status);

                    return (
                      <IndexTable.Row
                        id={offer.id}
                        key={offer.id}
                        position={index}
                      >
                        <IndexTable.Cell>
                          <Text as="span" fontWeight="semibold">
                            {offer.title}
                          </Text>
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          <Badge>{offer.applyTo}</Badge>
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          {getProductNames(offer.products)}
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          <Box
                            title={offer.tiers
                              ?.map(
                                (tier) =>
                                  `Qty ${tier.quantity}: ${tier.value}${tier.discountType === "percentage" ? "%" : "$"}`,
                              )
                              .join(", ")}
                          >
                            <Badge tone="info">
                              {getTierSummary(offer.tiers)}
                            </Badge>
                          </Box>
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          <Badge tone={statusColor}>{status}</Badge>
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          {formatDate(offer.startDate)}
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          {formatDate(offer.endDate)}
                        </IndexTable.Cell>

                        <IndexTable.Cell>
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
                                openDeleteModal(offer.id, offer.title)
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
        title="Delete Offer"
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
