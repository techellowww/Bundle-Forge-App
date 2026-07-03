/**
 * /app/components/Fbt/UpsellFbt.jsx
 */

import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  Select,
  Button,
  Badge,
  Box,
} from "@shopify/polaris";
import UpsellInfo from "./UpsellInfo";
import UpsellTrigger from "./UpsellTrigger";
import Method from "./Method";
import Discount from "./Discount";

const extractId = (gid = "") =>
  gid.includes("/") ? gid.split("/").pop() : gid;

const APPLY_TO_LABEL = {
  alwaysDisplay: "Always display",
  excludeProducts: "All except selected products",
  selectedProducts: "Selected products only",
  exceptSelectedVendorTypeCollection:
    "Except selected vendors/types/collections",
  productsInSelectedVendorTypeCollection: "Selected vendors/types/collections",
};

function SummaryRow({ label, value }) {
  return (
    <InlineStack align="space-between" blockAlign="start" wrap={false}>
      <Text as="span" variant="bodySm" tone="subdued">
        {label}
      </Text>
      <Box maxWidth="55%">
        <Text as="span" variant="bodySm" fontWeight="medium" alignment="end">
          {value}
        </Text>
      </Box>
    </InlineStack>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: "success",
    inactive: "warning",
  };
  return (
    <Badge tone={map[status] ?? "default"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function OfferSummary({
  title,
  applyTo,
  selectedProducts,
  bundledProducts,
  selectedGiftMode,
  discountType,
  discountValue,
  startDate,
  endDate,
  status,
}) {
  const discountLabel =
    discountType === "free"
      ? "Free item"
      : discountType === "percentage"
        ? `${discountValue || 0}% off`
        : discountType === "amount"
          ? `$${discountValue || 0} off`
          : "None";

  return (
    <Card padding="500">
      <BlockStack gap="400">
        <Text as="h2" variant="headingMd">
          Summary
        </Text>
        <BlockStack gap="200">
          <SummaryRow label="Title" value={title || "—"} />
          <SummaryRow
            label="Apply to"
            value={APPLY_TO_LABEL[applyTo] ?? applyTo}
          />
          <SummaryRow
            label="Triggers"
            value={
              selectedProducts.length
                ? `${selectedProducts.length} product${selectedProducts.length !== 1 ? "s" : ""}`
                : "All products"
            }
          />
          <SummaryRow
            label="Bundled"
            value={`${bundledProducts.length} product${bundledProducts.length !== 1 ? "s" : ""}`}
          />
          <SummaryRow
            label="Method"
            value={selectedGiftMode === "manual" ? "Manual" : "Random"}
          />
          <SummaryRow label="Discount" value={discountLabel} />
          <SummaryRow label="Starts" value={startDate || "Immediately"} />
          <SummaryRow label="Ends" value={endDate || "No end date"} />
        </BlockStack>
        <Box paddingBlockStart="200">
          <StatusBadge status={status} />
        </Box>
      </BlockStack>
    </Card>
  );
}

export default function UpsellFbt({ offer }) {
  const navigate = useNavigate();
  const isEditing = !!offer;
  const [saving, setSaving] = useState(false);

  // Basic info
  const [title, setTitle] = useState(
    offer?.title ?? "Frequently Bought Together #1",
  );
  const [discountTitle, setDiscountTitle] = useState(
    offer?.discountTitle ?? "Frequently bought together",
  );
  const [discountDescription, setDiscountDescription] = useState(
    offer?.discountDescription ?? "Purchase and save up to 20%",
  );
  const [startDate, setStartDate] = useState(
    offer?.startDate
      ? new Date(offer.startDate).toISOString().split("T")[0]
      : "",
  );
  const [endDate, setEndDate] = useState(
    offer?.endDate ? new Date(offer.endDate).toISOString().split("T")[0] : "",
  );
  const [status, setStatus] = useState(offer?.status ?? "active");

  // Trigger
  const [applyTo, setApplyTo] = useState(offer?.applyTo ?? "allProducts");
  const [selectedProducts, setSelectedProducts] = useState(
    offer?.triggerProducts?.map((p) => ({
      id: `gid://shopify/Product/${p.productId}`,
      title: p.title,
    })) ?? [],
  );
  const [excludedProducts, setExcludedProducts] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);

  // Method
  const [selectedGiftMode, setSelectedGiftMode] = useState("manual");
  const [bundledProducts, setBundledProducts] = useState(
    offer?.bundledProducts?.map((p) => ({
      id: `gid://shopify/Product/${p.productId}`,
      title: p.title,
    })) ?? [],
  );
  const [randomCount, setRandomCount] = useState(3);
  const [randomSourceType, setRandomSourceType] = useState("selectedType");
  const [randomSourceValue, setRandomSourceValue] = useState("");

  // Discount
  const [discountType, setDiscountType] = useState(
    offer?.discountType ?? "percentage",
  );
  const [discountValue, setDiscountValue] = useState(
    offer?.discountValue ?? "",
  );

  const saveOffer = async () => {
    if (!title.trim()) {
      shopify.toast.show("Title is required", { isError: true });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...(isEditing && { id: offer.id }),
        title: title.trim(),
        discountTitle: discountTitle?.trim() || null,
        discountDescription: discountDescription?.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
        applyTo,
        status,
        discountType: selectedGiftMode === "manual" ? discountType : null,
        discountValue:
          selectedGiftMode === "manual" && discountValue
            ? Number(discountValue)
            : null,
        triggerProducts: selectedProducts.map((p) => ({
          productId: extractId(p.id),
          title: p.title,
        })),
        bundledProducts: bundledProducts.map((p, i) => ({
          productId: extractId(p.id),
          title: p.title,
          position: i,
        })),
      };

      const res = await fetch("/api/fbt-offers", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.error || "Save failed");

      shopify.toast.show(isEditing ? "Offer updated!" : "Offer created!", {
        duration: 3000,
      });
      navigate("/app/fbt-list");
    } catch (err) {
      shopify.toast.show(err.message || "Failed to save offer", {
        isError: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  return (
    <Page
      title={isEditing ? "Edit FBT Offer" : "Create FBT Offer"}
      backAction={{ onAction: () => navigate("/app/fbt-list") }}
      primaryAction={{
        content: saving ? "Saving…" : isEditing ? "Update Offer" : "Save Offer",
        onAction: saveOffer,
        loading: saving,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: () => navigate("/app/fbt-list"),
        },
      ]}
    >
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <UpsellInfo
              title={title}
              setTitle={setTitle}
              discountTitle={discountTitle}
              setDiscountTitle={setDiscountTitle}
              discountDescription={discountDescription}
              setDiscountDescription={setDiscountDescription}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />
            <UpsellTrigger
              applyTo={applyTo}
              setApplyTo={setApplyTo}
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
            <Method
              selectedGiftMode={selectedGiftMode}
              setSelectedGiftMode={setSelectedGiftMode}
              bundledProducts={bundledProducts}
              setBundledProducts={setBundledProducts}
              randomCount={randomCount}
              setRandomCount={setRandomCount}
              randomSourceType={randomSourceType}
              setRandomSourceType={setRandomSourceType}
              randomSourceValue={randomSourceValue}
              setRandomSourceValue={setRandomSourceValue}
            />
            <Discount
              discountType={discountType}
              setDiscountType={setDiscountType}
              discountValue={discountValue}
              setDiscountValue={setDiscountValue}
            />
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <OfferSummary
              title={title}
              applyTo={applyTo}
              selectedProducts={selectedProducts}
              bundledProducts={bundledProducts}
              selectedGiftMode={selectedGiftMode}
              discountType={discountType}
              discountValue={discountValue}
              startDate={startDate}
              endDate={endDate}
              status={status}
            />
            <Card padding="500">
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Offer status
                </Text>
                <Select
                  label="Status"
                  value={status}
                  options={statusOptions}
                  onChange={(value) => setStatus(value)}
                />
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      <Box paddingBlockStart="400">
        <InlineStack gap="200">
          <Button variant="primary" onClick={saveOffer} loading={saving}>
            {saving ? "Saving…" : isEditing ? "Update Offer" : "Save Offer"}
          </Button>
          <Button onClick={() => navigate("/app/fbt-list")}>Cancel</Button>
        </InlineStack>
      </Box>
    </Page>
  );
}
