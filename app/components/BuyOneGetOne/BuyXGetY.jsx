import { useState, useEffect } from "react";
import { useNavigate, useFetcher } from "react-router";


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

const extractId = (gid) =>
  gid && gid.includes("/") ? gid.split("/").pop() : gid;
const resolveProductId = (p) => (p.productId ? p.productId : extractId(p.id));

const MultiSelectField = ({
  label,
  placeholder,
  options = [],
  selected = [],
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

const CollectionChipField = ({ selected = [], onChange }) => {
  const openPicker = async () => {
    try {
      const result = await shopify.resourcePicker({
        type: "collection",
        multiple: true,
        selectionIds: selected.map(c => ({ id: c.id })),
      });
      if (result && result.selection) {
        onChange(result.selection.map((c) => ({ id: c.id, title: c.title })));
      }
    } catch (error) {
      console.error("Collection picker error:", error);
    }
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
        <s-stack direction="inline" gap="200" wrap="true">
          {selected.map((c) => (
            <Tag key={c.id} onRemove={() => onChange(selected.filter(x => x.id !== c.id))}>
              {c.title}
            </Tag>
          ))}
        </s-stack>
      )}
    </div>
  );
};

const APPLY_TO_CHOICES = [
  { label: "Selected Products", value: "selectedProducts" },
  {
    label: "Products in selected vendors / types / collections",
    value: "productsInSelectedVendorTypeCollection",
  },
];

const BuyXGetY = ({ offer = null }) => {
  const navigate = useNavigate();
  const fetcher = useFetcher();
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

  // Gift mode
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

  const [availableVendors, setAvailableVendors] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(false);

  useEffect(() => {
    const fetchFilters = async () => {
      setFiltersLoading(true);
      try {
        const res = await fetch("/api/product-filters");
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
    try {
      const result = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: selectedProducts.map(p => ({ id: p.id })),
      });
      if (result && result.selection) {
        setSelectedProducts(
          result.selection.map((p) => ({
            id: p.id,
            title: p.title,
            images: p.images || [],
            vendor: p.vendor,
            productType: p.productType,
          })),
        );
      }
    } catch (error) {
      console.error("Product picker error:", error);
    }
  };

  const removeProduct = (id) => {
    setSelectedProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const openGiftProductPicker = async () => {
    try {
      const result = await shopify.resourcePicker({
        type: "product",
        multiple: true,
        selectionIds: giftProducts.map((p) => ({ id: p.id })),
      });

      if (result && result.selection) {
        setGiftProducts(
          result.selection.map((product) => ({
            id: product.id,
            title: product.title,
            images: product.images || [],
            featuredImage: product.featuredImage || null,
            vendor: product.vendor,
            productType: product.productType,
          })),
        );
      }
    } catch (error) {
      console.error("Gift product picker error:", error);
    }
  };

  const removeGiftProduct = (productId) => {
    setGiftProducts((prev) =>
      prev.filter((product) => product.id !== productId),
    );
  };

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

      fetcher.submit(payload, {
        method: isEditing ? "PUT" : "POST",
        action: "/api/bxgy-offers",
        encType: "application/json",
      });
    } catch (err) {
      console.error("Save failed:", err);
      shopify.toast.show(err.message || "Failed to save offer", {
        isError: true,
      });
    }
  };

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (fetcher.data.success) {
        shopify.toast.show(
          isEditing
            ? "Offer updated successfully!"
            : "Offer created successfully!",
          { duration: 3000 },
        );
        navigate("/app/bxgy-list");
      } else if (fetcher.data.error) {
        shopify.toast.show(fetcher.data.error || "Failed to save offer", {
          isError: true,
        });
      }
    }
  }, [fetcher.data, fetcher.state, navigate, isEditing]);

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  return (
    <>
    <ui-title-bar title={isEditing ? "Edit BOGO Offer" : "Create BOGO Offer"}>
      <button variant="breadcrumb" onClick={() => navigate('/app/bxgy-list')}>
        BXGY Offers
      </button>
      <button variant="primary" onClick={saveOffer}>
        {isEditing ? "Update Offer" : "Save Offer"}
      </button>
    </ui-title-bar>
    <s-page>

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
                <s-textField
                  label="Offer name"
                  value={title}
                  onChange={setTitle}
                  placeholder="BXGY Buy X get Y"
                  autoComplete="off"
                />
                <s-textField
                  label="Offer title"
                  value={discountTitle}
                  onChange={setDiscountTitle}
                  placeholder="BXGY (Buy X get Y)"
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
  

                {applyTo === "selectedProducts" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                    <s-box>
                      <s-button onClick={openProductPicker}>Select Products</s-button>
                    </s-box>

                    {selectedProducts.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-300, 16px)" }}>
                        <s-text as="p" variant="bodySm" tone="subdued">
                          {selectedProducts.length} product(s) selected
                        </s-text>
                        {selectedProducts.map((product) => (
                          <s-box padding="base" border="base subdued solid" borderRadius="small-200" key={product.id}>
                            <s-stack direction="inline" justifyContent="space-between" alignItems="center" gap="400">
                              <s-stack direction="inline" alignItems="center" gap="400">
                                <s-thumbnail
                                  source={
                                    product.images?.[0]?.originalSrc ||
                                    product.featuredImage?.url ||
                                    "https://cdn.shopify.com/s/files/1/0757/9955/files/placeholder-images-image_large.png"
                                  }
                                  size="small"
                                  alt={product.title}
                                />
                                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                                  <s-text as="p" variant="bodyMd" fontWeight="medium">
                                    {product.title}
                                  </s-text>
                                  {product.vendor && (
                                    <s-text as="p" variant="bodySm" tone="subdued">
                                      {product.vendor}
                                    </s-text>
                                  )}
                                </div>
                              </s-stack>
                              <s-button
                                tone="critical"
                                variant="plain"
                                size="slim"
                                onClick={() => removeProduct(product.id)}
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

                {applyTo === "productsInSelectedVendorTypeCollection" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
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
                    <MultiSelectField
                      label="Product Types"
                      placeholder="Search and select types..."
                      options={availableTypes}
                      selected={selectedTypes}
                      loading={filtersLoading}
                      onAdd={(t) => setSelectedTypes((prev) => [...prev, t])}
                      onRemove={(t) =>
                        setSelectedTypes((prev) => prev.filter((x) => x !== t))
                      }
                    />
                    <CollectionChipField
                      selected={selectedCollections}
                      onChange={setSelectedCollections}
                    />
                  </div>
                )}
              </div>
            </s-box>

            {/* 3. Discount Configuration */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-200, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Discount Configuration</s-text>
                  <s-text tone="subdued" as="p">Configure the gift mode, type, and specific gift settings.</s-text>
                </div>

                <s-stack direction="inline" gap="400">
                  <s-button
                    variant={selectedGiftMode === "productGift" ? "primary" : "secondary"}
                    onClick={() => setSelectedGiftMode("productGift")}
                  >
                    Product gift
                  </s-button>
                  <s-button
                    variant={selectedGiftMode === "shippingDiscount" ? "primary" : "secondary"}
                    onClick={() => setSelectedGiftMode("shippingDiscount")}
                  >
                    Shipping discount as Gift
                  </s-button>
                </s-stack>

                {selectedGiftMode === "productGift" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                    <s-box padding="base" background="surface-secondary" border="base subdued solid" borderRadius="small-200">
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                        <s-grid gridTemplateColumns="1fr 1fr" gap="400">
                          <s-select
                            label="Discount Type"
                            value={giftDiscountType}
                            onChange={(e) => setGiftDiscountType(e.target.value)}
                          >
                            <s-option value="free">Free (100% off)</s-option>
                            <s-option value="percentage">Percentage</s-option>
                            <s-option value="fixedPrice">Fixed Amount</s-option>
                          </s-select>

                          {giftDiscountType === "percentage" && (
                            <s-textField
                              label="Discount %"
                              type="number"
                              suffix="%"
                              min={0}
                              max={100}
                              placeholder="10"
                              value={String(giftValue ?? "")}
                              onChange={setGiftValue}
                              autoComplete="off"
                            />
                          )}

                          {giftDiscountType === "fixedPrice" && (
                            <s-textField
                              label="Amount Off"
                              type="number"
                              min={0}
                              placeholder="10.00"
                              value={String(giftValue ?? "")}
                              onChange={setGiftValue}
                              autoComplete="off"
                            />
                          )}
                        </s-grid>

                        <s-textField
                          label="Number of gifts for customer to receive"
                          type="number"
                          min={1}
                          value={String(giftQuantity)}
                          onChange={setGiftQuantity}
                          placeholder="1"
                          autoComplete="off"
                        />
                      </div>
                    </s-box>

                    <s-box>
                      <s-button variant="primary" onClick={openGiftProductPicker}>
                        Select Gift Products
                      </s-button>
                    </s-box>

                    {giftProducts?.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                        <s-text as="p" variant="bodyMd" tone="subdued">
                          Selected Gift Products ({giftProducts.length})
                        </s-text>

                        {giftProducts.map((product) => (
                          <s-box key={product.id} padding="base" border="base subdued solid" borderRadius="small-200">
                            <s-stack direction="inline" justifyContent="space-between" alignItems="center">
                              <s-stack direction="inline" gap="400" alignItems="center">
                                <s-thumbnail
                                  source={
                                    product.featuredImage?.url ||
                                    product.images?.[0]?.originalSrc ||
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
                                onClick={() => removeGiftProduct(product.id)}
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

                {selectedGiftMode === "shippingDiscount" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                    <s-grid gridTemplateColumns="1fr 1fr" gap="400">
                      <s-select
                        label="Discount Type"
                        value={shippingDiscountType}
                        onChange={(e) => setShippingDiscountType(e.target.value)}
                      >
                        <s-option value="percentage">Percentage</s-option>
                        <s-option value="fixedPrice">Fixed Amount</s-option>
                      </s-select>

                      {shippingDiscountType === "percentage" && (
                        <s-textField
                          label="Discount %"
                          type="number"
                          min={0}
                          max={100}
                          suffix="%"
                          placeholder="10"
                          value={String(shippingDiscountValue)}
                          onChange={setShippingDiscountValue}
                          autoComplete="off"
                        />
                      )}

                      {shippingDiscountType === "fixedPrice" && (
                        <s-textField
                          label="Amount"
                          type="number"
                          min={0}
                          placeholder="10.00"
                          value={String(shippingDiscountValue)}
                          onChange={setShippingDiscountValue}
                          autoComplete="off"
                        />
                      )}
                    </s-grid>

                    <s-box padding="base" background="surface-secondary" border="base subdued solid" borderRadius="small-200">
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                        <s-checkbox label="Create free shipping for products" checked={enableFreeShipping} onInput={(e) => setEnableFreeShipping(e.target.checked)} />

                        {enableFreeShipping && (
                          <s-textField
                            label="Free shipping product name"
                            placeholder="Free Shipping"
                            value={freeShippingProductName}
                            onChange={setFreeShippingProductName}
                            autoComplete="off"
                          />
                        )}
                      </div>
                    </s-box>
                  </div>
                )}
              </div>
            </s-box>

            {/* 4. Purchase Conditions */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-200, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Purchase Conditions</s-text>
                  <s-text tone="subdued" as="p">Set minimum quantities, limits, or specific requirements to trigger the offer.</s-text>
                </div>

                <s-textField
                  label="Number of products required to qualify"
                  type="number"
                  min={1}
                  value={String(requiredQuantity)}
                  onChange={setRequiredQuantity}
                  placeholder="1"
                  autoComplete="off"
                />

                <s-checkbox label="Gifts will be the same as selected products" checked={sameAsGift} onInput={(e) => setSameAsGift(e.target.checked)} />

                {sameAsGift && (
                  <s-stack direction="inline" gap="400">
                    <s-checkbox label="Track by product" checked={trackBy === "PRODUCT"} onInput={() => setTrackBy("PRODUCT")} />
                    <s-checkbox label="Track by variant" checked={trackBy === "VARIANT"} onInput={() => setTrackBy("VARIANT")} />
                  </s-stack>
                )}
              </div>
            </s-box>

            {/* 5. Schedule */}
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-200, 16px)" }}>
                  <s-text as="h2" variant="headingMd">Schedule</s-text>
                  <s-text tone="subdued" as="p">Define when the offer starts and ends.</s-text>
                </div>

                <s-grid gridTemplateColumns="1fr 1fr" gap="400">
                  <s-textField
                    label="Start Date"
                    type="date"
                    value={startDate || ""}
                    onChange={setStartDate}
                    autoComplete="off"
                  />
                  <s-textField
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
            {/* Omitted for BuyXGetY */}

          </div>
        </div>
        <div className="offer-summary-col">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
              <s-text as="h2" variant="headingMd">
                Summary
              </s-text>
              <ul style={{ paddingLeft: '20px', listStyleType: 'disc' }}>
                <li>
                  Applies to: {applyTo.replace(/([A-Z])/g, " $1").trim()}
                </li>
                <li>
                  {selectedProducts.length} products selected
                </li>
                <li>{selectedVendors.length} vendors</li>
                <li>{selectedCollections.length} collections</li>
                <li>{startDate || "No start date"}</li>
              </ul>
            </div>
          </s-box>
          </div>
        </div>
      </div>
    </s-page>
    </>
  );
};

export default BuyXGetY;
