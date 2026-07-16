/**
 * /app/routes/app.fbt-list.jsx
 */

import { useLoaderData, useNavigate, useRevalidator, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import { formatDate } from "../offer.utils.js";
import { useState } from "react";
import {
  Page,
  Layout,
  Card,
  Button,
  ButtonGroup,
  Badge,
  IndexTable,
  Text,
  EmptyState,
  Box,
  BlockStack,
  InlineStack
} from "@shopify/polaris";

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
    <Page
      backAction={{ content: 'Dashboard', onAction: () => navigate('/app') }}
      title="Frequently Bought Together"
      primaryAction={{
        content: "Create FBT Offer",
        onAction: () => navigate("/app/fbt"),
      }}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              {offers.length === 0 ? (
                <EmptyState
                  heading="No offers yet"
                  action={{
                    content: "Create FBT Offer",
                    onAction: () => navigate("/app/fbt"),
                  }}
                  image=""
                >
                  <p>Create your first Frequently Bought Together offer to increase AOV.</p>
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
                    { title: "Trigger products" },
                    { title: "Bundled products" },
                    { title: "Discount" },
                    { title: "Status" },
                    { title: "Start date" },
                    { title: "End date" },
                    { title: "Actions" },
                  ]}
                >
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
                          <Box maxWidth="250px" title={triggers}>
                            <Text as="span" tone="subdued" truncate>
                              {triggers}
                            </Text>
                          </Box>
                        </IndexTable.Cell>
                        <IndexTable.Cell>{bundled}</IndexTable.Cell>
                        <IndexTable.Cell>{discountLabel}</IndexTable.Cell>
                        <IndexTable.Cell>
                          <Badge tone={tone}>{offer.status}</Badge>
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
                              onClick={() => navigate(`/app/fbt?id=${offer.id}`)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="slim"
                              onClick={() => handleToggleStatus(offer)}
                              loading={toggling === offer.id}
                            >
                              {offer.status === "ACTIVE" ? "Pause" : "Activate"}
                            </Button>
                            <Button
                              size="slim"
                              tone="critical"
                              onClick={() => handleDelete(offer.id)}
                              loading={deleting === offer.id}
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
    </Page>
  );
}

export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
