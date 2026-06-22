/**
 * /app/components/Fbt/UpsellFbt.jsx
 */

import { useState } from "react";
import { useNavigate } from "react-router";
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
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: "13px",
        borderBottom: "1px solid #f1f2f3",
        paddingBottom: "6px",
      }}
    >
      <span style={{ color: "#6d7175" }}>{label}</span>
      <span
        style={{
          color: "#202223",
          fontWeight: 500,
          maxWidth: "55%",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    ACTIVE: ["#d4edda", "#00a651"],
    PAUSED: ["#fff3cd", "#f5a623"],
    DRAFT: ["#f1f2f3", "#8c9196"],
  };
  const [bg, color] = map[status] ?? map.DRAFT;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        color,
        borderRadius: 20,
        padding: "3px 12px",
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
        }}
      />
      {status}
    </span>
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
    <s-card padding="large">
      <s-stack direction="block" gap="base">
        <s-heading>Summary</s-heading>
        <s-stack direction="block" gap="small">
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
        </s-stack>
        <div style={{ marginTop: "8px" }}>
          <StatusBadge status={status} />
        </div>
      </s-stack>
    </s-card>
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
  const [status, setStatus] = useState(offer?.status ?? "ACTIVE");

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

  return (
    <s-page>
      <s-grid gridTemplateColumns="2fr 1fr" gap="large">
        <s-stack direction="block" gap="large">
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
        </s-stack>

        <s-stack direction="block" gap="large">
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
          <s-card padding="large">
            <s-stack direction="block" gap="base">
              <s-heading>Offer status</s-heading>
              <s-select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <s-option value="ACTIVE">Active</s-option>
                <s-option value="PAUSED">Paused</s-option>
                <s-option value="DRAFT">Draft</s-option>
              </s-select>
            </s-stack>
          </s-card>
        </s-stack>
      </s-grid>

      <s-box paddingBlockStart="400">
        <s-stack direction="inline" gap="small">
          <s-button variant="primary" onClick={saveOffer} disabled={saving}>
            {saving ? "Saving…" : isEditing ? "Update Offer" : "Save Offer"}
          </s-button>
          <s-button onClick={() => navigate("/app/fbt-list")}>Cancel</s-button>
        </s-stack>
      </s-box>
    </s-page>
  );
}
