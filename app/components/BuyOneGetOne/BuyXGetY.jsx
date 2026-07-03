import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  List,
  Box,
  Button,
} from "@shopify/polaris";
import OfferInfo from "./OfferInfo";
import OfferMain from "./OfferMain";
import GiftSection from "./GiftSection";

const BuyXGetY = ({ offer = null }) => {
  const navigate = useNavigate();
  const isEditing = !!offer;

  // Basic info
  const [title, setTitle] = useState(offer?.title ?? "Buy More Save More");
  const [discountTitle, setDiscountTitle] = useState(
    offer?.discountTitle ?? "BXGY (Buy X get Y)",
  );
  const [startDate, setStartDate] = useState(
    offer?.startDate
      ? new Date(offer.startDate).toISOString().split("T")[0]
      : "",
  );
  const [endDate, setEndDate] = useState(
    offer?.endDate ? new Date(offer.endDate).toISOString().split("T")[0] : "",
  );

  // Offer condition
  const [applyTo, setApplyTo] = useState(offer?.applyTo ?? "selectedProducts");
  const [requiredQuantity, setRequiredQuantity] = useState(
    offer?.requiredQuantity ?? 1,
  );
  const [trackBy, setTrackBy] = useState(offer?.trackBy ?? "PRODUCT");
  const [sameAsGift, setSameAsGift] = useState(offer?.sameAsGift ?? false);
  const [selectedProducts, setSelectedProducts] = useState(
    offer?.products?.filter((p) => !p.isExcluded) || [],
  );

  const [excludedProducts, setExcludedProducts] = useState(
    offer?.products?.filter((p) => p.isExcluded) || [],
  );

  const [selectedVendors, setSelectedVendors] = useState(
    offer?.vendors?.map((v) => v.vendor) || [],
  );

  const [selectedTypes, setSelectedTypes] = useState(
    offer?.productTypes?.map((t) => t.productType) || [],
  );

  const [selectedCollections, setSelectedCollections] = useState(
    offer?.collections || [],
  );
  const [status, setStatus] = useState(offer?.status ?? "active");

  // Gift mode — map UI values to backend enum values
  const [selectedGiftMode, setSelectedGiftMode] = useState(
    offer?.giftMode === "SHIPPING_DISCOUNT"
      ? "shippingDiscount"
      : "productGift",
  );
  const giftMode =
    selectedGiftMode === "productGift" ? "PRODUCT_GIFT" : "SHIPPING_DISCOUNT";

  // Product gift
  const [giftDiscountType, setGiftDiscountType] = useState(
    offer?.productGift?.discountType || "free",
  );

  const [giftValue, setGiftValue] = useState(
    offer?.productGift?.discountValue || "",
  );

  const [giftQuantity, setGiftQuantity] = useState(
    offer?.productGift?.giftQuantity || "1",
  );

  const [giftProducts, setGiftProducts] = useState(
    offer?.productGift?.giftProducts || [],
  );

  // Shipping gift
  const [shippingDiscountType, setShippingDiscountType] = useState(
    offer?.shippingGift?.discountType || "percentage",
  );

  const [shippingDiscountValue, setShippingDiscountValue] = useState(
    offer?.shippingGift?.discountValue || "10",
  );

  const [enableFreeShipping, setEnableFreeShipping] = useState(
    offer?.shippingGift?.enableFreeShipping || false,
  );

  const [freeShippingProductName, setFreeShippingProductName] = useState(
    offer?.shippingGift?.freeShippingLabel || "",
  );

  const resolveProductId = (p) => (p.productId ? p.productId : extractId(p.id));

  const extractId = (gid) =>
    gid && gid.includes("/") ? gid.split("/").pop() : gid;

  const saveOffer = async () => {
    try {
      if (!title?.trim()) {
        shopify.toast.show("Offer title is required", { isError: true });
        return;
      }
      if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
        shopify.toast.show("End date cannot be before start date", {
          isError: true,
        });
        return;
      }
      if (giftMode === "PRODUCT_GIFT" && !giftProducts?.length) {
        shopify.toast.show("Please select at least one gift product", {
          isError: true,
        });
        return;
      }

      const payload = {
        ...(isEditing && { id: offer.id }),
        title: title.trim(),
        discountTitle: discountTitle?.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
        applyTo,
        requiredQuantity: Number(requiredQuantity) || 1,
        trackBy,
        sameAsGift,
        giftMode,
        status,
        products: [
          ...(selectedProducts || []).map((p) => ({
            productId: resolveProductId(p),
            title: p.title,
            isExcluded: false,
          })),
          ...(excludedProducts || []).map((p) => ({
            productId: resolveProductId(p),
            title: p.title,
            isExcluded: true,
          })),
        ],
        vendors: (selectedVendors || []).map((vendor) => ({ vendor })),
        productTypes: (selectedTypes || []).map((productType) => ({
          productType,
        })),
        collections: (selectedCollections || []).map((c) => ({
          collectionId: c.collectionId ? c.collectionId : extractId(c.id),
          title: c.title,
        })),
        productGift:
          giftMode === "PRODUCT_GIFT"
            ? {
                discountType: giftDiscountType,
                discountValue:
                  giftDiscountType === "free" ? null : Number(giftValue),
                giftQuantity: Number(giftQuantity) || 1,
                giftProducts: (giftProducts || []).map((p) => ({
                  productId: resolveProductId(p),
                  title: p.title,
                })),
              }
            : null,
        shippingGift:
          giftMode === "SHIPPING_DISCOUNT"
            ? {
                discountType: shippingDiscountType,
                discountValue: enableFreeShipping
                  ? null
                  : Number(shippingDiscountValue),
                enableFreeShipping: Boolean(enableFreeShipping),
                freeShippingLabel: freeShippingProductName?.trim() || null,
              }
            : null,
      };

      const res = await fetch("/api/bxgy-offers", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save offer");
      }

      shopify.toast.show(
        isEditing
          ? "Offer updated successfully!"
          : "Offer created successfully!",
        { duration: 3000 },
      );
      navigate("/app/bxgy-list");
    } catch (err) {
      console.error("Save failed:", err);
      shopify.toast.show(err.message || "Failed to save offer", {
        isError: true,
      });
    }
  };

  return (
    <Page
      title={isEditing ? "Edit BXGY Offer" : "Create BXGY Offer"}
      backAction={{ onAction: () => navigate("/app/bxgy-list") }}
      primaryAction={{
        content: isEditing ? "Update Offer" : "Save Offer",
        onAction: saveOffer,
      }}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <OfferInfo
                title={title}
                setTitle={setTitle}
                discountTitle={discountTitle}
                setDiscountTitle={setDiscountTitle}
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
              />
            </Card>

            <Card>
              <OfferMain
                applyTo={applyTo}
                setApplyTo={setApplyTo}
                status={status}
                setStatus={setStatus}
                requiredQuantity={requiredQuantity}
                setRequiredQuantity={setRequiredQuantity}
                trackBy={trackBy}
                setTrackBy={setTrackBy}
                sameAsGift={sameAsGift}
                setSameAsGift={setSameAsGift}
                selectedProducts={selectedProducts}
                setSelectedProducts={setSelectedProducts}
                excludedProducts={excludedProducts}
                setExcludedProducts={setExcludedProducts}
                selectedVendors={selectedVendors}
                setSelectedVendors={setSelectedVendors}
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
                selectedCollections={selectedCollections}
                setSelectedCollections={setSelectedCollections}
              />
            </Card>

            <Card>
              <GiftSection
                selectedGiftMode={selectedGiftMode}
                setSelectedGiftMode={setSelectedGiftMode}
                giftDiscountType={giftDiscountType}
                setGiftDiscountType={setGiftDiscountType}
                giftValue={giftValue}
                setGiftValue={setGiftValue}
                giftQuantity={giftQuantity}
                setGiftQuantity={setGiftQuantity}
                giftProducts={giftProducts}
                setGiftProducts={setGiftProducts}
                shippingDiscountType={shippingDiscountType}
                setShippingDiscountType={setShippingDiscountType}
                shippingDiscountValue={shippingDiscountValue}
                setShippingDiscountValue={setShippingDiscountValue}
                enableFreeShipping={enableFreeShipping}
                setEnableFreeShipping={setEnableFreeShipping}
                freeShippingProductName={freeShippingProductName}
                setFreeShippingProductName={setFreeShippingProductName}
              />
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingMd">
                Summary
              </Text>
              <List type="bullet">
                <List.Item>
                  Applies to: {applyTo.replace(/([A-Z])/g, " $1").trim()}
                </List.Item>
                <List.Item>
                  {selectedProducts.length} products selected
                </List.Item>
                <List.Item>{selectedVendors.length} vendors</List.Item>
                <List.Item>{selectedCollections.length} collections</List.Item>
                <List.Item>{startDate || "No start date"}</List.Item>
              </List>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>

      <Box paddingBlockStart="400">
        <Button variant="primary" onClick={saveOffer}>
          {isEditing ? "Update Offer" : "Save Offer"}
        </Button>
      </Box>
    </Page>
  );
};

export default BuyXGetY;
