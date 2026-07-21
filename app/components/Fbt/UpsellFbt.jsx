import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useRef } from "react";


const Chip = ({ children, onRemove }) => {
  const ref = useRef(null);
  
  useEffect(() => {
    const el = ref.current;
    if (!el || !onRemove) return;
    const handler = () => onRemove();
    el.addEventListener("remove", handler);
    return () => el.removeEventListener("remove", handler);
  }, [onRemove]);

  return (
    <s-clickable-chip ref={ref} removable={!!onRemove}>
      {children}
    </s-clickable-chip>
  );
};

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

const MultiSelectField = ({
  label,
  placeholder,
  options = [],
  selected,
  onAdd,
  onRemove,
  loading = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [autocompleteOptions, setAutocompleteOptions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setAutocompleteOptions(options.map((opt) => ({ value: opt, label: opt })));
  }, [options]);

  const updateText = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (value === "") {
      setAutocompleteOptions(
        options.map((opt) => ({ value: opt, label: opt }))
      );
      return;
    }
    const filtered = options
      .filter((opt) => opt.toLowerCase().includes(value.toLowerCase()))
      .map((opt) => ({ value: opt, label: opt }));
    setAutocompleteOptions(filtered);
  };

  const handleSelect = (val) => {
    if (!selected.includes(val)) onAdd(val);
    setInputValue("");
    setIsFocused(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-300, 16px)" }}>
      <div style={{ position: "relative" }}>
        <s-text-field
          label={label}
          value={inputValue}
          onInput={updateText}
          placeholder={loading ? "Loading..." : placeholder}
          autoComplete="off"
          disabled={loading}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        >
          <s-icon slot="prefix" source="search"></s-icon>
        </s-text-field>

        {isFocused && autocompleteOptions.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "white",
              border: "1px solid #c9cccf",
              borderRadius: "4px",
              zIndex: 10,
              maxHeight: "200px",
              overflowY: "auto",
              marginTop: "4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {autocompleteOptions.map((opt) => (
                <li
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f6f6f6")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <s-text>{opt.label}</s-text>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <s-stack direction="inline" gap="200">
          {selected.map((item) => (
            <Chip key={item} onRemove={() => onRemove(item)}>
              {item}
            </Chip>
          ))}
        </s-stack>
      )}
    </div>
  );
};

const CollectionChipField = ({ selected, onAdd, onRemove }) => {
  const openPicker = async () => {
    const result = await shopify.resourcePicker({
      type: "collection",
      multiple: true,
    });
    const collections = result?.selection || [];
    collections.forEach((c) => onAdd({ id: c.id, title: c.title }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-300, 16px)" }}>
      <s-text as="p" variant="bodyMd" fontWeight="medium">
        Collections
      </s-text>
      <s-box>
        <s-button onClick={openPicker}>Select Collections</s-button>
      </s-box>
      {selected.length > 0 && (
        <s-stack direction="inline" gap="200">
          {selected.map((c) => (
            <Chip key={c.id} onRemove={() => onRemove(c.id)}>
              {c.title}
            </Chip>
          ))}
        </s-stack>
      )}
    </div>
  );
};

function SummaryRow({ label, value }) {
  return (
    <s-stack direction="inline" justifyContent="space-between" alignItems="start">
      <s-text as="span" variant="bodySm" tone="subdued">
        {label}
      </s-text>
      <div style={{ maxWidth: "55%", textAlign: "right" }}>
        <s-text as="span" variant="bodySm" fontWeight="medium">
          {value}
        </s-text>
      </div>
    </s-stack>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: "success",
    inactive: "warning",
  };
  return (
    <s-badge tone={map[status] ?? "default"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </s-badge>
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
          ? `${discountValue || 0} off`
          : "None";

  return (
    <s-box background="surface" borderRadius="300" shadow="100" padding="400">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
          <s-text as="h2" variant="headingMd">
            Summary
          </s-text>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-300, 16px)" }}>
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
          </div>
          <s-box paddingBlockStart="small-200">
            <StatusBadge status={status} />
          </s-box>
        </div>
      </s-box>
  );
}

const APPLY_TO_CHOICES = [
  { label: "All Products", value: "allProducts" },
  { label: "All Products except selected", value: "excludeProducts" },
  { label: "Selected Products", value: "selectedProducts" },
  {
    label: "All except selected vendors / types / collections",
    value: "exceptSelectedVendorTypeCollection",
  },
  {
    label: "Products in selected vendors / types / collections",
    value: "productsInSelectedVendorTypeCollection",
  },
];

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
      images: p.images || []
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

  const [availableVendors, setAvailableVendors] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(false);

  const isVendorTypeCollection =
    applyTo === "exceptSelectedVendorTypeCollection" ||
    applyTo === "productsInSelectedVendorTypeCollection";

  useEffect(() => {
    const fetchFilters = async () => {
      setFiltersLoading(true);
      try {
        const res = await fetch("/api/fbt-product-filters");
        const data = await res.json();
        setAvailableVendors(data.vendors || []);
        setAvailableTypes(data.types || []);
      } catch (err) {
        console.error("Failed to fetch filters:", err);
      } finally {
        setFiltersLoading(false);
      }
    };
    fetchFilters();
  }, []);

  const openProductPicker = async () => {
    const result = await shopify.resourcePicker({
      type: "product",
      multiple: true,
    });
    const products = result?.selection || [];
    if (!products?.length) return;
    if (applyTo === "excludeProducts") setExcludedProducts(products);
    else setSelectedProducts(products);
  };

  const removeProduct = (id) => {
    if (applyTo === "excludeProducts")
      setExcludedProducts((prev) => prev.filter((p) => p.id !== id));
    else setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const displayProducts =
    applyTo === "excludeProducts" ? excludedProducts : selectedProducts;

  const openBundledProductPicker = async () => {
    try {
      const result = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });

      if (result?.selection?.length) {
        const newProducts = result.selection.map((product) => ({
          id: product.id,
          title: product.title,
          images: product.images || [],
          vendor: product.vendor,
        }));

        setBundledProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          return [
            ...prev,
            ...newProducts.filter((product) => !existingIds.has(product.id)),
          ];
        });
      }
    } catch (error) {
      console.error("Product picker error:", error);
    }
  };

  const removeBundledProduct = (id) => {
    setBundledProducts((prev) => prev.filter((product) => product.id !== id));
  };

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

<<<<<<< HEAD
  return (<>
    <ui-title-bar title={isEditing ? "Edit FBT Offer" : "Create FBT Offer"}>
      <button variant="breadcrumb" onClick={() => navigate('/app/fbt-list')}>
        Frequently Bought Together
      </button>
      <button variant="primary" onClick={saveOffer} disabled={saving}>
        {saving ? "Saving…" : isEditing ? "Update Offer" : "Save Offer"}
      </button>
    </ui-title-bar>
    <s-page>
=======
  return (
    <Page
      title={isEditing ? "Edit FBT Offer" : "Create FBT Offer"}
      backAction={{ content: 'Frequently Bought Together', onAction: () => navigate('/app/fbt-list') }}
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
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be

      <style>{`
        .offer-layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--p-space-400, 16px);
          align-items: start;
        }
        @media (min-width: 768px) {
          .offer-layout-grid {
            grid-template-columns: minmax(0, 7fr) minmax(0, 3fr);
          }
        }
        .offer-main-col {
          display: grid;
          gap: var(--p-space-400, 16px);
        }
        .offer-summary-col {
          position: sticky;
          top: var(--p-space-400, 16px);
        }
      `}</style>

<div className="offer-layout-grid">
      <div className="offer-main-col">
        
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
            {/* 1. Offer Information */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-200, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Offer Information</s-text>
                  <s-text tone="subdued" as="p">Basic details and status of the offer.</s-text>
                </div>
                <s-text-field
                  label="Upsell Title"
                  value={title}
                  onChange={setTitle}
                  autoComplete="off"
                  helpText="For internal purpose only, not displayed to customers."
                />
                <s-text-field
                  label="Discount Title"
                  value={discountTitle}
                  onChange={setDiscountTitle}
                  autoComplete="off"
                  helpText="Displayed on widget."
                />
                <s-text-field
                  label="Discount description"
                  value={discountDescription}
                  onChange={setDiscountDescription}
                  autoComplete="off"
                />
                <s-select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
    {statusOptions.map(opt => <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>)}
  </s-select>
              </div>
            </s-box>

            {/* 2. Products */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-200, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Products</s-text>
                  <s-text tone="subdued" as="p">Select the products, collections, or variants eligible for this offer.</s-text>
                </div>
                
                
<s-choice-list
  title="Apply To"
  onChange={(e) => setApplyTo(e.target.value[0])}
>
  {APPLY_TO_CHOICES.map((choice) => (
    <s-checkbox 
      key={choice.value}
      label={choice.label} 
      value={choice.value}
      checked={applyTo === choice.value}
      onInput={(e) => {
        if (e.target.checked) setApplyTo(choice.value);
      }}
    />
  ))}
</s-choice-list>
  

                {isVendorTypeCollection && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                    <MultiSelectField
                      label="Types"
                      placeholder="Search and select types..."
                      options={availableTypes}
                      selected={selectedTypes}
                      loading={filtersLoading}
                      onAdd={(t) => setSelectedTypes((prev) => [...prev, t])}
                      onRemove={(t) =>
                        setSelectedTypes((prev) => prev.filter((x) => x !== t))
                      }
                    />

                    <MultiSelectField
                      label="Vendors"
                      placeholder="Search and select vendors..."
                      options={availableVendors}
                      selected={selectedVendors}
                      loading={filtersLoading}
                      onAdd={(v) => setSelectedVendors((prev) => [...prev, v])}
                      onRemove={(v) =>
                        setSelectedVendors((prev) => prev.filter((x) => x !== v))
                      }
                    />

                    <CollectionChipField
                      selected={selectedCollections}
                      onAdd={(c) =>
                        setSelectedCollections((prev) =>
                          prev.find((x) => x.id === c.id) ? prev : [...prev, c],
                        )
                      }
                      onRemove={(id) =>
                        setSelectedCollections((prev) =>
                          prev.filter((x) => x.id !== id),
                        )
                      }
                    />
                  </div>
                )}

                {(applyTo === "excludeProducts" || applyTo === "selectedProducts") && (
                  <s-box paddingBlockStart="base">
                    <s-button onClick={openProductPicker}>
                      {applyTo === "excludeProducts"
                        ? "Select Products to Exclude"
                        : "Select Products"}
                    </s-button>

                    {displayProducts?.length > 0 && (
                      <s-box paddingBlockStart="base">
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-300, 16px)" }}>
                          {displayProducts.map((product) => (
                            <s-box key={product.id} padding="small-200" border="base subdued solid" borderRadius="small-200">
                              <s-stack direction="inline" justifyContent="space-between" alignItems="center" gap="400">
                                <s-stack direction="inline" alignItems="center" gap="400">
                                  <s-thumbnail
                                    source={
                                      product.images?.[0]?.originalSrc ||
                                      product.images?.[0]?.url ||
                                      "https://cdn.shopify.com/s/files/1/0757/9955/files/placeholder-images-image_large.png"
                                    }
                                    size="small"
                                    alt={product.title}
                                  />
                                  <s-text as="span" variant="bodyMd">
                                    {product.title}
                                  </s-text>
                                </s-stack>
                                <s-button
                                  tone="critical"
                                  variant="plain"
                                  onClick={() => removeProduct(product.id)}
                                >
                                  Remove
                                </s-button>
                              </s-stack>
                            </s-box>
                          ))}
                        </div>
                      </s-box>
                    )}
                  </s-box>
                )}
              </div>
            </s-box>

            {/* 3. Discount Configuration */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-200, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Discount Configuration</s-text>
                  <s-text tone="subdued" as="p">Configure the discount type, value, and specific tier or gift settings.</s-text>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                  <s-text as="h3" variant="headingSm">Bundled products method</s-text>
                  <s-stack direction="inline" gap="400">
                    <s-button
                      variant={selectedGiftMode === "manual" ? "primary" : "secondary"}
                      onClick={() => setSelectedGiftMode("manual")}
                    >
                      Manual
                    </s-button>
                    <s-button
                      variant={selectedGiftMode === "random" ? "primary" : "secondary"}
                      onClick={() => setSelectedGiftMode("random")}
                    >
                      Random
                    </s-button>
                  </s-stack>

                  {selectedGiftMode === "manual" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                      <s-box>
                        <s-button onClick={openBundledProductPicker}>
                          Select Bundled Products
                        </s-button>
                      </s-box>

                      {bundledProducts?.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                          {bundledProducts.map((product) => (
                            <s-box key={product.id} padding="small-200" border="base subdued solid" borderRadius="small-200">
                              <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                                <s-stack direction="inline" gap="400" alignItems="center">
                                  <s-thumbnail
                                    source={
                                      product.images?.[0]?.originalSrc ||
                                      product.images?.[0]?.url ||
                                      "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png"
                                    }
                                    alt={product.title}
                                    size="small"
                                  />

                                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-200, 16px)" }}>
                                    <s-text as="span" variant="bodyMd" fontWeight="medium">
                                      {product.title}
                                    </s-text>

                                    {product.vendor && (
                                      <s-text as="span" variant="bodySm" tone="subdued">
                                        {product.vendor}
                                      </s-text>
                                    )}
                                  </div>
                                </s-stack>

                                <s-button
                                  tone="critical"
                                  variant="plain"
                                  onClick={() => removeBundledProduct(product.id)}
                                >
                                  Remove
                                </s-button>
                              </s-stack>
                            </s-box>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedGiftMode === "random" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                      <s-grid gridTemplateColumns="1fr 1fr" gap="400">
                        <s-text-field
                          label="Number of upsell products"
                          type="number"
                          min={1}
                          max={10}
                          placeholder="3"
                          value={String(randomCount)}
                          onChange={setRandomCount}
                          autoComplete="off"
                        />

                        <s-select
      label="Pick products from"
      value={randomSourceType}
      onChange={(e) => {
        setRandomSourceType(e.target.value);
        setRandomSourceValue("");
      }}
    >
      <s-option value="selectedType">Selected type only</s-option>
      <s-option value="selectedVendor">Selected vendor only</s-option>
      <s-option value="selectedCollection">Selected collection only</s-option>
    </s-select>
                      </s-grid>

                      {randomSourceType === "selectedType" && (
                        <s-text-field
                          label="Product type"
                          placeholder="e.g. T-Shirt"
                          value={randomSourceValue}
                          onChange={setRandomSourceValue}
                          autoComplete="off"
                        />
                      )}

                      {randomSourceType === "selectedVendor" && (
                        <s-text-field
                          label="Vendor name"
                          placeholder="e.g. Nike"
                          value={randomSourceValue}
                          onChange={setRandomSourceValue}
                          autoComplete="off"
                        />
                      )}

                      {randomSourceType === "selectedCollection" && (
                        <s-text-field
                          label="Collection title"
                          placeholder="e.g. Summer Sale"
                          value={randomSourceValue}
                          onChange={setRandomSourceValue}
                          autoComplete="off"
                        />
                      )}
                    </div>
                  )}

                  <s-box paddingBlockStart="base">
                    <s-text as="h3" variant="headingSm">Discount</s-text>
                  </s-box>
                  <s-grid gridTemplateColumns="1fr 1fr" gap="400">
                    <s-select
      label="Discount type"
      value={discountType}
      onChange={(e) => setDiscountType(e.target.value)}
    >
      <s-option value="percentage">Percentage</s-option>
      <s-option value="amount">Amount</s-option>
      <s-option value="free">Cheapest item free</s-option>
    </s-select>

                    {discountType !== "free" && (
                      <s-text-field
                        label={
                          discountType === "percentage" ? "Discount %" : "Amount off"
                        }
                        type="number"
                        min="0"
                        max={discountType === "percentage" ? "100" : undefined}
                        placeholder={discountType === "percentage" ? "10" : "5.00"}
                        value={String(discountValue ?? "")}
                        onChange={setDiscountValue}
                        autoComplete="off"
                      />
                    )}
                  </s-grid>
                </div>
              </div>
            </s-box>

            {/* 4. Purchase Conditions */}
            {/* Omitted for FBT */}

            {/* 5. Schedule */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-200, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Schedule</s-text>
                  <s-text tone="subdued" as="p">Define when the offer starts and ends.</s-text>
                </div>
                <s-grid gridTemplateColumns="1fr 1fr" gap="400">
                  <s-text-field
                    label="Start Date"
                    type="date"
                    value={startDate || ""}
                    onChange={setStartDate}
                    autoComplete="off"
                  />
                  <s-text-field
                    label="End Date"
                    type="date"
                    value={endDate || ""}
                    onChange={setEndDate}
                    autoComplete="off"
                  />
                </s-grid>
              </div>
            </s-box>

            {/* 6. Advanced Settings */}
            {/* Omitted for FBT */}

          </div>
        

        </div><div className="offer-summary-col">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
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
          </div>
        
      </div>
      </div>
    </s-page>
    </>
  );
}
