const SelectGifts = ({
  discountType,
  setDiscountType,
  giftValue,
  setGiftValue,
  giftQuantity,
  setGiftQuantity,
  giftProducts,
  setGiftProducts,
}) => {
  const openGiftProductPicker = async () => {
    try {
      const result = await shopify.resourcePicker({
        type: "product",
        multiple: true,
      });
      if (result?.selection?.length) {
        setGiftProducts(
          result.selection.map((product) => ({
            id: product.id,
            title: product.title,
            images: product.images || [],
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
    setGiftProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  return (
    <s-section>
      <s-card padding="large">
        <s-stack direction="block" gap="large">
          <s-box borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-heading>Gift</s-heading>

              <s-grid
                padding="base"
                background="subdued"
                border="base"
                borderRadius="base"
                gridTemplateColumns="1fr 1fr"
                gap="small"
              >
                <s-select
                  label="Discount Type"
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                >
                  <s-option value="free">Free (100% off)</s-option>
                  <s-option value="percentage">Percentage</s-option>
                  <s-option value="fixedPrice">Fixed Amount</s-option>
                </s-select>

                {discountType === "percentage" && (
                  <s-text-field
                    label="Discount %"
                    type="number"
                    min="0"
                    max="100"
                    suffix="%"
                    placeholder="10"
                    value={String(giftValue ?? "")}
                    onChange={(e) => setGiftValue(e.target.value)}
                  />
                )}

                {discountType === "fixedPrice" && (
                  <s-text-field
                    label="Amount Off"
                    type="number"
                    min="0"
                    placeholder="10.00"
                    value={String(giftValue ?? "")}
                    onChange={(e) => setGiftValue(e.target.value)}
                  />
                )}
              </s-grid>

              <s-text-field
                label="Number of gifts for customer to receive"
                type="number"
                min="1"
                value={String(giftQuantity)}
                onChange={(e) => setGiftQuantity(e.target.value)}
                placeholder="1"
              />

              <s-box paddingBlockStart="base">
                <s-button onClick={openGiftProductPicker}>
                  Select Gift Products
                </s-button>

                {giftProducts?.length > 0 && (
                  <s-box paddingBlockStart="base">
                    <s-text as="p" variant="bodyMd" tone="subdued">
                      Selected Gift Products ({giftProducts.length})
                    </s-text>
                    <s-stack direction="block" gap="small">
                      {giftProducts.map((product) => (
                        <s-card key={product.id}>
                          <s-grid
                            gridTemplateColumns="auto 1fr auto"
                            gap="small"
                            blockAlignment="center"
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
                              style={{
                                borderRadius: "4px",
                                objectFit: "cover",
                              }}
                            />
                            <div>
                              <s-text variant="bodyMd">{product.title}</s-text>
                              {product.vendor && (
                                <s-text variant="bodySm" tone="subdued">
                                  {product.vendor}
                                </s-text>
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
                      ))}
                    </s-stack>
                  </s-box>
                )}
              </s-box>
            </s-stack>
          </s-box>
        </s-stack>
      </s-card>
    </s-section>
  );
};

export default SelectGifts;
