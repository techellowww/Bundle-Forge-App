import { useState, useMemo, useRef, useEffect } from "react";
import { useLoaderData, useNavigate, useRevalidator, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
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
      updatedAt: o.updatedAt,
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

  const activeOffersCount = useMemo(() => offers.filter(o => o.status === 'ACTIVE').length, [offers]);

  const latestOfferDate = useMemo(() => {
    if (!offers.length) return null;
    const sorted = [...offers].sort((a, b) => new Date(b.updatedAt || b.startDate || 0) - new Date(a.updatedAt || a.startDate || 0));
    return sorted[0].updatedAt || sorted[0].startDate;
  }, [offers]);

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

  const handleDuplicate = (offer) => {
    // Currently, there is no duplicate API endpoint.
    // Display a toast for now to prevent app logic changes while still rendering the button.
    shopify.toast.show("Duplicate functionality coming soon!", { isError: false });
  };

  return (
    <>
      <ui-title-bar title="Dashboard">
      </ui-title-bar>
      <s-page>
        
        {/* Dashboard Sections Grid */}
        <s-box paddingBlockEnd="large">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            
            {/* Metrics Card */}
            <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
              <s-stack direction="block" gap="base">
                <s-text as="h2" variant="headingMd">Metrics</s-text>
                <s-stack direction="inline" gap="large" justifyContent="start">
                  <s-stack direction="block" gap="0">
                    <s-text as="p" variant="bodyMd" tone="subdued">Total Offers</s-text>
                    <s-text as="p" variant="headingLg">{offers.length}</s-text>
                  </s-stack>
                  <s-stack direction="block" gap="0">
                    <s-text as="p" variant="bodyMd" tone="subdued">Active Offers</s-text>
                    <s-text as="p" variant="headingLg" tone="success">{activeOffersCount}</s-text>
                  </s-stack>
                </s-stack>
                {latestOfferDate && (
                  <s-text as="p" variant="bodySm" tone="subdued">
                    Recent Activity: Last offer updated {formatDate(latestOfferDate)}
                  </s-text>
                )}
              </s-stack>
            </s-box>

            {/* Quick Actions Card */}
            <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
              <s-stack direction="block" gap="base">
                <s-text as="h2" variant="headingMd">Quick Actions</s-text>
                <s-text as="p" variant="bodySm" tone="subdued">Create a new offer to boost your sales.</s-text>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <s-button onClick={() => navigate('/app/quantityBreak')}>Quantity Break</s-button>
                  <s-button onClick={() => navigate('/app/buyXgetY')}>Buy X Get Y</s-button>
                  <s-button onClick={() => navigate('/app/fixed-bundle')}>Fixed Bundle</s-button>
                  <s-button onClick={() => navigate('/app/fbt')}>FBT Offer</s-button>
                </div>
              </s-stack>
            </s-box>

            {/* Getting Started / Support Card */}
            <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
              <s-stack direction="block" gap="base">
                <s-text as="h2" variant="headingMd">Getting Started & Support</s-text>
                <s-text as="p" variant="bodySm" tone="subdued">
                  Need help setting up your first offer? Check out our guides or reach out to support.
                </s-text>
                <s-stack direction="inline" gap="small-200">
                  <s-button onClick={() => navigate('/app/helpSupport')}>Help & Support</s-button>
                </s-stack>
              </s-stack>
            </s-box>

          </div>
        </s-box>

        {/* Offers List Section */}
        <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
          <s-stack direction="block" gap="large">
            <s-stack direction="inline" gap="small-200" alignItems="center">
              <s-text as="h2" variant="headingLg">Offers</s-text>
            </s-stack>

            <s-stack direction="inline" gap="small-200">
              {TABS.map((tab, idx) => (
                <s-button 
                  key={tab.id} 
                  onClick={() => setSelectedTab(idx)}
                  variant={selectedTab === idx ? "primary" : "tertiary"}
                >
                  {tab.content}
                </s-button>
              ))}
            </s-stack>

            <s-box paddingBlockStart="small-200" paddingBlockEnd="0">
              <s-text-field
                label="Search offers"
                placeholder="Search by title"
                value={query}
                onInput={(e) => setQuery(e.target.value)}
                clearButton
                onClearButtonClick={() => setQuery("")}
              />
            </s-box>

            <s-box paddingBlockStart="base">
              {filteredOffers.length === 0 ? (
                <s-stack direction="block" gap="base" alignItems="center">
                  <s-box padding="800">
                    <s-stack direction="block" gap="base" alignItems="center">
                      <s-text as="h2" variant="headingMd">
                        {offers.length === 0 ? "No offers yet" : "No offers match your search"}
                      </s-text>
                      <s-text as="p" tone="subdued">
                        {offers.length === 0
                          ? "Create your first offer using the quick actions above."
                          : "Try a different search term or tab."}
                      </s-text>
                    </s-stack>
                  </s-box>
                </s-stack>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e1e3e5' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Title</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Type</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Start Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>End Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOffers.map((offer) => {
                        const config = TYPE_CONFIG[offer.type];
                        return (
                          <tr key={`${offer.type}-${offer.id}`} style={{ borderBottom: '1px solid #e1e3e5' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <s-stack direction="block" gap="0">
                                <s-text as="span" fontWeight="semibold">
                                  {offer.title}
                                </s-text>
                                {offer.updatedAt && (
                                  <s-text as="span" variant="bodyXs" tone="subdued">
                                    Updated: {formatDate(offer.updatedAt)}
                                  </s-text>
                                )}
                              </s-stack>
                            </td>
                            
                            <td style={{ padding: '12px 16px' }}>
                              <s-badge tone={config.badgeTone}>{config.label}</s-badge>
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <s-badge tone={getStatusColor(offer.status)}>{offer.status}</s-badge>
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <s-text as="span">{formatDate(offer.startDate)}</s-text>
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <s-text as="span">{formatDate(offer.endDate)}</s-text>
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <s-stack direction="inline" gap="small-200">
                                <s-button size="slim" onClick={() => navigate(config.editRoute(offer.id))}>
                                  Edit
                                </s-button>
                                <s-button size="slim" onClick={() => handleDuplicate(offer)}>
                                  Duplicate
                                </s-button>
                                <s-button size="slim" tone="critical" onClick={() => openDeleteModal(offer)}>
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
            </s-box>
          </s-stack>
        </s-box>

        <CustomModal
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
