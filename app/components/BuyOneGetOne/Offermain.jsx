import { useState, useRef, useEffect } from "react";
import { Tag, InlineStack, BlockStack } from "@shopify/polaris";

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
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = options.filter(
    (o) =>
      !selected.includes(o) &&
      o.toLowerCase().includes(inputValue.toLowerCase()),
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    if (!selected.includes(item)) onAdd(item);
    setInputValue("");
    setOpen(false);
  };

  return (
    <BlockStack gap="200">
      <div ref={containerRef} style={{ position: "relative" }}>
        <p
          style={{
            fontSize: "14px",
            fontWeight: 500,
            marginBottom: "4px",
            color: "#202223",
          }}
        >
          {label}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid #8c9196",
            borderRadius: "8px",
            padding: "8px 12px",
            background: "#fff",
            cursor: "text",
            gap: "8px",
          }}
          onClick={() => {
            if (!loading) setOpen(true);
          }}
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (!loading) setOpen(true);
            }}
            placeholder={loading ? "Loading..." : placeholder}
            disabled={loading}
            style={{
              border: "none",
              outline: "none",
              flex: 1,
              fontSize: "14px",
              color: "#202223",
              background: "transparent",
            }}
          />
          {loading && (
            <div
              style={{
                width: "16px",
                height: "16px",
                border: "2px solid #8c9196",
                borderTopColor: "#202223",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }}
            />
          )}
        </div>

        {open && !loading && filtered.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              left: 0,
              right: 0,
              background: "#fff",
              border: "1px solid #8c9196",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 9999,
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            {filtered.map((item) => (
              <div
                key={item}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
                style={{
                  padding: "10px 14px",
                  fontSize: "14px",
                  cursor: "pointer",
                  color: "#202223",
                  borderBottom: "1px solid #f1f1f1",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f6f6f7")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fff")
                }
              >
                {item}
              </div>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <InlineStack gap="100" wrap>
          {selected.map((item) => (
            <Tag key={item} onRemove={() => onRemove(item)}>
              {item}
            </Tag>
          ))}
        </InlineStack>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </BlockStack>
  );
};

const CollectionChipField = ({ selected = [], onAdd, onRemove }) => {
  const openPicker = async () => {
    try {
      const result = await shopify.resourcePicker({
        type: "collection",
        multiple: true,
      });
      if (result?.selection) {
        onAdd(result.selection.map((c) => ({ id: c.id, title: c.title })));
      }
    } catch (error) {
      console.error("Collection picker error:", error);
    }
  };

  return (
    <BlockStack gap="200">
      <p style={{ fontSize: "14px", fontWeight: 500, color: "#202223" }}>
        Collections
      </p>
      <s-button onClick={openPicker}>Select Collections</s-button>
      {selected.length > 0 && (
        <InlineStack gap="100" wrap>
          {selected.map((c) => (
            <Tag key={c.id} onRemove={() => onRemove(c.id)}>
              {c.title}
            </Tag>
          ))}
        </InlineStack>
      )}
    </BlockStack>
  );
};

const OfferMain = ({
  applyTo,
  setApplyTo,
  status,
  setStatus,
  requiredQuantity,
  setRequiredQuantity,
  trackBy,
  setTrackBy,
  sameAsGift,
  setSameAsGift,
  selectedProducts,
  setSelectedProducts,
  selectedVendors,
  setSelectedVendors,
  selectedTypes,
  setSelectedTypes,
  selectedCollections,
  setSelectedCollections,
}) => {
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
      });
      if (result?.selection) {
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

  return (
    <s-section>
      <s-card padding="large">
        <s-stack direction="block" gap="large">
          <s-heading>Offer Condition</s-heading>

          <s-card
            padding="base"
            background="subdued"
            border="base"
            borderRadius="base"
          >
            <s-stack direction="block" gap="base">
              {/* Required quantity */}
              <s-text-field
                label="Number of products required to qualify"
                type="number"
                min="1"
                value={String(requiredQuantity)}
                onChange={(e) => setRequiredQuantity(e.target.value)}
                placeholder="1"
              />

              {/* Same as gift */}
              <s-checkbox
                label="Gifts will be the same as selected products"
                checked={sameAsGift}
                onChange={(e) => setSameAsGift(e.target.checked)}
              />

              {/* Track by — only shown when sameAsGift is true */}
              {sameAsGift && (
                <s-stack direction="inline" gap="large">
                  <s-checkbox
                    label="Track by product"
                    checked={trackBy === "PRODUCT"}
                    onChange={() => setTrackBy("PRODUCT")}
                  />
                  <s-checkbox
                    label="Track by variant"
                    checked={trackBy === "VARIANT"}
                    onChange={() => setTrackBy("VARIANT")}
                  />
                </s-stack>
              )}

              {/* Apply To */}
              <s-select
                label="Apply To"
                value={applyTo}
                onChange={(e) => setApplyTo(e.target.value)}
              >
                <s-option value="selectedProducts">Selected Products</s-option>
                <s-option value="productsInSelectedVendorTypeCollection">
                  Products in selected vendors / types / collections
                </s-option>
              </s-select>

              {/* Selected Products */}
              {applyTo === "selectedProducts" && (
                <BlockStack gap="300">
                  <s-button onClick={openProductPicker}>
                    Select Products
                  </s-button>

                  {selectedProducts.length > 0 && (
                    <BlockStack gap="200">
                      <p style={{ fontSize: "13px", color: "#6d7175" }}>
                        {selectedProducts.length} product(s) selected
                      </p>
                      {selectedProducts.map((product) => (
                        <div
                          key={product.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "40px 1fr auto",
                            gap: "12px",
                            alignItems: "center",
                            padding: "10px",
                            border: "1px solid #e1e3e5",
                            borderRadius: "8px",
                            background: "#fff",
                          }}
                        >
                          <img
                            src={
                              product.images?.[0]?.originalSrc ||
                              product.featuredImage?.url ||
                              "/placeholder.png"
                            }
                            width="40"
                            height="40"
                            alt={product.title}
                            style={{ borderRadius: "4px", objectFit: "cover" }}
                          />
                          <div>
                            <p
                              style={{
                                fontSize: "14px",
                                fontWeight: 500,
                                margin: 0,
                              }}
                            >
                              {product.title}
                            </p>
                            {product.vendor && (
                              <p
                                style={{
                                  fontSize: "12px",
                                  color: "#6d7175",
                                  margin: 0,
                                }}
                              >
                                {product.vendor}
                              </p>
                            )}
                          </div>
                          <s-button
                            tone="critical"
                            variant="plain"
                            size="compact"
                            onClick={() => removeProduct(product.id)}
                          >
                            Remove
                          </s-button>
                        </div>
                      ))}
                    </BlockStack>
                  )}
                </BlockStack>
              )}

              {/* Vendor / Type / Collection */}
              {applyTo === "productsInSelectedVendorTypeCollection" && (
                <BlockStack gap="400">
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
                    onAdd={(newCollections) =>
                      setSelectedCollections((prev) => {
                        const existingIds = new Set(prev.map((c) => c.id));
                        return [
                          ...prev,
                          ...newCollections.filter(
                            (c) => !existingIds.has(c.id),
                          ),
                        ];
                      })
                    }
                    onRemove={(id) =>
                      setSelectedCollections((prev) =>
                        prev.filter((x) => x.id !== id),
                      )
                    }
                  />
                </BlockStack>
              )}
            </s-stack>
          </s-card>
        </s-stack>
        <s-select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <s-option value="active">Active</s-option>
          <s-option value="inactive">Inactive</s-option>
        </s-select>
      </s-card>
    </s-section>
  );
};

export default OfferMain;
