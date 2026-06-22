const BundleOffer = ({
  title,
  setTitle,
  description,
  setDescription,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  status,
  setStatus,
  selectProducts,
  setSelectProducts,
  offerPercentage,
  setOfferPercentage,
}) => {
  const MAX_PRODUCTS = 4;

  const openGiftProductPicker = async () => {
    try {
      const result = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });

      if (result?.selection?.length) {
        setSelectProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));

          const newProducts = result.selection
            .filter((p) => !existingIds.has(p.id))
            .map((product) => ({
              id: product.id,
              title: product.title,
              images: product.images || [],
              featuredImage: product.featuredImage || null,
              vendor: product.vendor,
              productType: product.productType,
              price: product.variants?.[0]?.price
                ? parseFloat(product.variants[0].price)
                : null,
            }));

          const merged = [...prev, ...newProducts];

          if (merged.length > MAX_PRODUCTS) {
            alert(`You can only select up to ${MAX_PRODUCTS} products.`);
            return prev;
          }

          return merged;
        });
      }
    } catch (error) {
      console.error("Gift product picker error:", error);
    }
  };

  const removeGiftProduct = (productId) => {
    setSelectProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const isAtLimit = selectProducts?.length >= MAX_PRODUCTS;

  const getDiscountedPrice = (originalPrice) => {
    if (!originalPrice || !offerPercentage) return null;
    const pct = parseFloat(offerPercentage);
    if (isNaN(pct) || pct <= 0 || pct > 100) return null;
    return (originalPrice * (1 - pct / 100)).toFixed(2);
  };

  return (
    <s-section>
      <s-card padding="large">
        <s-stack gap="large">
          <s-heading>Bundle offer</s-heading>
          <s-text-field
            label="Offer Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <s-text-field
            label="Discount description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <s-grid gridTemplateColumns="1fr 1fr" gap="small">
            <s-date-field
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <s-date-field
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </s-grid>

          <s-text-field
            label="Offer Percentage"
            type="number"
            min="1"
            max="100"
            suffix="%"
            value={offerPercentage ?? ""}
            onChange={(e) => setOfferPercentage(e.target.value)}
            helpText="Enter the discount % customers get when they buy all bundle products together."
          />

          <s-heading>Information</s-heading>
          <s-paragraph>
            Select minimum of 2 products and maximum of 4 products to create a
            bundle.
          </s-paragraph>

          <s-box paddingBlockStart="base">
            <s-button onClick={openGiftProductPicker} disabled={isAtLimit}>
              {isAtLimit ? "Maximum products selected" : "Select Products"}
            </s-button>

            {selectProducts?.length > 0 && (
              <s-box paddingBlockStart="base">
                <s-text as="p" variant="bodyMd" tone="subdued">
                  Selected Products ({selectProducts.length} / {MAX_PRODUCTS})
                </s-text>
                <s-stack direction="block" gap="small">
                  {selectProducts.map((product) => {
                    const discounted = getDiscountedPrice(product.price);
                    return (
                      <s-card key={product.id}>
                        <s-grid
                          gridTemplateColumns="auto 1fr auto"
                          gap="small"
                          blockAlignment="center"
                        >
                          <img
                            src={
                              product.featuredImage?.url ||
                              product.images?.[0]?.url ||
                              product.images?.[0]?.originalSrc ||
                              "/placeholder.png"
                            }
                            width="40"
                            height="40"
                            alt={product.title}
                            style={{ borderRadius: "4px", objectFit: "cover" }}
                          />
                          <div>
                            <s-text variant="bodyMd">{product.title}</s-text>
                            {product.vendor && (
                              <s-text variant="bodySm" tone="subdued">
                                {product.vendor}
                              </s-text>
                            )}
                            {product.price != null && (
                              <div
                                style={{
                                  marginTop: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                {discounted ? (
                                  <>
                                    <s-text
                                      variant="bodySm"
                                      tone="subdued"
                                      style={{ textDecoration: "line-through" }}
                                    >
                                      ${product.price.toFixed(2)}
                                    </s-text>
                                    <s-text variant="bodySm" tone="success">
                                      ${discounted}
                                    </s-text>
                                  </>
                                ) : (
                                  <s-text variant="bodySm" tone="subdued">
                                    ${product.price.toFixed(2)}
                                  </s-text>
                                )}
                              </div>
                            )}
                          </div>
                          <s-button
                            tone="critical"
                            variant="plain"
                            onClick={() => removeGiftProduct(product.id)}
                            size="compact"
                          >
                            Remove
                          </s-button>
                        </s-grid>
                      </s-card>
                    );
                  })}
                </s-stack>
              </s-box>
            )}
          </s-box>

          <s-select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <s-option value="active">Active</s-option>
            <s-option value="inactive">Inactive</s-option>
          </s-select>
        </s-stack>
      </s-card>
    </s-section>
  );
};

export default BundleOffer;
