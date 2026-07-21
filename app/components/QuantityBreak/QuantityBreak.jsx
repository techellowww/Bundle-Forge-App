import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useRef } from "react";
import QuantityBreakcart from "./QuantityBreakcart";


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

const CollectionChipField = ({ selected, onChange }) => {
  const openPicker = async () => {
    const result = await shopify.resourcePicker({
      type: "collection",
      multiple: true,
      selectionIds: selected.map(c => ({ id: c.id })),
    });
    if (!result) return;
    const collections = result.selection;
    onChange(collections.map((c) => ({ id: c.id, title: c.title })));
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
            <Chip key={c.id} onRemove={() => onChange(selected.filter(x => x.id !== c.id))}>
              {c.title}
            </Chip>
          ))}
        </s-stack>
      )}
    </div>
  );
};

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

const QuantityBreak = ({ offer }) => {
  const navigate = useNavigate();
  const isEditing = !!offer;

  const [title, setTitle] = useState(offer?.title ?? "Buy More Save More");
  const [discountTitle, setDiscountTitle] = useState(
    offer?.discountTitle ?? "Volume discount save",
  );
  const [discountDescription, setDiscountDescription] = useState(
    offer?.discountDescription ?? "Best deals selected for you!",
  );
  const [startDate, setStartDate] = useState(
    offer?.startDate
      ? new Date(offer.startDate).toISOString().split("T")[0]
      : "",
  );
  const [endDate, setEndDate] = useState(
    offer?.endDate ? new Date(offer.endDate).toISOString().split("T")[0] : "",
  );

  const [applyTo, setApplyTo] = useState(offer?.applyTo ?? "allProducts");
  const [status, setStatus] = useState(offer?.status ?? "active");

  const [selectedProducts, setSelectedProducts] = useState(
    offer?.products
      ?.filter((p) => !p.isExcluded)
      .map((p) => ({
        id: `gid://shopify/Product/${p.productId}`,
        title: p.title,
        images: p.images || []
      })) ?? [],
  );

  const [excludedProducts, setExcludedProducts] = useState(
    offer?.products
      ?.filter((p) => p.isExcluded)
      .map((p) => ({
        id: `gid://shopify/Product/${p.productId}`,
        title: p.title,
        images: p.images || []
      })) ?? [],
  );

  const [selectedVendors, setSelectedVendors] = useState(
    offer?.vendors?.map((v) => v.vendor) ?? [],
  );

  const [selectedTypes, setSelectedTypes] = useState(
    offer?.types?.map((t) => t.type) ?? [],
  );

  const [selectedCollections, setSelectedCollections] = useState(
    offer?.collections?.map((c) => ({
      id: `gid://shopify/Collection/${c.collectionId}`,
      title: c.title ?? "",
    })) ?? [],
  );

  const [tiers, setTiers] = useState(
    offer?.tiers?.map((t) => ({
      tierTitle: t.tierTitle ?? "New Title",
      quantity: t.quantity,
      discountType: t.discountType,
      value: t.value,
      subTitleText: t.subTitleText ?? "Buy 2 and get One",
      labelText: t.labelText ?? "Discount",
      tagText: t.tagText ?? "Most popular",
      subTitleEnabled: !!t.subTitleText,
      labelEnabled: !!t.labelText,
      tagEnabled: !!t.tagText,
      preSelect: t.preSelect ?? false,
    })) ?? [
      {
        tierTitle: "New Title",
        quantity: 1,
        discountType: "percentage",
        value: "",
        subTitleText: "Buy 2 and get One",
        labelText: "Discount",
        tagText: "Most popular",
        subTitleEnabled: false,
        labelEnabled: false,
        tagEnabled: false,
        preSelect: false,
      },
    ],
  );

  const [availableVendors, setAvailableVendors] = useState([]);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isVendorTypeCollection =
    applyTo === "exceptSelectedVendorTypeCollection" ||
    applyTo === "productsInSelectedVendorTypeCollection";

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
    const currentSelection = applyTo === "excludeProducts" ? excludedProducts : selectedProducts;
    const result = await shopify.resourcePicker({
      type: "product",
      multiple: true,
      selectionIds: currentSelection.map(p => ({ id: p.id })),
    });
    if (!result) return;
    const products = result.selection;
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

  const addTier = () => {
    setTiers([
      ...tiers,
      {
        tierTitle: "",
        quantity: "",
        discountType: "percentage",
        value: "",
        subTitleEnabled: false,
        subTitleText: "",
        labelEnabled: false,
        labelText: "",
        tagEnabled: false,
        tagText: "",
        preSelect: false,
      },
    ]);
  };

  const removeTier = (index) => {
    const updated = tiers.filter((_, i) => i !== index);
    setTiers(updated);
  };

  const updateTier = (index, field, value) => {
    const updated = [...tiers];
    if (field === "quantity" || field === "value") {
      updated[index][field] = value === "" ? "" : Number(value);
    } else {
      updated[index][field] = value;
    }
    setTiers(updated);
  };

  const saveOffer = async () => {
    setSaving(true);
    try {
      const payload = {
        ...(isEditing && { id: offer.id }),
        title,
        applyTo,
        discountTitle,
        discountDescription,
        startDate: startDate || null,
        endDate: endDate || null,
        status,
        tiers: tiers.map((t) => ({
          tierTitle: t.tierTitle,
          quantity: Number(t.quantity),
          discountType: t.discountType,
          value: Number(t.value),
          subTitleEnabled: t.subTitleEnabled,
          labelEnabled: t.labelEnabled,
          tagEnabled: t.tagEnabled,
          subTitleText: t.subTitleEnabled ? t.subTitleText : null,
          labelText: t.labelEnabled ? t.labelText : null,
          tagText: t.tagEnabled ? t.tagText : null,
          preSelect: t.preSelect ?? false,
        })),
        products: selectedProducts.map((p) => ({
          productId: extractId(p.id),
          title: p.title,
          isExcluded: false,
        })),
        excludedProducts: excludedProducts.map((p) => ({
          productId: extractId(p.id),
          title: p.title,
          isExcluded: true,
        })),
        vendors: selectedVendors,
        productTypes: selectedTypes,
        collections: selectedCollections.map((c) => ({
          collectionId: extractId(c.id),
          title: c.title,
        })),
      };

      const res = await fetch("/api/quantity-break", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        navigate("/app/quantity-breaks");
      } else {
        console.error("Save failed:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <ui-title-bar title={isEditing ? "Edit Quantity Break" : "Create Quantity Break"}>
      <button variant="breadcrumb" onClick={() => navigate('/app')}>
        Quantity Break
      </button>
      <button variant="primary" onClick={saveOffer} disabled={saving}>
        {saving ? "Saving…" : isEditing ? "Update Offer" : "Save Offer"}
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
                <s-grid gridTemplateColumns="1fr 1fr" gap="400">
                  <s-select
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <s-option value="active">Active</s-option>
                    <s-option value="inactive">Inactive</s-option>
                  </s-select>
                  <s-text-field
                    label="Offer Title"
                    value={title}
                    onInput={(e) => setTitle(e.target.value)}
                    autoComplete="off"
                    helpText="For internal purpose only."
                  />
                </s-grid>
                
                <s-grid gridTemplateColumns="1fr 1fr" gap="400">
                  <s-text-field
                    label="Discount Title"
                    value={discountTitle}
                    onInput={(e) => setDiscountTitle(e.target.value)}
                    autoComplete="off"
                    helpText="Displayed on widget."
                  />
                  <s-text-field
                    label="Discount Description"
                    value={discountDescription}
                    onInput={(e) => setDiscountDescription(e.target.value)}
                    autoComplete="off"
                  />
                </s-grid>
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
                      onChange={setSelectedCollections}
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
                                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                                      <s-text as="span" variant="bodyMd" fontWeight="medium">
                                        {product.title}
                                      </s-text>
                                      {product.variants?.[0]?.title && product.variants[0].title !== 'Default Title' && (
                                        <s-text as="span" variant="bodySm" tone="subdued">
                                          {product.variants[0].title}
                                        </s-text>
                                      )}
                                      {product.variants?.[0]?.price && (
                                        <s-text as="span" variant="bodySm" tone="subdued">
                                          ${product.variants[0].price}
                                        </s-text>
                                      )}
                                    </div>
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
                  <s-text tone="subdued" as="p">Configure the discount type, value, and specific tier settings.</s-text>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                  {tiers?.map((tier, index) => (
                    <s-box key={index} padding="base" border="base subdued solid" borderRadius="small-200">
                      <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                        <s-text as="h3" variant="headingSm">Quantity Tier {index + 1}</s-text>
                        
                        <s-text-field
                          label="Tier Title"
                          placeholder="New Tier"
                          value={tier.tierTitle}
                          onInput={(e) => updateTier(index, "tierTitle", e.target.value)}
                          autoComplete="off"
                        />
                        
                        <s-grid gridTemplateColumns="1fr 1fr 1fr auto" gap="400" alignItems="end">
                          <s-text-field
                            label="Minimum Quantity"
                            type="number"
                            value={String(tier.quantity || "")}
                            onInput={(e) => updateTier(index, "quantity", e.target.value)}
                            autoComplete="off"
                          />

                          <s-select label="Discount Type" value={tier.discountType} onChange={(e) => updateTier(index, "discountType", e.target.value)}>
  <s-option value="percentage">Percentage</s-option>
  <s-option value="amount">Amount Off</s-option>
  <s-option value="fixedPrice">Fixed Price</s-option>
</s-select>

                          {tier.discountType === "percentage" && (
                            <s-text-field
                              label="Discount %"
                              type="number"
                              suffix="%"
                              value={String(tier.value || "")}
                              onInput={(e) => updateTier(index, "value", e.target.value)}
                              autoComplete="off"
                            />
                          )}

                          {tier.discountType === "amount" && (
                            <s-text-field
                              label="Amount Off"
                              type="number"
                              prefix="₹"
                              value={String(tier.value || "")}
                              onInput={(e) => updateTier(index, "value", e.target.value)}
                              autoComplete="off"
                            />
                          )}

                          {tier.discountType === "fixedPrice" && (
                            <s-text-field
                              label="Fixed Price"
                              type="number"
                              prefix="₹"
                              value={String(tier.value || "")}
                              onInput={(e) => updateTier(index, "value", e.target.value)}
                              autoComplete="off"
                            />
                          )}
                        </s-grid>

                        <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                          <s-text as="h3" variant="headingSm">Display Options</s-text>
                          <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="400">
                            <s-checkbox label="Sub Title" checked={tier.subTitleEnabled} onInput={(e) => updateTier(index, "subTitleEnabled", e.target.checked)} />
                            <s-checkbox label="Label" checked={tier.labelEnabled} onInput={(e) => updateTier(index, "labelEnabled", e.target.checked)} />
                            <s-checkbox label="Tag" checked={tier.tagEnabled} onInput={(e) => updateTier(index, "tagEnabled", e.target.checked)} />
                          </s-grid>
                          
                          {(tier.subTitleEnabled || tier.labelEnabled || tier.tagEnabled) && (
                            <s-grid gridTemplateColumns="1fr 1fr 1fr" gap="400">
                              {tier.subTitleEnabled ? (
                                <s-text-field
                                  placeholder="Buy More Save More"
                                  value={tier.subTitleText}
                                  onInput={(e) => updateTier(index, "subTitleText", e.target.value)}
                                  autoComplete="off"
                                />
                              ) : <div />}
                              
                              {tier.labelEnabled ? (
                                <s-text-field
                                  placeholder="20% discount"
                                  value={tier.labelText}
                                  onInput={(e) => updateTier(index, "labelText", e.target.value)}
                                  autoComplete="off"
                                />
                              ) : <div />}
                              
                              {tier.tagEnabled ? (
                                <s-text-field
                                  placeholder="Trending"
                                  value={tier.tagText}
                                  onInput={(e) => updateTier(index, "tagText", e.target.value)}
                                  autoComplete="off"
                                />
                              ) : <div />}
                            </s-grid>
                          )}
                          <s-checkbox label="Pre-Select this tier by default" checked={tier.preSelect} onInput={(e) => updateTier(index, "preSelect", e.target.checked)} />
                        </div>

                        {tiers?.length > 1 && (
                          <s-box paddingBlockStart="small-200">
                            <s-button
                              variant="plain"
                              tone="critical"
                              onClick={() => removeTier(index)}
                            >
                              Remove Tier
                            </s-button>
                          </s-box>
                        )}
                      </div>
                    </s-box>
                  ))}

                  <s-box>
                    <s-button onClick={addTier}>+ Add Tier</s-button>
                  </s-box>
                </div>
              </div>
            </s-box>

            {/* 4. Purchase Conditions */}
            {/* Omitted for Quantity Break */}

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
                    onInput={(e) => setStartDate(e.target.value)}
                    autoComplete="off"
                  />
                  <s-text-field
                    label="End Date"
                    type="date"
                    value={endDate || ""}
                    onInput={(e) => setEndDate(e.target.value)}
                    autoComplete="off"
                  />
                </s-grid>
              </div>
            </s-box>

            {/* 6. Advanced Settings */}
            {/* Display options are within each tier */}

          </div>
        </div>
        <div className="offer-summary-col">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <s-text as="h2" variant="headingMd">Summary</s-text>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-300, 16px)" }}>
                  <s-stack direction="inline" justifyContent="space-between" alignItems="start">
                    <s-text as="span" variant="bodySm" tone="subdued">Offer Type</s-text>
                    <s-text as="span" variant="bodySm" fontWeight="medium">Quantity Break</s-text>
                  </s-stack>
                  
                  <s-stack direction="inline" justifyContent="space-between" alignItems="start">
                    <s-text as="span" variant="bodySm" tone="subdued">Status</s-text>
                    <s-badge tone={status === "active" ? "success" : "warning"}>
                      {status === "active" ? "Active" : "Inactive"}
                    </s-badge>
                  </s-stack>

                  <s-stack direction="inline" justifyContent="space-between" alignItems="start">
                    <s-text as="span" variant="bodySm" tone="subdued">Applies to</s-text>
                    <div style={{ maxWidth: "55%", textAlign: "right" }}>
                      <s-text as="span" variant="bodySm" fontWeight="medium">
                        {applyTo === "allProducts" ? "All Products" : applyTo === "selectedProducts" ? `${selectedProducts.length} product(s)` : "Filtered selection"}
                      </s-text>
                    </div>
                  </s-stack>

                  <s-stack direction="inline" justifyContent="space-between" alignItems="start">
                    <s-text as="span" variant="bodySm" tone="subdued">Tiers</s-text>
                    <s-text as="span" variant="bodySm" fontWeight="medium">{tiers.length} tier(s) configured</s-text>
                  </s-stack>
                </div>
              </div>
            </s-box>

            <s-box background="surface" borderRadius="300" shadow="100" padding="400">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--p-space-400, 16px)" }}>
                <s-text as="h3" variant="headingSm">Storefront Preview</s-text>
                <QuantityBreakcart
                  discountTitle={discountTitle}
                  discountDescription={discountDescription}
                  tiers={tiers}
                  selectedProducts={selectedProducts}
                  saveOffer={saveOffer}
                />
              </div>
            </s-box>
          </div>
        </div>
      </div>
    </s-page>
    </>
  );
};

export default QuantityBreak;
