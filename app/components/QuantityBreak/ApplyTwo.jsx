import { useState, useEffect, useRef } from "react";
import {
  Tag,
  InlineStack,
  BlockStack,
  Card,
  Select,
  Text,
  Box,
  Button,
  Thumbnail,
} from "@shopify/polaris";

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
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const filtered = options.filter(
    (o) =>
      !selected.includes(o) &&
      o.toLowerCase().includes(inputValue.toLowerCase()),
  );

  // Close dropdown when clicking outside
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
    // keep open for multi-select
  };

  return (
    <BlockStack gap="200">
      <div ref={containerRef} style={{ position: "relative" }}>
        {/* Label */}
        <Text as="p" variant="bodyMd" fontWeight="medium">
          {label}
        </Text>

        {/* Input */}
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

        {/* Dropdown list */}
        {open && !loading && (
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
            {filtered.length > 0 ? (
              filtered.map((item) => (
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
              ))
            ) : (
              <div
                style={{
                  padding: "10px 14px",
                  fontSize: "14px",
                  color: "#6d7175",
                }}
              >
                {inputValue
                  ? `No results for "${inputValue}"`
                  : "All options selected"}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected tags */}
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

const ApplyTwo = ({
  applyTo,
  setApplyTo,
  status,
  setStatus,
  selectedProducts,
  setSelectedProducts,
  excludedProducts,
  setExcludedProducts,
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

  const applyToOptions = [
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

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  return (
    <Card padding="500">
      <BlockStack gap="500">
        <Text as="h2" variant="headingMd">
          Offers
        </Text>

        <Select
          label="Apply To"
          value={applyTo}
          options={applyToOptions}
          onChange={(value) => setApplyTo(value)}
        />

        {isVendorTypeCollection && (
          <BlockStack gap="400">
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
          </BlockStack>
        )}

        {(applyTo === "excludeProducts" || applyTo === "selectedProducts") && (
          <Box paddingBlockStart="400">
            <Button onClick={openProductPicker}>
              {applyTo === "excludeProducts"
                ? "Select Products to Exclude"
                : "Select Products"}
            </Button>

            {displayProducts?.length > 0 && (
              <Box paddingBlockStart="400">
                <BlockStack gap="200">
                  {displayProducts.map((product) => (
                    <Card key={product.id} padding="300">
                      <InlineStack
                        align="space-between"
                        blockAlign="center"
                        wrap={false}
                        gap="300"
                      >
                        <InlineStack blockAlign="center" gap="300" wrap={false}>
                          <Thumbnail
                            source={
                              product.images?.[0]?.originalSrc ||
                              "https://cdn.shopify.com/s/files/1/0757/9955/files/placeholder-images-image_large.png"
                            }
                            size="small"
                            alt={product.title}
                          />
                          <Text as="span" variant="bodyMd">
                            {product.title}
                          </Text>
                        </InlineStack>
                        <Button
                          tone="critical"
                          variant="plain"
                          onClick={() => removeProduct(product.id)}
                        >
                          Remove
                        </Button>
                      </InlineStack>
                    </Card>
                  ))}
                </BlockStack>
              </Box>
            )}
          </Box>
        )}

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

export default ApplyTwo;
