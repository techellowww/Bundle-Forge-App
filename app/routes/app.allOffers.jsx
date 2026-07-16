import { useState, useMemo } from "react";
import { useLoaderData, useNavigate, useRevalidator, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import {
  Page,
  Layout,
  Card,
  Badge,
  Button,
  ButtonGroup,
  Modal,
  IndexTable,
  Text,
  InlineStack,
  BlockStack,
  EmptyState,
  Box,
  Tabs,
  TextField,
  Icon,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { getStatusColor, formatDate } from "../offer.utils.js";

const TYPE_CONFIG = {
  quantityBreak: {
    label: "Quantity Break",
    badgeTone: "info",
    editRoute: (id) => `/app/quantityBreak?id=${id}`,
    deleteEndpoint: "/api/delete-quantity-discount",
    appliedTo: (o) =>
      o.applyTo === "selectedProducts"
        ? o.products
            ?.filter((p) => !p.isExcluded)
            .map((p) => p.title)
            .join(", ") || "Selected products"
        : o.applyTo === "excludeProducts"
          ? "All products (with exclusions)"
          : "All products",
  },
  bxgy: {
    label: "Buy X Get Y",
    badgeTone: "attention",
    editRoute: (id) => `/app/buyXgetY?id=${id}`,
    deleteEndpoint: "/api/delete-bxgy-offer",
    appliedTo: (o) =>
      o.products?.length
        ? o.products.map((p) => p.title).join(", ")
        : o.vendors?.length
          ? o.vendors.map((v) => v.vendor).join(", ")
          : "All products",
  },
  fixedBundle: {
    label: "Fixed Bundle",
    badgeTone: "success",
    editRoute: (id) => `/app/fixed-bundle?id=${id}`,
    deleteEndpoint: "/api/fixed-bundle",
    appliedTo: (o) => o.products?.map((p) => p.title).join(", ") || "—",
  },
  fbt: {
    label: "Frequently Bought Together",
    badgeTone: "magic",
    editRoute: (id) => `/app/fbt?id=${id}`,
    deleteEndpoint: "/api/fbt-offers",
    appliedTo: (o) =>
      o.triggerProducts?.length
        ? o.triggerProducts.map((p) => p.title).join(", ")
        : "All products",
  },
};

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  const shop = await prisma.shop.findUnique({
    where: { domain: session.shop },
  });

  if (!shop) return { offers: [] };

  const [quantityBreaks, bxgy, fixedBundles, fbt] = await Promise.all([
    prisma.quantityBreakOffer.findMany({
      where: { shopId: shop.id },
      include: { products: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.bxgyOffer.findMany({
      where: { shopId: shop.id },
      include: { products: true, vendors: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.fixedBundleOffer.findMany({
      where: { shopId: shop.id },
      include: { products: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.frequentlyBoughtOffer.findMany({
      where: { shopId: shop.id },
      include: { triggerProducts: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const normalize = (rows, type) =>
    rows.map((o) => ({
      id: o.id,
      type,
      title: o.discountTitle || o.title,
      status: o.status,
      startDate: o.startDate,
      endDate: o.endDate,
      appliedTo: TYPE_CONFIG[type].appliedTo(o),
    }));

  const offers = [
    ...normalize(quantityBreaks, "quantityBreak"),
    ...normalize(bxgy, "bxgy"),
    ...normalize(fixedBundles, "fixedBundle"),
    ...normalize(fbt, "fbt"),
  ].sort((a, b) => new Date(b.startDate ?? 0) - new Date(a.startDate ?? 0));

  return { offers };
}

const TABS = [
  { id: "all", content: "All" },
  { id: "quantityBreak", content: "Quantity Break" },
  { id: "bxgy", content: "Buy X Get Y" },
  { id: "fixedBundle", content: "Fixed Bundle" },
  { id: "fbt", content: "Frequently Bought Together" },
];

export default function AllOffers() {
  const { offers } = useLoaderData();
  const navigate = useNavigate();
  const revalidator = useRevalidator();

  const [selectedTab, setSelectedTab] = useState(0);
  const [query, setQuery] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    id: null,
    type: null,
    title: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const activeType = TABS[selectedTab].id;

  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      const matchesType = activeType === "all" || o.type === activeType;
      const matchesQuery = o.title.toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesQuery;
    });
  }, [offers, activeType, query]);

  const openDeleteModal = (offer) =>
    setDeleteModal({
      open: true,
      id: offer.id,
      type: offer.type,
      title: offer.title,
    });
  const closeDeleteModal = () =>
    setDeleteModal({ open: false, id: null, type: null, title: "" });

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const { deleteEndpoint } = TYPE_CONFIG[deleteModal.type];

    try {
      const res = await fetch(deleteEndpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteModal.id }),
      });
      const data = await res.json();

      if (data.success) {
        shopify.toast.show("Offer deleted");
        closeDeleteModal();
        revalidator.revalidate();
      } else {
        shopify.toast.show(data.error || "Failed to delete offer", {
          isError: true,
        });
      }
    } catch {
      shopify.toast.show("Something went wrong", { isError: true });
    } finally {
      setIsDeleting(false);
    }
  };

  const rowMarkup = filteredOffers.map((offer, index) => {
    const config = TYPE_CONFIG[offer.type];
    return (
      <IndexTable.Row
        id={offer.id}
        key={`${offer.type}-${offer.id}`}
        position={index}
      >
        <IndexTable.Cell>
          <Text as="span" fontWeight="semibold">
            {offer.title}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={config.badgeTone}>{config.label}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Box maxWidth="240px" title={offer.appliedTo}>
            <Text as="span" truncate>
              {offer.appliedTo}
            </Text>
          </Box>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Badge tone={getStatusColor(offer.status)}>{offer.status}</Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>{formatDate(offer.startDate)}</IndexTable.Cell>
        <IndexTable.Cell>{formatDate(offer.endDate)}</IndexTable.Cell>
        <IndexTable.Cell>
          <ButtonGroup>
            <Button
              size="slim"
              onClick={() => navigate(config.editRoute(offer.id))}
            >
              Edit
            </Button>
            <Button
              size="slim"
              tone="critical"
              onClick={() => openDeleteModal(offer)}
            >
              Delete
            </Button>
          </ButtonGroup>
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <Page 
      backAction={{ content: 'Dashboard', onAction: () => navigate('/app') }}
      title="All Offers" 
      subtitle="Manage every offer type from one place"
    >
      <Layout>
        <Layout.Section>
          <Card padding="0">
            <Tabs
              tabs={TABS}
              selected={selectedTab}
              onSelect={setSelectedTab}
            />
            <Box padding="400" paddingBlockEnd="0">
              <TextField
                labelHidden
                label="Search offers"
                placeholder="Search by title"
                value={query}
                onChange={setQuery}
                prefix={<Icon source={SearchIcon} />}
                autoComplete="off"
                clearButton
                onClearButtonClick={() => setQuery("")}
              />
            </Box>

            <Box padding="400">
              {filteredOffers.length === 0 ? (
                <EmptyState
                  heading={
                    offers.length === 0
                      ? "No offers yet"
                      : "No offers match your search"
                  }
                  image=""
                >
                  <p>
                    {offers.length === 0
                      ? "Create your first offer to see it here."
                      : "Try a different search term or tab."}
                  </p>
                </EmptyState>
              ) : (
                <IndexTable
                  resourceName={{ singular: "offer", plural: "offers" }}
                  itemCount={filteredOffers.length}
                  selectable={false}
                  headings={[
                    { title: "Title" },
                    { title: "Type" },
                    { title: "Applied To" },
                    { title: "Status" },
                    { title: "Start Date" },
                    { title: "End Date" },
                    { title: "Actions" },
                  ]}
                >
                  {rowMarkup}
                </IndexTable>
              )}
            </Box>
          </Card>
        </Layout.Section>
      </Layout>

      <Modal
        open={deleteModal.open}
        onClose={closeDeleteModal}
        title="Delete Offer"
        primaryAction={{
          content: "Delete",
          tone: "critical",
          loading: isDeleting,
          onAction: handleConfirmDelete,
        }}
        secondaryActions={[{ content: "Cancel", onAction: closeDeleteModal }]}
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
