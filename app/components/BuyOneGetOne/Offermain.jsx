import { useState, useRef, useEffect } from "react";
import {
  Tag,
  InlineStack,
  BlockStack,
  Card,
  Select,
  TextField,
  Checkbox,
  RadioButton,
  Button,
  Text,
  Box,
  Thumbnail,
} from "@shopify/polaris";

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
        <Text as="p" variant="bodyMd" fontWeight="medium">
          {label}
        </Text>
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
            marginTop: "4px",
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
      <Text as="p" variant="bodyMd" fontWeight="medium">
        Collections
      </Text>
      <Box>
        <Button onClick={openPicker}>Select Collections</Button>
      </Box>
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

  const applyToOptions = [
    { label: "Selected Products", value: "selectedProducts" },
    {
      label: "Products in selected vendors / types / collections",
      value: "productsInSelectedVendorTypeCollection",
    },
  ];

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  return (
    <Card padding="500">
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Offer Condition
        </Text>

        <Box
          padding="400"
          background="bg-surface-secondary"
          borderWidth="025"
          borderColor="border"
          borderRadius="200"
        >
          <BlockStack gap="400">
            {/* Required quantity */}
            <TextField
              label="Number of products required to qualify"
              type="number"
              min={1}
              value={String(requiredQuantity)}
              onChange={(value) => setRequiredQuantity(value)}
              placeholder="1"
              autoComplete="off"
            />

            {/* Same as gift */}
            <Checkbox
              label="Gifts will be the same as selected products"
              checked={sameAsGift}
              onChange={(checked) => setSameAsGift(checked)}
            />

            {/* Track by — only shown when sameAsGift is true */}
            {sameAsGift && (
              <InlineStack gap="500">
                <RadioButton
                  label="Track by product"
                  checked={trackBy === "PRODUCT"}
                  id="trackByProduct"
                  name="trackBy"
                  onChange={() => setTrackBy("PRODUCT")}
                />
                <RadioButton
                  label="Track by variant"
                  checked={trackBy === "VARIANT"}
                  id="trackByVariant"
                  name="trackBy"
                  onChange={() => setTrackBy("VARIANT")}
                />
              </InlineStack>
            )}

            {/* Apply To */}
            <Select
              label="Apply To"
              value={applyTo}
              options={applyToOptions}
              onChange={(value) => setApplyTo(value)}
            />

            {/* Selected Products */}
            {applyTo === "selectedProducts" && (
              <BlockStack gap="300">
                <Box>
                  <Button onClick={openProductPicker}>Select Products</Button>
                </Box>

                {selectedProducts.length > 0 && (
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">
                      {selectedProducts.length} product(s) selected
                    </Text>
                    {selectedProducts.map((product) => (
                      <Card key={product.id} padding="300">
                        <InlineStack
                          align="space-between"
                          blockAlign="center"
                          wrap={false}
                          gap="300"
                        >
                          <InlineStack
                            blockAlign="center"
                            gap="300"
                            wrap={false}
                          >
                            <Thumbnail
                              source={
                                product.images?.[0]?.originalSrc ||
                                product.featuredImage?.url ||
                                "https://cdn.shopify.com/s/files/1/0757/9955/files/placeholder-images-image_large.png"
                              }
                              size="small"
                              alt={product.title}
                            />
                            <BlockStack gap="0">
                              <Text as="p" variant="bodyMd" fontWeight="medium">
                                {product.title}
                              </Text>
                              {product.vendor && (
                                <Text as="p" variant="bodySm" tone="subdued">
                                  {product.vendor}
                                </Text>
                              )}
                            </BlockStack>
                          </InlineStack>
                          <Button
                            tone="critical"
                            variant="plain"
                            size="slim"
                            onClick={() => removeProduct(product.id)}
                          >
                            Remove
                          </Button>
                        </InlineStack>
                      </Card>
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
                        ...newCollections.filter((c) => !existingIds.has(c.id)),
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
          </BlockStack>
        </Box>

        <Select
          label="Status"
          value={status}
          options={statusOptions}
          onChange={(value) => setStatus(value)}
        />
      </BlockStack>
    </Card>
  );
};

export default OfferMain;
