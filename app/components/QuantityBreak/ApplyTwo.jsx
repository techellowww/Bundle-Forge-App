<<<<<<< HEAD




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
=======
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
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be

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
<<<<<<< HEAD
    <s-stack direction="block" gap="small-200">
=======
    <BlockStack gap="200">
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
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
        </s-stack>
      )}
<<<<<<< HEAD
    </s-stack>
=======
    </BlockStack>
>>>>>>> e93eec2eef18eaba75c6d84fc6f82c73291e99be
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
    <s-stack direction="block" gap="small-200">
      <s-text as="p" variant="bodyMd" fontWeight="medium">
        Collections
      </s-text>
      <s-box>
        <s-button onClick={openPicker}>Select Collections</s-button>
      </s-box>
      {selected.length > 0 && (
        <InlineStack gap="100" wrap>
          {selected.map((c) => (
            <Tag key={c.id} onRemove={() => onChange(selected.filter(x => x.id !== c.id))}>
              {c.title}
            </Tag>
          ))}
        </s-stack>
      )}
    </s-stack>
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
    <s-box background="surface" borderRadius="300" shadow="100" padding="large">
      <s-stack direction="block" gap="large">
        <s-text as="h2" variant="headingMd">
          Offers
        </s-text>

        <s-select label="Apply To" value={applyTo} onChange={(e) => (value) => setApplyTo(value)(e.target.value)}>
    {applyToOptions.map(opt => <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>)}
  </s-select>

        {isVendorTypeCollection && (
          <s-stack direction="block" gap="base">
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
          </s-stack>
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
                <s-stack direction="block" gap="small-200">
                  {displayProducts.map((product) => (
                    <s-box background="surface" borderRadius="300" shadow="100" padding="base" key={product.id}>
                      <s-stack direction="inline" justifyContent="space-between" alignItems="center" gap="base">
                        <s-stack direction="inline" alignItems="center" gap="base">
                          <s-thumbnail
                            source={
                              product.images?.[0]?.originalSrc ||
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
                </s-stack>
              </s-box>
            )}
          </s-box>
        )}

        <s-select label="Status" value={status} onChange={(e) => (value) => setStatus(value)(e.target.value)}>
    {statusOptions.map(opt => <s-option key={opt.value} value={opt.value}>{opt.label}</s-option>)}
  </s-select>
      </s-stack>
    </s-box>
  );
};

export default ApplyTwo;
