import { useState, useEffect, useRef } from "react";

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
    <s-stack direction="block" gap="small-200">
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
        <s-stack direction="inline" gap="small-100">
          {selected.map((item) => (
            <Chip key={item} onRemove={() => onRemove(item)}>
              {item}
            </Chip>
          ))}
        </s-stack>
      )}
    </s-stack>
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
    <s-stack direction="block" gap="small-200">
      <s-text as="p" variant="bodyMd" fontWeight="medium">
        Collections
      </s-text>
      <s-box>
        <s-button onClick={openPicker}>Select Collections</s-button>
      </s-box>
      {selected.length > 0 && (
        <s-stack direction="inline" gap="small-100">
          {selected.map((c) => (
            <Chip key={c.id} onRemove={() => onRemove(c.id)}>
              {c.title}
            </Chip>
          ))}
        </s-stack>
      )}
    </s-stack>
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

const UpsellTrigger = ({
  applyTo,
  setApplyTo,
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

  return (
    <s-box background="surface" borderRadius="300" shadow="100" padding="large">
        <s-stack direction="block" gap="large">
          <s-text as="h2" variant="headingMd">
            Offers
          </s-text>

          {/* ChoiceList web component needs onChange binding for an array. 
              According to standard web components, choice-list returns array of values on change. */}
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
                        <s-box key={product.id} background="surface" borderRadius="300" shadow="100" padding="base">
                          <s-stack
                            direction="inline"
                            justifyContent="space-between"
                            alignItems="center"
                            gap="base"
                          >
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
        </s-stack>
      </s-box>
  );
};

export default UpsellTrigger;
