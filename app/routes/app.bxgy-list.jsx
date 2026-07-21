import prisma from "../db.server";
import { authenticate } from "../shopify.server";
import { useLoaderData, useNavigate, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { useState } from "react";
import { useRef, useEffect } from "react";
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
    <>
    <ui-title-bar title="Buy X Get Y Offers">
      <button variant="breadcrumb" onClick={() => navigate('/app')}>
        Dashboard
      </button>
      <button variant="primary" onClick={() => navigate('/app/buyXgetY')}>
        Create Offer
      </button>
    </ui-title-bar>
    <s-page>
      
          <s-box padding="large" background="bg-surface" borderRadius="200" shadow="100">
            <s-stack direction="block" gap="base">
              <s-stack direction="inline" justifyContent="space-between">
                <s-text variant="bodyMd" tone="subdued">
                  {offers.length} offer{offers.length !== 1 ? "s" : ""}
                </s-text>
              </s-stack>

              {offers.length === 0 ? (
                <s-stack direction="block" gap="base" alignItems="center">
                  <s-text as="h2" variant="headingMd">No Buy X Get Y offers</s-text>
                  <s-text as="p" tone="subdued">Create your first Buy X Get Y offer.</s-text>
                  <s-button onClick={() => navigate("/app/buyXgetY")}>Create Offer</s-button>
                </s-stack>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e1e3e5' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Title</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Apply To</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Gift Type</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Gift Details</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Start Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>End Date</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offers.map((offer, index) => {
                        const status = getOfferStatus(offer);
                        const statusColor = getStatusColor(status);

                        return (
                          <tr key={offer.id} style={{ borderBottom: '1px solid #e1e3e5' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <s-text as="span" fontWeight="semibold">
                                {offer.discountTitle || offer.title}
                              </s-text>
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <s-box maxWidth="250px" title={getAppliedTo(offer)}>
                                <s-text as="span" truncate="true">
                                  {getAppliedTo(offer)}
                                </s-text>
                              </s-box>
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <s-badge tone="info">
                                {offer.giftMode === "PRODUCT_GIFT"
                                  ? "Product Gift"
                                  : "Shipping Discount"}
                              </s-badge>
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              {getGiftDetails(offer)}
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <s-badge tone={statusColor}>{status}</s-badge>
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              {formatDate(offer.startDate)}
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              {formatDate(offer.endDate)}
                            </td>

                            <td style={{ padding: '12px 16px' }}>
                              <s-stack direction="inline" gap="small-200">
                                <s-button size="slim" onClick={() => handleEdit(offer.id)}>
                                  Edit
                                </s-button>

                                <s-button size="slim" tone="critical" onClick={() =>
                                    openDeleteModal(
                                      offer.id,
                                      offer.discountTitle || offer.title,
                                    )
                                  }>
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
