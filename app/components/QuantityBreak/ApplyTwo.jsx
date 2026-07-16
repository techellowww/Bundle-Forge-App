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
  Autocomplete,
  Icon,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";

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

  useEffect(() => {
    const formatted = options.map((opt) => ({ value: opt, label: opt }));
    setAutocompleteOptions(formatted);
  }, [options]);

  const updateText = (value) => {
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

  const textField = (
    <Autocomplete.TextField
      onChange={updateText}
      label={label}
      value={inputValue}
      placeholder={loading ? "Loading..." : placeholder}
      autoComplete="off"
      disabled={loading}
      prefix={<Icon source={SearchIcon} tone="base" />}
    />
  );

  return (
    <BlockStack gap="200">
      <Autocomplete
        allowMultiple
        options={autocompleteOptions}
        selected={selected}
        textField={textField}
        onSelect={(selectedArr) => {
          const added = selectedArr.find((s) => !selected.includes(s));
          if (added) onAdd(added);

          const removed = selected.find((s) => !selectedArr.includes(s));
          if (removed) onRemove(removed);

          setInputValue("");
        }}
      />

      {selected.length > 0 && (
        <InlineStack gap="100" wrap>
          {selected.map((item) => (
            <Tag key={item} onRemove={() => onRemove(item)}>
              {item}
            </Tag>
          ))}
        </InlineStack>
      )}
    </BlockStack>
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
            <Tag key={c.id} onRemove={() => onChange(selected.filter(x => x.id !== c.id))}>
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
              onChange={setSelectedCollections}
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
