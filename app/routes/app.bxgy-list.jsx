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
    return Response.json({ offers: [] }, { status: 404 });
  }

  const offers = await prisma.bxgyOffer.findMany({
    where: {
      shopId: shop.id,
    },
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
      const res = await fetch("/api/delete-bxgy-offer", {
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

  const getAppliedTo = (offer) => {
    if (offer.products?.length) {
      return offer.products.map((p) => p.title).join(", ");
    }

    if (offer.vendors?.length) {
      return offer.vendors.map((v) => v.vendor).join(", ");
    }

    if (offer.productTypes?.length) {
      return offer.productTypes.map((t) => t.productType).join(", ");
    }

    if (offer.collections?.length) {
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

  return (
    <Page
      title="Buy X Get Y Offers"
      primaryAction={{
        content: "Create Offer",
        onAction: () => navigate("/app/buyXgetY"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between">
                <Text variant="bodyMd" tone="subdued">
                  {offers.length} offer{offers.length !== 1 ? "s" : ""}
                </Text>
              </InlineStack>

              {offers.length === 0 ? (
                <EmptyState
                  heading="No Buy X Get Y offers"
                  image=""
                  action={{
                    content: "Create Offer",
                    onAction: () => navigate("/app/buyXgetY"),
                  }}
                >
                  <p>Create your first Buy X Get Y offer.</p>
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
                    { title: "Apply To" },
                    { title: "Gift Type" },
                    { title: "Gift Details" },
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
                            {offer.discountTitle || offer.title}
                          </Text>
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          <Box maxWidth="250px" title={getAppliedTo(offer)}>
                            <Text as="span" truncate>
                              {getAppliedTo(offer)}
                            </Text>
                          </Box>
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          <Badge tone="info">
                            {offer.giftMode === "PRODUCT_GIFT"
                              ? "Product Gift"
                              : "Shipping Discount"}
                          </Badge>
                        </IndexTable.Cell>

                        <IndexTable.Cell>
                          {getGiftDetails(offer)}
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
                                openDeleteModal(
                                  offer.id,
                                  offer.discountTitle || offer.title,
                                )
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
