const ShippingDiscount = ({
  discountType,
  setDiscountType,
  shippingDiscountValue,
  setShippingDiscountValue,
  enableFreeShipping,
  setEnableFreeShipping,
  freeShippingProductName,
  setFreeShippingProductName,
}) => {
  return (
    <s-section>
      <s-box background="surface" borderRadius="300" shadow="100" padding="large">
        <s-stack direction="block" gap="large">
          <s-box borderRadius="base">
            <s-stack direction="block" gap="base">
              <s-heading>Shipping Discount</s-heading>

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
                    value={String(shippingDiscountValue)}
                    onChange={(e) => setShippingDiscountValue(e.target.value)}
                  />
                )}

                {discountType === "fixedPrice" && (
                  <s-text-field
                    label="Amount"
                    type="number"
                    min="0"
                    placeholder="10.00"
                    value={String(shippingDiscountValue)}
                    onChange={(e) => setShippingDiscountValue(e.target.value)}
                  />
                )}
              </s-grid>

              <s-box background="surface" borderRadius="300" shadow="100" padding="base" background="bg-surface-secondary">
                <s-stack direction="block" gap="base">
                  <s-checkbox
                    label="Create free shipping for products"
                    checked={enableFreeShipping}
                    onChange={(e) => setEnableFreeShipping(e.target.checked)}
                  />

                  {enableFreeShipping && (
                    <s-text-field
                      label="Free shipping product name"
                      placeholder="Free Shipping"
                      value={freeShippingProductName}
                      onChange={(e) =>
                        setFreeShippingProductName(e.target.value)
                      }
                    />
                  )}
                </s-stack>
              </s-box>
            </s-stack>
          </s-box>
        </s-stack>
      </s-box>
    </s-section>
  );
};

export default ShippingDiscount;
